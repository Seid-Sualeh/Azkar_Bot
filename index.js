
// =========================
// 🌿 GLOBAL AZKAR BOT FOR THE UMMAH
// =========================
require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const moment = require("moment-timezone");
const schedule = require("node-schedule");
const axios = require("axios");
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

let users = [];

// =========================
// 🌍 Helper Functions
// =========================

// 🌐 Detect user timezone via IP API
async function getUserTimezone() {
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
    if (lang === "Arabic") msg += `🕋 _${azkar.arabic}_\n`;
    else if (lang === "English") msg += `🇬🇧 *Meaning:* _${azkar.english}_\n`;
    else if (lang === "Amharic") msg += `🇪🇹 *ትርጉም:* _${azkar.amharic}_\n`;
    msg += `🔁 *Repeat:* \`${azkar.repetitions}x\`\n📖 *Source:* _${azkar.source}_\n\n`;
  });
  return msg;
}

// ✂️ Send long text safely in chunks
async function sendLongMessage(chatId, text, options = {}) {
  const chunks = text.match(/[\s\S]{1,4000}/g) || [];
  for (const chunk of chunks) {
    await bot.sendMessage(chatId, chunk, options);
    await new Promise((resolve) => setTimeout(resolve, 100));
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
    users.push({ id: chatId, timezone, language: "Arabic" });
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
      inline_keyboard: [[{ text: "📿 Subscribe", callback_data: "subscribe_user" }]],
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

    const msgByLang = {
      Arabic:
        "✅ تم تعيين اللغة إلى العربية. ستتلقى الأذكار بهذه اللغة إن شاء الله.",
      English:
        "✅ Language set to English. You'll now receive Azkar in English.",
      Amharic: "✅ ቋንቋዎን ወደ አማርኛ ቀይረዋል። አዝካር በአማርኛ ቋንቋ ይደርሳችሁ።",
    };

    return bot.sendMessage(chatId, msgByLang[user.language], { parse_mode: "Markdown" });
  }

  if (data === "subscribe_user") {
    if (!user) {
      const timezone = await getUserTimezone();
      users.push({ id: chatId, timezone, language: "Arabic" });
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
});

bot.onText(/\/help/, (msg) => {
  const helpMessage = `
🤖 *Available Commands:*
/start - Start or restart the bot
/help - Show this help message
/test - Send a sample Azkar message
/stop - Unsubscribe from daily reminders

🕓 *Reminder Times:*
☀️ Morning: 7:00 AM
🌙 Evening: 5:00 PM (17:00)
`;
  bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: "Markdown" });
});

bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  users = users.filter((u) => u.id !== chatId);
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

  const audioLink = isMorning ? MORNING_AZKAR_AUDIO_URL : EVENING_AZKAR_AUDIO_URL;
  const captionText = isMorning ? "*Morning Azkar Audio*" : "*Evening Azkar Audio*";

  await sendLongMessage(chatId, message, { parse_mode: "Markdown" });
  await bot.sendAudio(chatId, audioLink, { caption: captionText, parse_mode: "Markdown" });
});

// =========================
// ⏰ AZKAR SCHEDULE
// =========================
schedule.scheduleJob("* * * * *", async () => {
  const nowUTC = moment.utc();
  for (const user of users) {
    try {
      const userTime = nowUTC.clone().tz(user.timezone);
      const hour = userTime.hour();
      const minute = userTime.minute();
      const lang = user.language;

      // Morning reminder at 6:55
      if (hour === 6 && minute === 55) {
        await bot.sendMessage(user.id, "⏰ Morning Azkar will start in 5 minutes, in shaa Allah ☀️");
      }

      // Morning Azkar at 7:00
      if (hour === 7 && minute === 0) {
        const msg = formatAzkarMessage(morningAzkar, "☀️ Morning Azkar", lang);
        await sendLongMessage(user.id, msg, { parse_mode: "Markdown" });
        await bot.sendAudio(user.id, MORNING_AZKAR_AUDIO_URL, {
          caption: "*Morning Azkar Audio*",
          parse_mode: "Markdown",
        });
      }

      // Evening reminder at 16:55
      if (hour === 16 && minute === 55) {
        await bot.sendMessage(user.id, "🌙 Evening Azkar will start in 5 minutes, in shaa Allah 🤲");
      }

      // Evening Azkar at 17:00
      if (hour === 17 && minute === 0) {
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
app.listen(PORT, () => console.log(`✅ Bot running on port ${PORT}`));
