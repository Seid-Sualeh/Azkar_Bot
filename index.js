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
    "moment-hijri not installed — Hijri fallback will use AlAdhan API"
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
const MORNING_AZKAR_AUDIO_URL =
  "CQACAgQAAxkBAAIB1mkSF6YAATuqRMsf6ltsstN7cBF2AgACVBsAAnIgmFCdAp6NN7xkTzYE";
const EVENING_AZKAR_AUDIO_URL =
  "CQACAgQAAxkBAAIB12kSF8PTTm8Je5x7Q9FR8_xoimVdAAJVGwACciCYUAG5ohcJtejINgQ";
const SURAH_KAHF_AUDIO_PATH = "./audio/surah_kahf.mp3";

// 🗄️ Simple file-based storage for persistence
const fs = require("fs");
const USERS_FILE = "./users.json";

// Load users from file
let users = loadUsers();

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading users:", error.message);
  }
  return [];
}

function saveUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Error saving users:", error.message);
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
      saveUsers();
      return;
    }

    // If user doesn't exist yet, create minimal record with auto timezone
    const tz = await getUserTimezone();
    users.push({
      id: chatId,
      timezone: tz,
      language: "Arabic",
      tzSource: "auto",
      lastActive: now,
    });
    saveUsers();
  } catch (err) {
    console.error("Error updating last active for", chatId, err && err.message);
  }
}

// Return number of users active in the current calendar month
function getMonthlyActiveCount() {
  const now = moment();
  return users.filter(
    (u) => u.lastActive && moment(u.lastActive).isSame(now, "month")
  ).length;
}

// Optionally: return number of users active in last 30 days
function getActiveLast30DaysCount() {
  const cutoff = moment().subtract(30, "days");
  return users.filter(
    (u) => u.lastActive && moment(u.lastActive).isAfter(cutoff)
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
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const name = msg.from.first_name || "Akhi/Akhti";
  const timezone = await getUserTimezone();

  if (!users.find((u) => u.id === chatId)) {
    users.push({ id: chatId, timezone, language: "Arabic", tzSource: "auto" });
    saveUsers();
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

    saveUsers();

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
      saveUsers();
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
      }
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
      }
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
    saveUsers();
    return bot.sendMessage(
      chatId,
      "🛑 You have unsubscribed from Azkar reminders. You can rejoin anytime using /start"
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

🕓 *Reminder Times:*
☀️ Morning: 7:00 AM
🌙 Evening: 5:00 PM (17:00)
`;
  return bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
}

bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  users = users.filter((u) => u.id !== chatId);
  saveUsers();
  bot.sendMessage(
    chatId,
    "🛑 You have unsubscribed from Azkar reminders. You can rejoin anytime using /start"
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
        [
          { text: "🕋 Arabic", callback_data: "lang_arabic" },
          { text: "🇬🇧 English", callback_data: "lang_english" },
          { text: "🇪🇹 Amharic", callback_data: "lang_amharic" },
        ],
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
      "Please use /start first to set up your timezone."
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
      } users`
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
            "YYYY-MM-DD HH:mm:ss"
          )} ${user.timezone}`
        );
      }

      // Morning reminder at 6:55
      if (hour === 6 && minute === 55) {
        console.log(`⏰ Morning reminder to ${user.id} in ${user.timezone}`);
        await bot.sendMessage(
          user.id,
          "⏰ Morning Azkar will start in 5 minutes, in shaa Allah ☀️"
        );
      }

      // Morning Azkar at 7:00
      if (hour === 7 && minute === 0) {
        console.log(
          `☀️ SENDING MORNING AZKAR to ${user.id} in ${user.timezone}`
        );
        const msg = formatAzkarMessage(morningAzkar, "☀️ Morning Azkar", lang);
        await sendLongMessage(user.id, msg, { parse_mode: "Markdown" });
        await bot.sendAudio(user.id, MORNING_AZKAR_AUDIO_URL, {
          caption: "*Morning Azkar Audio*",
          parse_mode: "Markdown",
        });

        // If today is Friday (moment day(): Sunday=0 ... Friday=5), send Surah al-Kahf
        try {
          if (userTime.day() === 5) {
            // Announce Surah al-Kahf
            await bot.sendMessage(
              user.id,
              "📖 Today is Friday — please read or listen to *Surah al-Kahf* (Quran 18).",
              { parse_mode: "Markdown" }
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
                { disable_web_page_preview: true }
              );
            }
          }
        } catch (err) {
          console.error(
            `Error sending Surah al-Kahf to ${user.id}:`,
            err && err.message
          );
        }
      }

      // Evening reminder at 16:55
      if (hour === 16 && minute === 55) {
        console.log(`🌙 Evening reminder to ${user.id} in ${user.timezone}`);
        await bot.sendMessage(
          user.id,
          "🌙 Evening Azkar will start in 5 minutes, in shaa Allah 🤲"
        );
      }

      // Evening Azkar at 17:00
      if (hour === 17 && minute === 0) {
        console.log(
          `🌙 SENDING EVENING AZKAR to ${user.id} in ${user.timezone}`
        );
        const msg = formatAzkarMessage(eveningAzkar, "🌙 Evening Azkar", lang);
        await sendLongMessage(user.id, msg, { parse_mode: "Markdown" });
        await bot.sendAudio(user.id, EVENING_AZKAR_AUDIO_URL, {
          caption: "*Evening Azkar Audio*",
          parse_mode: "Markdown",
        });
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
      users.push({
        id: chatId,
        timezone: tz,
        language: "Arabic",
        tzSource: "location",
        lastActive: moment().toISOString(),
      });
    }
    saveUsers();
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
      "Sorry, I could not determine your timezone from that location."
    );
  }
});

app.listen(PORT, () => {
  console.log(`✅ Bot running on port ${PORT}`);
  // console.log(`📊 Loaded ${users.length} users from storage`);
 
});
