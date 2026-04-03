// 🌿 GLOBAL AZKAR BOT FOR THE UMMAH
// =========================
require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const moment = require("moment-timezone");
const fs = require("fs");
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
const {
  initializeDatabase,
  userOperations,
  prayerTimeOperations,
  feedbackOperations,
  channelPostOperations,
} = require("./database/init");

// Load users from database
let users = [];

// Load all users into memory for faster access (sync operation on startup)
function loadUsersFromDB() {
  try {
    const rows = userOperations.getAll.all();
    users = rows.map((row) => ({
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
      ishaNotification: Boolean(row.isha_notification),
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
        user.prayerNotifications !== undefined
          ? user.prayerNotifications
            ? 1
            : 0
          : undefined,
        user.fajrNotification !== undefined
          ? user.fajrNotification
            ? 1
            : 0
          : undefined,
        user.dhuhrNotification !== undefined
          ? user.dhuhrNotification
            ? 1
            : 0
          : undefined,
        user.asrNotification !== undefined
          ? user.asrNotification
            ? 1
            : 0
          : undefined,
        user.maghribNotification !== undefined
          ? user.maghribNotification
            ? 1
            : 0
          : undefined,
        user.ishaNotification !== undefined
          ? user.ishaNotification
            ? 1
            : 0
          : undefined,
        user.id,
      );
    } else {
      // Create new user
      userOperations.create.run(
        user.id,
        user.timezone,
        user.language,
        user.tzSource,
        user.lastActive,
      );
    }

    // Update in-memory cache
    const index = users.findIndex((u) => u.id === user.id);
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
  return users.find((u) => u.id === chatId);
}

// Delete user from database
function deleteUserFromDB(chatId) {
  try {
    userOperations.delete.run(chatId);
    // Remove from memory
    users = users.filter((u) => u.id !== chatId);
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
    const newUser = {
      id: chatId,
      timezone,
      language: "Arabic",
      tzSource: "auto",
      prayerNotifications: true,
      fajrNotification: true,
      dhuhrNotification: true,
      asrNotification: true,
      maghribNotification: true,
      ishaNotification: true,
    };
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
      const newUser = {
        id: chatId,
        timezone,
        language: "Arabic",
        tzSource: "auto",
        prayerNotifications: true,
        fajrNotification: true,
        dhuhrNotification: true,
        asrNotification: true,
        maghribNotification: true,
        ishaNotification: true,
      };
      users.push(newUser);
      saveUserToDB(newUser);
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

  if (data === "send_feedback") {
    const user = users.find((u) => u.id === chatId);
    if (!user) {
      return bot.sendMessage(chatId, "Please use /start first to subscribe.", {
        parse_mode: "Markdown",
      });
    }

    let promptMessage = "";
    if (user.language === "Arabic") {
      promptMessage =
        "💬 يرجى إرسال تعليقك أو اقتراحك لتحسين البوت:\n\nأو يمكنك استخدام: `/feedback [رسالتك]`";
    } else if (user.language === "English") {
      promptMessage =
        "💬 Please send your feedback or suggestion to improve the bot:\n\nOr use: `/feedback [your message]`";
    } else if (user.language === "Amharic") {
      promptMessage =
        "💬 ቦቱን ለማሳደግ አስተያየት ወይም ግጥም ያስተላልፉ:\n\nወይም ተጠቀሙ: `/feedback [መልክዎ]`";
    }
    return bot.sendMessage(chatId, promptMessage, { parse_mode: "Markdown" });
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
/prayer - Show today's prayer times
/prayersettings - Configure prayer notifications
/feedback - Send feedback or suggestions

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

// 🕌 Prayer Times Command
bot.onText(/\/prayer|\/salah|\/prayertimes/, async (msg) => {
  const chatId = msg.chat.id;
  const user = users.find((u) => u.id === chatId);

  if (!user) {
    return bot.sendMessage(
      chatId,
      "Please use /start first to set up your timezone.",
      {
        parse_mode: "Markdown",
      },
    );
  }

  try {
    const today = moment().tz(user.timezone).startOf("day");
    const prayerTimes = await getPrayerTimesForUser(user, today);
    const message = formatPrayerTimeMessage(prayerTimes, user.language);

    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error getting prayer times:", error.message);
    await bot.sendMessage(
      chatId,
      "Sorry, unable to fetch prayer times at the moment. Please try again later.",
      {
        parse_mode: "Markdown",
      },
    );
  }
});

// 💬 Feedback Command
bot.onText(/\/feedback/, async (msg) => {
  const chatId = msg.chat.id;
  const user = users.find((u) => u.id === chatId);

  if (!user) {
    return bot.sendMessage(chatId, "Please use /start first to subscribe.", {
      parse_mode: "Markdown",
    });
  }

  // Check if there's text after /feedback
  const feedbackText = msg.text.replace(/^\/feedback\s*/, "").trim();

  if (feedbackText) {
    // Direct feedback submission
    try {
      feedbackOperations.create.run(chatId, feedbackText);
      let responseMessage = "";
      if (user.language === "Arabic") {
        responseMessage = "✅ شكراً لك على ملاحظاتك! تم استلام تعليقك بنجاح.";
      } else if (user.language === "English") {
        responseMessage =
          "✅ Thank you for your feedback! Your comment has been received successfully.";
      } else if (user.language === "Amharic") {
        responseMessage = "✅ ለአስተያየትዎ እናመሰግናለን! አስተያየትዎ ተቀበለ።";
      }
      await bot.sendMessage(chatId, responseMessage, {
        parse_mode: "Markdown",
      });
    } catch (error) {
      console.error("Error saving feedback:", error.message);
      await bot.sendMessage(
        chatId,
        "Sorry, there was an error saving your feedback. Please try again later.",
        {
          parse_mode: "Markdown",
        },
      );
    }
  } else {
    // Prompt for feedback
    let promptMessage = "";
    if (user.language === "Arabic") {
      promptMessage =
        "💬 يرجى إرسال تعليقك أو اقتراحك لتحسين البوت:\n\nأو يمكنك استخدام: `/feedback [رسالتك]`";
    } else if (user.language === "English") {
      promptMessage =
        "💬 Please send your feedback or suggestion to improve the bot:\n\nOr use: `/feedback [your message]`";
    } else if (user.language === "Amharic") {
      promptMessage =
        "💬 ቦቱን ለማሳደግ አስተያየት ወይም ግጥም ያስተላልፉ:\n\nወይም ተጠቀሙ: `/feedback [መልክዎ]`";
    }
    await bot.sendMessage(chatId, promptMessage, { parse_mode: "Markdown" });
  }
});

// Handle feedback messages (any message starting with feedback context)
bot.on("message", async (msg) => {
  try {
    if (
      msg &&
      msg.chat &&
      msg.chat.id &&
      msg.text &&
      !msg.text.startsWith("/")
    ) {
      const chatId = msg.chat.id;
      const user = users.find((u) => u.id === chatId);

      // Check if user recently used /feedback command (within last 5 minutes)
      if (user && user.lastFeedbackPrompt) {
        const timeSincePrompt = moment().diff(
          moment(user.lastFeedbackPrompt),
          "minutes",
        );
        if (timeSincePrompt <= 5) {
          // This is likely feedback
          try {
            feedbackOperations.create.run(chatId, msg.text);
            user.lastFeedbackPrompt = null; // Clear the prompt flag

            let responseMessage = "";
            if (user.language === "Arabic") {
              responseMessage =
                "✅ شكراً لك على ملاحظاتك! تم استلام تعليقك بنجاح.";
            } else if (user.language === "English") {
              responseMessage =
                "✅ Thank you for your feedback! Your comment has been received successfully.";
            } else if (user.language === "Amharic") {
              responseMessage = "✅ ለአስተያየትዎ እናመሰግናለን! አስተያየትዎ ተቀበለ።";
            }
            await bot.sendMessage(chatId, responseMessage, {
              parse_mode: "Markdown",
            });
            return;
          } catch (error) {
            console.error("Error saving feedback:", error.message);
          }
        }
      }
    }
  } catch (err) {
    console.error("Error in feedback message handler:", err && err.message);
  }
});

// 📢 Admin Broadcasting Commands
const ADMIN_CHAT_IDS = process.env.ADMIN_CHAT_IDS
  ? process.env.ADMIN_CHAT_IDS.split(",").map((id) => id.trim())
  : [];

// Check if user is admin
function isAdmin(chatId) {
  return ADMIN_CHAT_IDS.includes(chatId.toString());
}

// Admin: View recent feedback
bot.onText(/\/viewfeedback/, async (msg) => {
  const chatId = msg.chat.id;

  if (!isAdmin(chatId)) {
    return bot.sendMessage(
      chatId,
      "❌ You don't have permission to use this command.",
      {
        parse_mode: "Markdown",
      },
    );
  }

  try {
    const recentFeedback = feedbackOperations.getRecent.all(10);

    if (!recentFeedback || recentFeedback.length === 0) {
      return bot.sendMessage(chatId, "📭 No feedback received yet.", {
        parse_mode: "Markdown",
      });
    }

    let feedbackList = "📋 *Recent Feedback:*\n\n";
    recentFeedback.forEach((fb, index) => {
      const date = moment(fb.created_at).format("YYYY-MM-DD HH:mm");
      feedbackList += `${index + 1}. *User ${fb.chat_id}* (${date}):\n${fb.message}\n\n`;
    });

    await bot.sendMessage(chatId, feedbackList, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error getting feedback:", error.message);
    await bot.sendMessage(
      chatId,
      "Sorry, there was an error retrieving feedback.",
      {
        parse_mode: "Markdown",
      },
    );
  }
});

// Broadcast message to all users
bot.onText(/\/broadcast/, async (msg) => {
  const chatId = msg.chat.id;

  if (!isAdmin(chatId)) {
    return bot.sendMessage(
      chatId,
      "❌ You don't have permission to use this command.",
      {
        parse_mode: "Markdown",
      },
    );
  }

  const broadcastText = msg.text.replace(/^\/broadcast\s*/, "").trim();

  if (!broadcastText) {
    return bot.sendMessage(
      chatId,
      "📢 Please provide a message to broadcast.\n\nUsage: `/broadcast [your message]`",
      {
        parse_mode: "Markdown",
      },
    );
  }

  // Confirm broadcast
  await bot.sendMessage(
    chatId,
    `📢 Are you sure you want to broadcast this message to *${users.length}* users?\n\n"${broadcastText}"`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "✅ Yes, Send",
              callback_data: `confirm_broadcast:${Buffer.from(broadcastText).toString("base64")}`,
            },
            { text: "❌ Cancel", callback_data: "cancel_broadcast" },
          ],
        ],
      },
    },
  );
});

// Handle broadcast confirmation
bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (data.startsWith("confirm_broadcast:")) {
    if (!isAdmin(chatId)) {
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ You don't have permission to broadcast.",
      });
    }

    const encodedMessage = data.replace("confirm_broadcast:", "");
    const broadcastMessage = Buffer.from(encodedMessage, "base64").toString();

    let successCount = 0;
    let failCount = 0;

    // Send to all users
    for (const user of users) {
      try {
        await bot.sendMessage(
          user.id,
          `📢 *Important Announcement:*\n\n${broadcastMessage}`,
          {
            parse_mode: "Markdown",
          },
        );
        successCount++;

        // Add small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to send broadcast to ${user.id}:`, error.message);
        failCount++;
      }
    }

    // Save broadcast to database
    try {
      channelPostOperations.create.run(chatId, broadcastMessage);
    } catch (error) {
      console.error("Error saving broadcast to database:", error.message);
    }

    await bot.answerCallbackQuery(callbackQuery.id, {
      text: `✅ Broadcast sent! Success: ${successCount}, Failed: ${failCount}`,
    });
    await bot.sendMessage(
      chatId,
      `📢 Broadcast completed!\n✅ Sent to: ${successCount} users\n❌ Failed: ${failCount} users`,
      {
        parse_mode: "Markdown",
      },
    );
  } else if (data === "cancel_broadcast") {
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Broadcast cancelled.",
    });
    await bot.sendMessage(chatId, "❌ Broadcast cancelled.", {
      parse_mode: "Markdown",
    });
  }

  // Prayer settings callbacks
  if (data === "prayer_settings") {
    return sendPrayerSettings(chatId);
  }

  if (data.startsWith("toggle_prayer_")) {
    const prayerType = data.replace("toggle_prayer_", "");
    return togglePrayerNotification(chatId, prayerType, callbackQuery);
  }

  if (data === "toggle_all_prayers") {
    return toggleAllPrayerNotifications(chatId, callbackQuery);
  }

  // Menu callback
  if (data === "menu") {
    return sendMainMenu(chatId);
  }

  // Feedback callback
  if (data === "feedback") {
    return sendFeedbackPrompt(chatId);
  }

  // Prayer times callback
  if (data === "prayer_times") {
    const user = users.find((u) => u.id === chatId);
    if (!user) {
      return bot.sendMessage(
        chatId,
        "Please use /start first to set up your timezone.",
        {
          parse_mode: "Markdown",
        },
      );
    }

    try {
      const today = moment().tz(user.timezone).startOf("day");
      const prayerTimes = await getPrayerTimesForUser(user, today);
      const message = formatPrayerTimeMessage(prayerTimes, user.language);

      await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Error getting prayer times:", error.message);
      await bot.sendMessage(
        chatId,
        "Sorry, unable to fetch prayer times at the moment. Please try again later.",
        {
          parse_mode: "Markdown",
        },
      );
    }
    return;
  }
});

// Menu command - show inline buttons for all main actions
bot.onText(/\/menu/, async (msg) => {
  const chatId = msg.chat.id;
  return sendMainMenu(chatId);
});

// Helper to send main menu
async function sendMainMenu(chatId) {
  const user = users.find((u) => u.id === chatId);

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
          { text: "🕌 Prayer Times", callback_data: "prayer_times" },
          { text: "🔔 Prayer Settings", callback_data: "prayer_settings" },
        ],
        [
          { text: "💬 Feedback", callback_data: "feedback" },
          { text: "📊 Stats", callback_data: "stats" },
        ],
        [
          { text: "🛑 Unsubscribe", callback_data: "stop" },
          { text: "❓ Help", callback_data: "help" },
        ],
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
}

// Helper to send feedback prompt
async function sendFeedbackPrompt(chatId) {
  const user = users.find((u) => u.id === chatId);

  if (!user) {
    return bot.sendMessage(chatId, "Please use /start first to subscribe.", {
      parse_mode: "Markdown",
    });
  }

  // Set feedback prompt flag
  user.lastFeedbackPrompt = moment().toISOString();

  let promptMessage = "";
  if (user.language === "Arabic") {
    promptMessage =
      "💬 يرجى إرسال تعليقك أو اقتراحك لتحسين البوت:\n\nيمكنك أيضاً استخدام: `/feedback [رسالتك]`";
  } else if (user.language === "English") {
    promptMessage =
      "💬 Please send your feedback or suggestion to improve the bot:\n\nYou can also use: `/feedback [your message]`";
  } else if (user.language === "Amharic") {
    promptMessage =
      "💬 ቦቱን ለማሳደግ አስተያየት ወይም ግጥም ያስተላልፉ:\n\nተጠቀሙ የምትችሉት: `/feedback [መልክዎ]`";
  }

  await bot.sendMessage(chatId, promptMessage, { parse_mode: "Markdown" });
}
bot.onText(/\/prayersettings|\/prayerprefs/, async (msg) => {
  const chatId = msg.chat.id;
  return sendPrayerSettings(chatId);
});

// Helper to send prayer settings menu
async function sendPrayerSettings(chatId) {
  const user = users.find((u) => u.id === chatId);

  if (!user) {
    return bot.sendMessage(chatId, "Please use /start first to subscribe.", {
      parse_mode: "Markdown",
    });
  }

  const statusText = user.prayerNotifications ? "✅ Enabled" : "❌ Disabled";

  let settingsMessage = `🕌 *Prayer Notification Settings*\n\n`;
  settingsMessage += `Overall Notifications: *${statusText}*\n\n`;
  settingsMessage += `Individual Prayer Notifications:\n`;
  settingsMessage += `🕋 Fajr: ${user.fajrNotification ? "✅" : "❌"} ${user.fajrNotification ? "(Enabled)" : "(Disabled)"}\n`;
  settingsMessage += `🕋 Dhuhr: ${user.dhuhrNotification ? "✅" : "❌"} ${user.dhuhrNotification ? "(Enabled)" : "(Disabled)"}\n`;
  settingsMessage += `🕋 Asr: ${user.asrNotification ? "✅" : "❌"} ${user.asrNotification ? "(Enabled)" : "(Disabled)"}\n`;
  settingsMessage += `🕋 Maghrib: ${user.maghribNotification ? "✅" : "❌"} ${user.maghribNotification ? "(Enabled)" : "(Disabled)"}\n`;
  settingsMessage += `🕋 Isha: ${user.ishaNotification ? "✅" : "❌"} ${user.ishaNotification ? "(Enabled)" : "(Disabled)"}\n\n`;
  settingsMessage += `Choose an action:`;

  const keyboard = [
    [
      {
        text: user.prayerNotifications
          ? "🔕 Disable All Prayers"
          : "🔔 Enable All Prayers",
        callback_data: "toggle_all_prayers",
      },
    ],
    [
      {
        text: `${user.fajrNotification ? "🔕" : "🔔"} Fajr`,
        callback_data: "toggle_prayer_fajr",
      },
      {
        text: `${user.dhuhrNotification ? "🔕" : "🔔"} Dhuhr`,
        callback_data: "toggle_prayer_dhuhr",
      },
    ],
    [
      {
        text: `${user.asrNotification ? "🔕" : "🔔"} Asr`,
        callback_data: "toggle_prayer_asr",
      },
      {
        text: `${user.maghribNotification ? "🔕" : "🔔"} Maghrib`,
        callback_data: "toggle_prayer_maghrib",
      },
    ],
    [
      {
        text: `${user.ishaNotification ? "🔕" : "🔔"} Isha`,
        callback_data: "toggle_prayer_isha",
      },
    ],
    [{ text: "⬅️ Back to Menu", callback_data: "menu" }],
  ];

  await bot.sendMessage(chatId, settingsMessage, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: keyboard,
    },
  });
}

// Helper to toggle individual prayer notifications
async function togglePrayerNotification(
  chatId,
  prayerType,
  callbackQuery = null,
) {
  const user = users.find((u) => u.id === chatId);

  if (!user) return;

  const prayerFields = {
    fajr: "fajrNotification",
    dhuhr: "dhuhrNotification",
    asr: "asrNotification",
    maghrib: "maghribNotification",
    isha: "ishaNotification",
  };

  const field = prayerFields[prayerType];
  if (!field) return;

  user[field] = !user[field];
  saveUserToDB(user);

  // Send updated settings
  await sendPrayerSettings(chatId);

  // Acknowledge the callback
  if (callbackQuery) {
    try {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: `${user[field] ? "🔔" : "🔕"} ${prayerType.charAt(0).toUpperCase() + prayerType.slice(1)} notifications ${user[field] ? "enabled" : "disabled"}`,
      });
    } catch (e) {}
  }
}

// Helper to toggle all prayer notifications
async function toggleAllPrayerNotifications(chatId, callbackQuery = null) {
  const user = users.find((u) => u.id === chatId);

  if (!user) return;

  const newState = !user.prayerNotifications;
  user.prayerNotifications = newState;
  user.fajrNotification = newState;
  user.dhuhrNotification = newState;
  user.asrNotification = newState;
  user.maghribNotification = newState;
  user.ishaNotification = newState;

  saveUserToDB(user);

  // Send updated settings
  await sendPrayerSettings(chatId);

  // Acknowledge the callback
  if (callbackQuery) {
    try {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: `${newState ? "🔔 All prayer notifications enabled" : "🔕 All prayer notifications disabled"}`,
      });
    } catch (e) {}
  }
}

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
        [
          { text: "💬 Feedback", callback_data: "send_feedback" },
          { text: "🕌 Prayer Settings", callback_data: "prayer_settings" },
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

  // Get today's prayer times
  let prayerTimesText = "";
  try {
    const today = userTime.clone().startOf("day");
    const prayerTimes = await getPrayerTimesForUser(user, today);
    prayerTimesText = `\n🕌 *Today's Prayer Times:*\n• Fajr: ${prayerTimes.fajr}\n• Dhuhr: ${prayerTimes.dhuhr}\n• Asr: ${prayerTimes.asr}\n• Maghrib: ${prayerTimes.maghrib}\n• Isha: ${prayerTimes.isha}`;
  } catch (error) {
    console.error("Error getting prayer times for /mytime:", error.message);
    prayerTimesText = "\n🕌 *Prayer Times:* Unable to load at the moment";
  }

  const timeInfo = `
🕐 *Your Current Settings:*
• Your Timezone: *${user.timezone}*
• Current Time: *${userTime.format("YYYY-MM-DD HH:mm:ss")}*
• Hijri Date: *${hijri}*
• Language: *${user.language}*
• Prayer Notifications: *${user.prayerNotifications ? "Enabled" : "Disabled"}*
• Next Morning Azkar: *7:00 AM*
• Next Evening Azkar: *5:00 PM*${prayerTimesText}

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
// Uses AlAdhan API with coordinates when available, otherwise approximates
async function getPrayerTimesForUser(user, dateObj) {
  try {
    const dateStr = dateObj.format("YYYY-MM-DD");

    // Check if we have cached prayer times for this user/date
    const cached = prayerTimeOperations.getByChatIdAndDate.get(
      user.id,
      dateStr,
    );
    if (cached) {
      return {
        fajr: cached.fajr,
        dhuhr: cached.dhuhr,
        asr: cached.asr,
        maghrib: cached.maghrib,
        isha: cached.isha,
      };
    }

    // Try to get coordinates from user's location sharing
    // For now, we'll use timezone-based approximation, but in production
    // you'd want to store user coordinates when they share location

    // Get approximate coordinates based on timezone (simplified approach)
    const approxCoords = getApproximateCoordinatesFromTimezone(user.timezone);

    if (approxCoords) {
      try {
        // Use AlAdhan API with coordinates
        const apiUrl = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${approxCoords.lat}&longitude=${approxCoords.lon}&method=2&school=0`;
        const response = await axios.get(apiUrl);

        if (response.data && response.data.data && response.data.data.timings) {
          const timings = response.data.data.timings;
          const prayerTimes = {
            fajr: timings.Fajr,
            dhuhr: timings.Dhuhr,
            asr: timings.Asr,
            maghrib: timings.Maghrib,
            isha: timings.Isha,
          };

          // Cache the prayer times
          prayerTimeOperations.upsert.run(
            user.id,
            dateStr,
            prayerTimes.fajr,
            prayerTimes.dhuhr,
            prayerTimes.asr,
            prayerTimes.maghrib,
            prayerTimes.isha,
          );

          return prayerTimes;
        }
      } catch (apiError) {
        console.warn(
          "AlAdhan API failed, falling back to approximation:",
          apiError.message,
        );
      }
    }

    // Fallback: approximate prayer times based on solar calculations
    const prayerTimes = calculateApproximatePrayerTimes(dateObj, user.timezone);

    // Cache the fallback prayer times
    prayerTimeOperations.upsert.run(
      user.id,
      dateStr,
      prayerTimes.fajr,
      prayerTimes.dhuhr,
      prayerTimes.asr,
      prayerTimes.maghrib,
      prayerTimes.isha,
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
      isha: "19:30",
    };
  }
}

// Get approximate coordinates for a timezone (simplified mapping)
function getApproximateCoordinatesFromTimezone(timezone) {
  // This is a simplified mapping - in production, you'd use a proper timezone to coordinates service
  const timezoneCoords = {
    "Africa/Addis_Ababa": { lat: 9.145, lon: 38.7379 },
    "Africa/Nairobi": { lat: -1.2921, lon: 36.8219 },
    "Africa/Cairo": { lat: 30.0444, lon: 31.2357 },
    "Asia/Riyadh": { lat: 24.7136, lon: 46.6753 },
    "Asia/Dubai": { lat: 25.2048, lon: 55.2708 },
    "Europe/London": { lat: 51.5074, lon: -0.1278 },
    "America/New_York": { lat: 40.7128, lon: -74.006 },
    "Asia/Kolkata": { lat: 28.6139, lon: 77.209 },
    "Australia/Sydney": { lat: -33.8688, lon: 151.2093 },
  };

  return timezoneCoords[timezone] || null;
}

// Calculate approximate prayer times using simplified astronomical calculations
function calculateApproximatePrayerTimes(dateObj, timezone) {
  // Get solar noon for the timezone
  const noonMoment = dateObj
    .clone()
    .tz(timezone)
    .set({ hour: 12, minute: 0, second: 0, millisecond: 0 });

  // Simplified prayer time calculations (not astronomically accurate)
  // In production, use a proper Islamic prayer times library
  const fajrMoment = noonMoment.clone().subtract(7, "hours").add(30, "minutes"); // Fajr ~1.5 hours before sunrise
  const dhuhrMoment = noonMoment.clone(); // Solar noon
  const asrMoment = noonMoment.clone().add(3, "hours"); // Asr ~3 hours after noon
  const maghribMoment = noonMoment.clone().add(6, "hours"); // Maghrib ~6 hours after noon (sunset)
  const ishaMoment = noonMoment.clone().add(8, "hours"); // Isha ~2 hours after maghrib

  return {
    fajr: fajrMoment.format("HH:mm"),
    dhuhr: dhuhrMoment.format("HH:mm"),
    asr: asrMoment.format("HH:mm"),
    maghrib: maghribMoment.format("HH:mm"),
    isha: ishaMoment.format("HH:mm"),
  };
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

      // Check for prayer times notifications
      if (user.prayerNotifications) {
        try {
          const today = userTime.clone().startOf("day");
          const prayerTimes = await getPrayerTimesForUser(user, today);

          // Check each prayer time
          const prayerTimeChecks = [
            {
              name: "fajr",
              time: prayerTimes.fajr,
              enabled: user.fajrNotification,
              arabic: "الفجر",
              english: "Fajr",
              amharic: "የጠዋት",
            },
            {
              name: "dhuhr",
              time: prayerTimes.dhuhr,
              enabled: user.dhuhrNotification,
              arabic: "الظهر",
              english: "Dhuhr",
              amharic: "ሰዓት",
            },
            {
              name: "asr",
              time: prayerTimes.asr,
              enabled: user.asrNotification,
              arabic: "العصر",
              english: "Asr",
              amharic: "የአረቀተሰዓት",
            },
            {
              name: "maghrib",
              time: prayerTimes.maghrib,
              enabled: user.maghribNotification,
              arabic: "المغرب",
              english: "Maghrib",
              amharic: "የጠዋት ጊዜ",
            },
            {
              name: "isha",
              time: prayerTimes.isha,
              enabled: user.ishaNotification,
              arabic: "العشاء",
              english: "Isha",
              amharic: "ሌሊት",
            },
          ];

          for (const prayer of prayerTimeChecks) {
            if (prayer.enabled) {
              const [prayerHour, prayerMinute] = prayer.time
                .split(":")
                .map(Number);
              if (hour === prayerHour && minute === prayerMinute) {
                console.log(
                  `🕌 SENDING ${prayer.name.toUpperCase()} PRAYER NOTIFICATION to ${user.id}`,
                );

                let prayerMessage = "";
                if (lang === "Arabic") {
                  prayerMessage = `🕌 حان وقت صلاة *${prayer.arabic}*\n\nأدِ الصلاةَ لِوقتِها، إنَّ الصلاةَ كانتْ على المؤمنينَ كتابًا موقوتًا\n\n🕐 ${prayer.time}`;
                } else if (lang === "English") {
                  prayerMessage = `🕌 It's time for *${prayer.english}* prayer\n\n"Verily, the prayer is enjoined on the believers at fixed hours." (Quran 4:103)\n\n🕐 ${prayer.time}`;
                } else if (lang === "Amharic") {
                  prayerMessage = `🕌 የ*${prayer.amharic}* ጸሎት ሰዓት ደረሰ\n\nበእምነት ላለ ሰዎች ጸሎት በተወሰነ ሰዓት ተያዘ።\n\n🕐 ${prayer.time}`;
                }

                await bot.sendMessage(user.id, prayerMessage, {
                  parse_mode: "Markdown",
                });
              }
            }
          }
        } catch (prayerError) {
          console.error(
            `Error checking prayer times for user ${user.id}:`,
            prayerError.message,
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
