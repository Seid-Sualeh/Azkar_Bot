// =========================
// 🌿 GLOBAL AZKAR BOT FOR THE UMMAH
// =========================
require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const moment = require("moment-timezone");
// moment-hijri extends moment with Islamic calendar support. Try to load it
// but do not crash if the package is not installed — fall back to an API.
let hasMomentHijri = false;
try {
  require("moment-hijri");
  hasMomentHijri = true;
} catch (err) {
  console.warn(
    "moment-hijri not installed — Hijri fallback will use AlAdhan API",
  );
}
const schedule = require("node-schedule");
const axios = require("axios");
const tzlookup = require("tz-lookup");
const { morningAzkar, eveningAzkar } = require("./azkar");

// =========================
// ⚙️ CONFIGURATION
// =========================
const app = express();
app.use(express.json());

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = process.env.BASE_URL;
const PORT = process.env.PORT || 10000;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
bot.setWebHook(`${BASE_URL}/bot${TELEGRAM_BOT_TOKEN}`);

// 🎧 Telegram File IDs for reliable playback
const EVENING_AZKAR_AUDIO_URL =
  "CQACAgQAAxkBAAIB1mkSF6YAATuqRMsf6ltsstN7cBF2AgACVBsAAnIgmFCdAp6NN7xkTzYE";
const MORNING_AZKAR_AUDIO_URL =
  "CQACAgQAAxkBAAIB12kSF8PTTm8Je5x7Q9FR8_xoimVdAAJVGwACciCYUAG5ohcJtejINgQ";
const SURAH_KAHF_AUDIO_PATH = "./audio/surah_kahf.mp3";

// 🗄️ Database-based storage for persistence
const { initializeDatabase, userOperations } = require("./database/init");

// Initialize database
initializeDatabase();

// Load users from database
let users = [];

// Load all users into memory for faster access (sync operation on startup)
function loadUsersFromDB() {
  try {
    const rows = userOperations.getAll.all();
    users = rows.map(row => ({
      id: row.chat_id,
      timezone: row.timezone,
      language: row.language,
      tzSource: row.tz_source,
      lastActive: row.last_active,
      // Add prayer notification preferences
      prayerNotifications: Boolean(row.prayer_notifications),
      fajrNotification: Boolean(row.fajr_notification),
      dhuhrNotification: Boolean(row.dhuhr_notification),
      asrNotification: Boolean(row.asr_notification),
      maghribNotification: Boolean(row.maghrib_notification),
      ishaNotification: Boolean(row.isha_notification)
    }));
    console.log(`📊 Loaded ${users.length} users from database`);
  } catch (error) {
    console.error("Error loading users from database:", error.message);
    users = []; // Fallback to empty array
  }
}

// Load users on startup
loadUsersFromDB();

// Save user to database
function saveUserToDB(user) {
  try {
    const existing = userOperations.getByChatId.get(user.id);
    if (existing) {
      // Update existing user
      userOperations.update.run(
        user.timezone || undefined,
        user.language || undefined,
        user.tzSource || undefined,
        user.lastActive || undefined,
        user.prayerNotifications !== undefined ? (user.prayerNotifications ? 1 : 0) : undefined,
        user.fajrNotification !== undefined ? (user.fajrNotification ? 1 : 0) : undefined,
        user.dhuhrNotification !== undefined ? (user.dhuhrNotification ? 1 : 0) : undefined,
        user.asrNotification !== undefined ? (user.asrNotification ? 1 : 0) : undefined,
        user.maghribNotification !== undefined ? (user.maghribNotification ? 1 : 0) : undefined,
        user.ishaNotification !== undefined ? (user.ishaNotification ? 1 : 0) : undefined,
        user.id
      );
    } else {
      // Create new user
      userOperations.create.run(
        user.id,
        user.timezone,
        user.language,
        user.tzSource,
        user.lastActive
      );
    }
    
    // Update in-memory cache
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
  } catch (error) {
    console.error("Error saving user to database:", error.message);
  }
}

// Get user by chatId
function getUserById(chatId) {
  return users.find(u => u.id === chatId);
}

// Delete user from database
function deleteUserFromDB(chatId) {
  try {
    userOperations.delete.run(chatId);
    // Remove from memory
    users = users.filter(u => u.id !== chatId);
  } catch (error) {
    console.error("Error deleting user from database:", error.message);
  }
}

// =========================
// 🌍 Helper Functions
// =========================

// 🌐 Detect user timezone via IP API or coordinates
async function getUserTimezone(lat, lon) {
  // If coordinates provided, use tz-lookup for accurate IANA timezone
  try {
    if (typeof lat === "number" && typeof lon === "number") {
      const tz = tzlookup(lat, lon);
      if (tz) return tz;
    }
  } catch (err) {
    console.warn("tz-lookup failed:", err && err.message);
  }

  // Fallback to IP-based lookup (best-effort)
  try {
    const res = await axios.get("https://ipapi.co/json/");
    return res.data.timezone || "Africa/Addis_Ababa";
  } catch {
    return "Africa/Addis_Ababa";
  }
}

// Update user's last active timestamp (creates user record if missing)
async function updateLastActive(chatId) {
  try {
    const user = users.find((u) => u.id === chatId);
    const now = moment().toISOString();
    if (user) {
      user.lastActive = now;
      saveUserToDB(user);
      return;
    }

    // If user doesn't exist yet, create minimal record with auto timezone
    const tz = await getUserTimezone();
    const newUser = {
      id: chatId,
      timezone: tz,
      language: "Arabic",
      tzSource: "auto",
      lastActive: now,
    };
    users.push(newUser);
    saveUserToDB(newUser);
  } catch (err) {
    console.error("Error updating last active for", chatId, err && err.message);
  }
}

// Return number of users active in the current calendar month
function getMonthlyActiveCount() {
  const now = moment();
  return users.filter(
    (u) => u.lastActive && moment(u.lastActive).isSame(now, "month"),
  ).length;
}

// Optionally: return number of users active in last 30 days
function getActiveLast30DaysCount() {
  const cutoff = moment().subtract(30, "days");
  return users.filter(
    (u) => u.lastActive && moment(u.lastActive).isAfter(cutoff),
  ).length;
}

// 🕋 Format Azkar text based on user language
function formatAzkarMessage(azkarList, title, lang) {
  let msg = `🌿 *${title}* 🌿\n\n`;

  azkarList.forEach((azkar, i) => {
    msg += `✨ *${i + 1}.*\n`;

    if (lang === "Arabic") {
      msg += `🕋 _${azkar.arabic}_\n`;
      msg += `🔁 *عدد التكرار:* \`${azkar.repetitions}x\`\n`;
      msg += `📖 *المصدر:* _${azkar.source}_\n\n`;
    } else if (lang === "English") {
      msg += `🇬🇧 *Meaning:* _${azkar.english}_\n`;
      msg += `🔁 *Repeat:* \`${azkar.repetitions}x\`\n`;
      msg += `📖 *Source:* _${azkar.source}_\n\n`;
    } else if (lang === "Amharic") {
      msg += `🇪🇹 *ትርጉም:* _${azkar.amharic}_\n`;
      msg += `🔁 *ይድገሙ:* \`${azkar.repetitions} ጊዜ\`\n`;
      msg += `📖 *ምንጭ:* _${azkar.source}_\n\n`;
    }
  });

  return msg;
}

// ✂️ Send long text safely in chunks
async function sendLongMessage(chatId, text, options = {}) {
  const chunks = text.match(/[\s\S]{1,4000}/g) || [];
  for (const chunk of chunks) {
    try {
      await bot.sendMessage(chatId, chunk, options);
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error sending message to ${chatId}:`, error.message);
    }
  }
}

// =========================
// 🤖 TELEGRAM BOT COMMANDS
// =========================
// Function to calculate days until Ramadan
function getDaysUntilRamadan() {
  const now = moment();
  const currentYear = now.year();

  // Ramadan dates for the next few years (approximate, adjust as needed)
  const ramadanDates = {
    2026: { start: moment("2026-02-18"), end: moment("2026-03-19") },
    2027: { start: moment("2027-02-08"), end: moment("2027-03-10") },
    2028: { start: moment("2028-01-28"), end: moment("2028-02-26") },
  };

  // Check if current date is within Ramadan
  const ramadanInfo = ramadanDates[currentYear];
  if (
    ramadanInfo &&
    now.isBetween(ramadanInfo.start, ramadanInfo.end, null, "[]")
  ) {
    return { days: 0, message: "Ramadan Mubarak! 🌙" };
  }

  // Find the next Ramadan start date
  let nextRamadanStart = null;
  for (let year = currentYear; year <= currentYear + 2; year++) {
    if (ramadanDates[year] && now.isBefore(ramadanDates[year].start)) {
      nextRamadanStart = ramadanDates[year].start;
      break;
    }
  }

  if (!nextRamadanStart) {
    return { days: null, message: "Ramadan dates not available." };
  }

  const daysUntil = nextRamadanStart.diff(now, "days");
  return {
    days: daysUntil,
    message: `Ramadan starts in ${daysUntil} days! 🌙`,
  };
}

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const name = msg.from.first_name || "Akhi/Akhti";
  const timezone = await getUserTimezone();

  if (!users.find((u) => u.id === chatId)) {
     const newUser = { id: chatId, timezone, language: "Arabic", tzSource: "auto" };
     users.push(newUser);
     saveUserToDB(newUser);
     console.log(`🆕 New user registered: ${chatId} in ${timezone}`);
   }

  const welcome = `
🕌 *As-salamu Alaikum ${name}!*
🌿 Welcome to the *Azkar Reminder Bot*

☀️ Morning Azkar → 7:00 AM
🌙 Evening Azkar → 5:00 PM
🌍 Detected timezone: *${timezone}* to get your time zone please share location

Would you like to subscribe to daily Azkar reminders?
`;

  const ramadanCountdown = getDaysUntilRamadan();
  if (ramadanCountdown.days !== null) {
    await bot.sendMessage(chatId, ramadanCountdown.message, {
      parse_mode: "Markdown",
    });
  }

  bot.sendMessage(chatId, welcome, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "📿 Subscribe", callback_data: "subscribe_user" }],
        [{ text: "📍 Share Location", callback_data: "share_location" }],
      ],
    },
  });
});

bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const user = users.find((u) => u.id === chatId);
  // record activity for stats
  await updateLastActive(chatId);
  // Acknowledge callback to remove loading state in the client
  try {
    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (e) {}

  if (data.startsWith("lang_")) {
    if (!user) return;

     if (data === "lang_arabic") user.language = "Arabic";
     else if (data === "lang_english") user.language = "English";
     else if (data === "lang_amharic") user.language = "Amharic";

     saveUserToDB(user);

    const msgByLang = {
      Arabic:
        "✅ تم تعيين اللغة إلى العربية. ستتلقى الأذكار بهذه اللغة إن شاء الله.",
      English:
        "✅ Language set to English. You'll now receive Azkar in English.",
      Amharic: "✅ ቋንቋዎን ወደ አማርኛ ቀይረዋል። አዝካር በአማርኛ ቋንቋ ይደርሳችሁ።",
    };

    return bot.sendMessage(chatId, msgByLang[user.language], {
      parse_mode: "Markdown",
    });
  }

  if (data === "subscribe_user") {
    if (!user) {
      const timezone = await getUserTimezone();
      users.push({
        id: chatId,
        timezone,
        language: "Arabic",
        tzSource: "auto",
      });
      saveUserToDB(user);
    }

    bot.sendMessage(
      chatId,
      "✅ You are now subscribed to daily Azkar reminders! Choose your language below:",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🕋 Arabic", callback_data: "lang_arabic" },
              { text: "🇬🇧 English", callback_data: "lang_english" },
              { text: "🇪🇹 Amharic", callback_data: "lang_amharic" },
            ],
          ],
        },
      },
    );
  }

  if (data === "share_location") {
    // Ask user to send location via Telegram's location keyboard
    bot.sendMessage(
      chatId,
      "Please share your location so I can set your timezone accurately.",
      {
        reply_markup: {
          keyboard: [[{ text: "Share Location", request_location: true }]],
          one_time_keyboard: true,
        },
      },
    );
  }

  // Support quick actions from inline menu
  if (data === "mytime") {
    return sendUserTime(chatId);
  }
  if (data === "test") {
    return sendTestTo(chatId);
  }
   if (data === "stop") {
     users = users.filter((u) => u.id !== chatId);
     deleteUserFromDB(chatId);
     return bot.sendMessage(
       chatId,
       "🛑 You have unsubscribed from Azkar reminders. You can rejoin anytime using /start",
     );
   }
  if (data === "help") {
    return sendHelp(chatId);
  }
  if (data === "stats") {
    const monthly = getMonthlyActiveCount();
    const last30 = getActiveLast30DaysCount();
    const text = `📊 *Usage Stats:*
• Total subscribed users: *${users.length}*
• Active this calendar month: *${monthly}*
• Active in last 30 days: *${last30}*
`;
    return bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
  }
  if (data === "ramadan") {
    const ramadanCountdown = getDaysUntilRamadan();
    return bot.sendMessage(chatId, ramadanCountdown.message, {
      parse_mode: "Markdown",
    });
  }
});

bot.onText(/\/help/, (msg) => {
  return sendHelp(msg.chat.id);
});

// Helper that sends help text (used by /help and menu callbacks)
function sendHelp(chatId) {
  const helpMessage = `
🤖 *Available Commands:*
/start - Start or restart the bot
/menu - Show interactive menu
/help - Show this help message
/test - Send a sample Azkar message
/stop - Unsubscribe from daily reminders
/mytime - Check your current time and settings
/stats - Show monthly/30-day active users
/ramadan - Show days until Ramadan

🕓 *Reminder Times:*
☀️ Morning: 7:00 AM
🌙 Evening: 5:00 PM (17:00)
`;
  return bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
}

bot.onText(/\/stop/, (msg) => {
   const chatId = msg.chat.id;
   users = users.filter((u) => u.id !== chatId);
   deleteUserFromDB(chatId);
   bot.sendMessage(
     chatId,
     "🛑 You have unsubscribed from Azkar reminders. You can rejoin anytime using /start",
   );
 });

// 🧭 Test Command
bot.onText(/\/test/, async (msg) => {
  const chatId = msg.chat.id;
  const now = moment().tz("Africa/Addis_Ababa");
  const user = users.find((u) => u.id === chatId);
  const lang = user ? user.language : "Arabic";

  const isMorning = now.hour() >= 5 && now.hour() < 12;
  const message = isMorning
    ? formatAzkarMessage(morningAzkar, "☀️ Morning Azkar", lang)
    : formatAzkarMessage(eveningAzkar, "🌙 Evening Azkar", lang);

  const audioLink = isMorning
    ? MORNING_AZKAR_AUDIO_URL
    : EVENING_AZKAR_AUDIO_URL;
  const captionText = isMorning
    ? "*Morning Azkar Audio*"
    : "*Evening Azkar Audio*";

  await sendLongMessage(chatId, message, { parse_mode: "Markdown" });
  await bot.sendAudio(chatId, audioLink, {
    caption: captionText,
    parse_mode: "Markdown",
  });
});

// Helper to send test Azkar to a chat (used by /test and menu)
async function sendTestTo(chatId) {
  const now = moment().tz("Africa/Addis_Ababa");
  const user = users.find((u) => u.id === chatId);
  const lang = user ? user.language : "Arabic";

  const isMorning = now.hour() >= 5 && now.hour() < 12;
  const message = isMorning
    ? formatAzkarMessage(morningAzkar, "☀️ Morning Azkar", lang)
    : formatAzkarMessage(eveningAzkar, "🌙 Evening Azkar", lang);

  const audioLink = isMorning
    ? MORNING_AZKAR_AUDIO_URL
    : EVENING_AZKAR_AUDIO_URL;
  const captionText = isMorning
    ? "*Morning Azkar Audio*"
    : "*Evening Azkar Audio*";

  await sendLongMessage(chatId, message, { parse_mode: "Markdown" });
  await bot.sendAudio(chatId, audioLink, {
    caption: captionText,
    parse_mode: "Markdown",
  });
}

// 🕐 Time Check Command
bot.onText(/\/mytime/, async (msg) => {
  const chatId = msg.chat.id;
  return sendUserTime(chatId);
});

// 🕌 Ramadan Countdown Command
bot.onText(/\/ramadan/, async (msg) => {
  const chatId = msg.chat.id;
  const ramadanCountdown = getDaysUntilRamadan();
  await bot.sendMessage(chatId, ramadanCountdown.message, {
    parse_mode: "Markdown",
  });
});

// Menu command - show inline buttons for all main actions
bot.onText(/\/menu/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, "🌿 Main Menu — choose an action:", {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "📿 Subscribe", callback_data: "subscribe_user" },
          { text: "📍 Share Location", callback_data: "share_location" },
        ],
        [
          { text: "🕓 My Time", callback_data: "mytime" },
          { text: "🧪 Test Azkar", callback_data: "test" },
        ],
        [
          { text: "📊 Stats", callback_data: "stats" },
          { text: "🛑 Unsubscribe", callback_data: "stop" },
        ],
        [{ text: "❓ Help", callback_data: "help" }],
        [{ text: "📖 Read Surah", callback_data: "read_surah" }],
        [{ text: "📅 Date in Hijri", callback_data: "date_hijri" }],
        [
          { text: "🕋 Arabic", callback_data: "lang_arabic" },
          { text: "🇬🇧 English", callback_data: "lang_english" },
          { text: "🇪🇹 Amharic", callback_data: "lang_amharic" },
        ],
        [{ text: "🕌 Ramadan Countdown", callback_data: "ramadan" }],
      ],
    },
  });
});

// Helper to send time info for a given chatId (used by /mytime and inline menu)
async function sendUserTime(chatId) {
  const user = users.find((u) => u.id === chatId);

  if (!user) {
    return bot.sendMessage(
      chatId,
      "Please use /start first to set up your timezone.",
    );
  }

  const nowUTC = moment.utc();
  const userTime = nowUTC.clone().tz(user.timezone);
  // Hijri date (uses moment-hijri when available, otherwise AlAdhan API fallback)
  const hijri = await getHijriString(userTime);

  const timeInfo = `
🕐 *Your Current Settings:*
• Your Timezone: *${user.timezone}*
• Current Time: *${userTime.format("YYYY-MM-DD HH:mm:ss")}*
• Hijri Date: *${hijri}*
• Language: *${user.language}*
• Next Morning Azkar: *7:00 AM*
• Next Evening Azkar: *5:00 PM*

*Schedule Times in Your Timezone:*
⏰ 6:55 AM - Morning reminder
☀️ 7:00 AM - Morning Azkar  
⏰ 4:55 PM - Evening reminder  
🌙 5:00 PM - Evening Azkar

*Total Subscribed Users:* ${users.length}

*Ramadan Countdown:*
${getDaysUntilRamadan().message}
  `;

  return bot.sendMessage(chatId, timeInfo, { parse_mode: "Markdown" });
}

// Get Hijri date string for a given moment instance.
// Uses moment-hijri if available, otherwise falls back to AlAdhan API.
async function getHijriString(momentObj) {
  try {
    if (hasMomentHijri) {
      return momentObj.clone().format("iD iMMMM iYYYY");
    }

    // Fallback: call AlAdhan API: expects DD-MM-YYYY
    const date = momentObj.format("DD-MM-YYYY");
    const res = await axios.get(`https://api.aladhan.com/v1/gToH?date=${date}`);
    if (res && res.data && res.data.data && res.data.data.hijri) {
      const h = res.data.data.hijri;
      return `${h.day} ${h.month.en} ${h.year}`;
    }
  } catch (err) {
    console.warn("Failed to get Hijri date via API:", err && err.message);
  }
  return "N/A";
}

// Get prayer times for a user based on their timezone/location
// We'll approximate location from timezone since we don't store exact coordinates
async function getPrayerTimesForUser(user, dateObj) {
  try {
    // Since we don't store exact coordinates, we'll use a simple approach:
    // Use the timezone to get a rough location (this is not perfect but works for demo)
    // In a production app, you'd want to store user coordinates when they share location
    
    // For now, we'll return mock prayer times based on common patterns
    // In a real implementation, you'd call AlAdhan API with coordinates
    const dateStr = dateObj.format("YYYY-MM-DD");
    
    // Check if we have cached prayer times for this user/date
    const cached = prayerTimeOperations.getByChatIdAndDate.get(user.id, dateStr);
    if (cached) {
      return {
        fajr: cached.fajr,
        dhuhr: cached.dhuhr,
        asr: cached.asr,
        maghrib: cached.maghrib,
        isha: cached.isha
      };
    }
    
    // Since we don't have exact coordinates, we'll use approximate times
    // This is a simplification - in reality you'd need user's latitude/longitude
    // For demonstration, we'll use fixed offsets from solar noon
    
    // Get approximate solar noon for the timezone (simplified)
    const noonMoment = dateObj.clone().tz(user.timezone).set({ hour: 12, minute: 0, second: 0, millisecond: 0 });
    
    // Approximate prayer times (these should really come from AlAdhan API with coordinates)
    const fajrMoment = noonMoment.clone().subtract(4, 'hours');  // Approximate
    const dhuhrMoment = noonMoment.clone();                      // Solar noon
    const asrMoment = noonMoment.clone().add(3, 'hours');        // Approximate
    const maghribMoment = noonMoment.clone().add(6, 'hours');    // Approximate sunset
    const ishaMoment = noonMoment.clone().add(8, 'hours');       // Approximate
    
    const prayerTimes = {
      fajr: fajrMoment.format("HH:mm"),
      dhuhr: dhuhrMoment.format("HH:mm"),
      asr: asrMoment.format("HH:mm"),
      maghrib: maghribMoment.format("HH:mm"),
      isha: ishaMoment.format("HH:mm")
    };
    
    // Cache the prayer times
    prayerTimeOperations.upsert.run(
      user.id,
      dateStr,
      prayerTimes.fajr,
      prayerTimes.dhuhr,
      prayerTimes.asr,
      prayerTimes.maghrib,
      prayerTimes.isha
    );
    
    return prayerTimes;
  } catch (error) {
    console.error("Error getting prayer times for user:", error.message);
    // Return default times as fallback
    return {
      fajr: "05:00",
      dhuhr: "12:00",
      asr: "15:30",
      maghrib: "18:00",
      isha: "19:30"
    };
  }
}

// Format prayer time message for sending to user
function formatPrayerTimeMessage(prayerTimes, lang) {
  let msg = `🕌 *Prayer Times for Today* 🕌\n\n`;
  
  if (lang === "Arabic") {
    msg += `🕋 الفجر: *${prayerTimes.fajr}*\n`;
    msg += `🕋 الظهر: *${prayerTimes.dhuhr}*\n`;
    msg += `🕋 العصر: *${prayerTimes.asr}*\n`;
    msg += `🕋 المغرب: *${prayerTimes.maghrib}*\n`;
    msg += `🕋 العشاء: *${prayerTimes.isha}*\n\n`;
    msg += "لا تنسى الصلاة في وقتها\n";
  } else if (lang === "English") {
    msg += `🕋 Fajr: *${prayerTimes.fajr}*\n`;
    msg += `🕋 Dhuhr: *${prayerTimes.dhuhr}*\n`;
    msg += `🕋 Asr: *${prayerTimes.asr}*\n`;
    msg += `🕋 Maghrib: *${prayerTimes.maghrib}*\n`;
    msg += `🕋 Isha: *${prayerTimes.isha}*\n\n`;
    msg += "Don't forget to pray on time\n";
  } else if (lang === "Amharic") {
    msg += `🕋 የጠዋት: *${prayerTimes.fajr}*\n`;
    msg += `🕋 ሰዓት: *${prayerTimes.dhuhr}*\n`;
    msg += `🕋 የአረቀተሰዓት: *${prayerTimes.asr}*\n`;
    msg += `🕋 የጠዋት ጊዜ: *${prayerTimes.maghrib}*\n`;
    msg += `🕋 ሌሊት: *${prayerTimes.isha}*\n\n`;
    msg += "አትቀርብ የጠዋት ሰዓት።\n";
  }
  
  return msg;
}

// =========================
// ⏰ AZKAR SCHEDULE - WITH DEBUG LOGGING
// =========================
schedule.scheduleJob("* * * * *", async () => {
  const nowUTC = moment.utc();

  // Log every hour to verify the job is running
  if (nowUTC.minute() === 0) {
    console.log(
      `[${nowUTC.format("YYYY-MM-DD HH:mm:ss")} UTC] Checking ${
        users.length
      } users`,
    );
  }

  for (const user of users) {
    try {
      const userTime = nowUTC.clone().tz(user.timezone);
      const hour = userTime.hour();
      const minute = userTime.minute();
      const lang = user.language;

      // Log when we're about to send to specific users
      if ((hour === 7 && minute === 0) || (hour === 17 && minute === 0)) {
        console.log(
          `🕐 SENDING to user ${user.id} at ${userTime.format(
            "YYYY-MM-DD HH:mm:ss",
          )} ${user.timezone}`,
        );
      }

      // Morning reminder at 6:55
      if (hour === 6 && minute === 55) {
        console.log(`⏰ Morning reminder to ${user.id} in ${user.timezone}`);
        await bot.sendMessage(
          user.id,
          "⏰ Morning Azkar will start in 5 minutes, in shaa Allah ☀️",
        );
      }

      // Morning Azkar at 7:00
      if (hour === 7 && minute === 0) {
        console.log(
          `☀️ SENDING MORNING AZKAR to ${user.id} in ${user.timezone}`,
        );
        const msg = formatAzkarMessage(morningAzkar, "☀️ Morning Azkar", lang);
        await sendLongMessage(user.id, msg, { parse_mode: "Markdown" });
        await bot.sendAudio(user.id, MORNING_AZKAR_AUDIO_URL, {
          caption: "*Morning Azkar Audio*",
          parse_mode: "Markdown",
        });

        // Send Ramadan countdown
        const ramadanCountdown = getDaysUntilRamadan();
        if (ramadanCountdown.days !== null) {
          await bot.sendMessage(user.id, ramadanCountdown.message, {
            parse_mode: "Markdown",
          });
        }

        // If today is Friday (moment day(): Sunday=0 ... Friday=5), send Surah al-Kahf
        try {
          if (userTime.day() === 5) {
            // Announce Surah al-Kahf
            await bot.sendMessage(
              user.id,
              "📖 Today is Friday — please read or listen to *Surah al-Kahf* (Quran 18).",
              { parse_mode: "Markdown" },
            );

            // Prefer local audio if available, otherwise send a link to quran.com
            if (fs.existsSync(SURAH_KAHF_AUDIO_PATH)) {
              await bot.sendAudio(user.id, SURAH_KAHF_AUDIO_PATH, {
                caption: "*Surah al-Kahf (Quran 18)*",
                parse_mode: "Markdown",
              });
            } else {
              await bot.sendMessage(
                user.id,
                "🔗 Surah al-Kahf (Chapter 18): https://quran.com/18",
                { disable_web_page_preview: true },
              );
            }
          }
        } catch (err) {
          console.error(
            `Error sending Surah al-Kahf to ${user.id}:`,
            err && err.message,
          );
        }
      }

      // Evening reminder at 16:55
      if (hour === 16 && minute === 55) {
        console.log(`🌙 Evening reminder to ${user.id} in ${user.timezone}`);
        await bot.sendMessage(
          user.id,
          "🌙 Evening Azkar will start in 5 minutes, in shaa Allah 🤲",
        );
      }

      // Evening Azkar at 17:00
      if (hour === 17 && minute === 0) {
        console.log(
          `🌙 SENDING EVENING AZKAR to ${user.id} in ${user.timezone}`,
        );
        const msg = formatAzkarMessage(eveningAzkar, "🌙 Evening Azkar", lang);
        await sendLongMessage(user.id, msg, { parse_mode: "Markdown" });
        await bot.sendAudio(user.id, EVENING_AZKAR_AUDIO_URL, {
          caption: "*Evening Azkar Audio*",
          parse_mode: "Markdown",
        });

        // Send Ramadan countdown
        const ramadanCountdown = getDaysUntilRamadan();
        if (ramadanCountdown.days !== null) {
          await bot.sendMessage(user.id, ramadanCountdown.message, {
            parse_mode: "Markdown",
          });
        }
      }
    } catch (e) {
      console.error(`⚠️ Error sending azkar to user ${user.id}:`, e.message);
    }
  }
});

// =========================
// 🌐 WEBHOOK + SERVER
// =========================
app.post(`/bot${TELEGRAM_BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get("/", (req, res) => res.send("🌿 Azkar Bot is running, Alhamdulillah!"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    users: users.length,
    time: moment().format("YYYY-MM-DD HH:mm:ss"),
    timezone: moment.tz.guess(),
  });
});

// Record simple activity for any incoming message (text, sticker, etc.)
bot.on("message", async (msg) => {
  try {
    if (msg && msg.chat && msg.chat.id) {
      await updateLastActive(msg.chat.id);
    }
  } catch (err) {
    console.error("Error in message activity handler:", err && err.message);
  }
});

// Stats command to report monthly/30-day active users
bot.onText(/\/stats|\/monthly/, async (msg) => {
  const chatId = msg.chat.id;
  const monthly = getMonthlyActiveCount();
  const last30 = getActiveLast30DaysCount();
  const text = `📊 *Usage Stats:*
• Total subscribed users: *${users.length}*
• Active this calendar month: *${monthly}*
• Active in last 30 days: *${last30}*
`;
  bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
});

// Handle incoming location messages to set user's timezone
bot.on("location", async (msg) => {
  const chatId = msg.chat.id;
  const { latitude, longitude } = msg.location || {};
  if (!latitude || !longitude) return;

  try {
    const tz = await getUserTimezone(latitude, longitude);
    const user = users.find((u) => u.id === chatId);
    if (user) {
      user.timezone = tz;
      user.tzSource = "location";
      user.lastActive = moment().toISOString();
     } else {
       const newUser = {
         id: chatId,
         timezone: tz,
         language: "Arabic",
         tzSource: "location",
         lastActive: moment().toISOString(),
       };
       users.push(newUser);
       saveUserToDB(newUser);
     }
    // Confirm and show quick action menu
    await bot.sendMessage(chatId, `✅ Timezone set to *${tz}*. Thank you!`, {
      parse_mode: "Markdown",
    });

    // Inline menu with quick actions
    await bot.sendMessage(chatId, "What would you like to do next?", {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📿 Subscribe", callback_data: "subscribe_user" },
            { text: "📍 Update Location", callback_data: "share_location" },
          ],
          [{ text: "🕓 My Time", callback_data: "mytime" }],
        ],
      },
    });
  } catch (err) {
    console.error("Error handling location:", err && err.message);
    bot.sendMessage(
      chatId,
      "Sorry, I could not determine your timezone from that location.",
    );
  }
});

app.listen(PORT, () => {
  console.log(`✅ Bot running on port ${PORT}`);
  // console.log(`📊 Loaded ${users.length} users from storage`);
});
