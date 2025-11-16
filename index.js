// =========================
// 🌿 GLOBAL AZKAR BOT FOR THE UMMAH
// =========================
require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const moment = require("moment-timezone");
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
🌍 Detected timezone: *${timezone}*

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
});

bot.onText(/\/help/, (msg) => {
  const helpMessage = `
🤖 *Available Commands:*
/start - Start or restart the bot
/help - Show this help message
/test - Send a sample Azkar message
/stop - Unsubscribe from daily reminders
/mytime - Check your current time and settings

🕓 *Reminder Times:*
☀️ Morning: 7:00 AM
🌙 Evening: 5:00 PM (17:00)
`;
  bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: "Markdown" });
});

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

// 🕐 Time Check Command
bot.onText(/\/mytime/, async (msg) => {
  const chatId = msg.chat.id;
  return sendUserTime(chatId);
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

  const timeInfo = `
🕐 *Your Current Settings:*
• Your Timezone: *${user.timezone}*
• Current Time: *${userTime.format("YYYY-MM-DD HH:mm:ss")}*
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
    } else {
      users.push({
        id: chatId,
        timezone: tz,
        language: "Arabic",
        tzSource: "location",
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
  console.log(`📊 Loaded ${users.length} users from storage`);
  console.log(`🌐 Webhook: ${BASE_URL}/bot${TELEGRAM_BOT_TOKEN}`);
});


























