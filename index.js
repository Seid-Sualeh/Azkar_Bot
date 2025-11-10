// // =========================
// // 🌿 GLOBAL AZKAR BOT FOR THE UMMAH
// // =========================
// require("dotenv").config();
// const express = require("express");
// const TelegramBot = require("node-telegram-bot-api");
// const moment = require("moment-timezone");
// const schedule = require("node-schedule");
// const axios = require("axios");
// const { morningAzkar, eveningAzkar } = require("./azkar");

// // =========================
// // ⚙️ CONFIGURATION
// // =========================
// const app = express();
// app.use(express.json());

// const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// const BASE_URL = process.env.BASE_URL;
// const PORT = process.env.PORT || 10000;

// const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
// bot.setWebHook(`${BASE_URL}/bot${TELEGRAM_BOT_TOKEN}`);

// let users = [];

// // =========================
// // 🌍 Helper Functions
// // =========================
// async function getUserTimezone() {
//   try {
//     const res = await axios.get("https://ipapi.co/json/");
//     return res.data.timezone || "Africa/Addis_Ababa";
//   } catch {
//     return "Africa/Addis_Ababa";
//   }
// }

// function formatAzkarMessage(azkarList, title, lang) {
//   let msg = `🌿 *${title}* 🌿\n\n`;
//   azkarList.forEach((azkar, i) => {
//     msg += `✨ *${i + 1}.*\n`;
//     if (lang === "Arabic") msg += `🕋 _${azkar.arabic}_\n`;
//     else if (lang === "English") msg += `🇬🇧 *Meaning:* _${azkar.english}_\n`;
//     else if (lang === "Amharic") msg += `🇪🇹 *ትርጉም:* _${azkar.amharic}_\n`;
//     msg += `🔁 *Repeat:* \`${azkar.repetitions}x\`\n📖 *Source:* _${azkar.source}_\n\n`;
//   });
//   return msg;
// }

// /**
//  * Sends a potentially long message by chunking it into 4000 character segments.
//  * Crucially, it applies the reply_markup (e.g., the audio button) ONLY to the last chunk.
//  */
// async function sendLongMessage(chatId, text, options = {}) {
//   const chunks = text.match(/[\s\S]{1,4000}/g) || [];
//   for (let i = 0; i < chunks.length; i++) {
//     const chunk = chunks[i];
//     const isLastChunk = i === chunks.length - 1; // Copy options and remove reply_markup for non-final chunks

//     let chunkOptions = { ...options };
//     if (!isLastChunk) {
//       delete chunkOptions.reply_markup;
//     }

//     await bot.sendMessage(chatId, chunk, chunkOptions); // Small delay to avoid hitting Telegram rate limits when sending many chunks
//     await new Promise((resolve) => setTimeout(resolve, 100));
//   }
// }

// // =========================
// // 🤖 BOT COMMANDS (Start, Callback, Test, Help, Stop)
// // =========================
// bot.onText(/\/start/, async (msg) => {
//   const chatId = msg.chat.id;
//   const name = msg.from.first_name || "Akhi/Akhti";
//   const timezone = await getUserTimezone();

//   if (!users.find((u) => u.id === chatId)) {
//     users.push({ id: chatId, timezone, language: "Arabic" });
//   }

//   const welcome = `
// 🕌 *As-salamu Alaikum ${name}!*
// 🌿 Welcome to the *Azkar Reminder Bot*

// ☀️ Morning Azkar → 7:00 AM
// 🌙 Evening Azkar → 5:00 PM
// 🌍 Detected timezone: *${timezone}*

// Would you like to subscribe to daily Azkar reminders?
// `;

//   bot.sendMessage(chatId, welcome, {
//     parse_mode: "Markdown",
//     reply_markup: {
//       inline_keyboard: [
//         [{ text: "📿 Subscribe", callback_data: "subscribe_user" }],
//       ],
//     },
//   });
// });

// bot.on("callback_query", async (callbackQuery) => {
//   const chatId = callbackQuery.message.chat.id;
//   const data = callbackQuery.data;
//   const user = users.find((u) => u.id === chatId);

//   if (data.startsWith("lang_")) {
//     if (!user) return;
//     if (data === "lang_arabic") user.language = "Arabic";
//     else if (data === "lang_english") user.language = "English";
//     else if (data === "lang_amharic") user.language = "Amharic";

//     const msgByLang = {
//       Arabic:
//         "✅ تم تعيين اللغة إلى العربية. ستتلقى الأذكار بهذه اللغة إن شاء الله.",
//       English:
//         "✅ Language set to English. You'll now receive Azkar in English.",
//       Amharic: "✅ ቋንቋዎን ወደ አማርኛ ቀይረዋል። አዝካር በዚህ ቋንቋ ይደርሳችሁ።",
//     };

//     bot.sendMessage(chatId, msgByLang[user.language], {
//       parse_mode: "Markdown",
//     });
//     return;
//   }

//   if (data === "subscribe_user") {
//     if (!user) {
//       const timezone = await getUserTimezone();
//       users.push({ id: chatId, timezone, language: "Arabic" });
//     }

//     bot.sendMessage(
//       chatId,
//       "✅ You are now subscribed to daily Azkar reminders! Choose your language below:",
//       {
//         parse_mode: "Markdown",
//         reply_markup: {
//           inline_keyboard: [
//             [
//               { text: "🕋 Arabic", callback_data: "lang_arabic" },
//               { text: "🇬🇧 English", callback_data: "lang_english" },
//               { text: "🇪🇹 Amharic", callback_data: "lang_amharic" },
//             ],
//           ],
//         },
//       }
//     );
//   }
// });

// bot.onText(/\/help/, (msg) => {
//   const helpMessage = `
// 🤖 *Available Commands:*
// /start - Start or restart the bot
// /help - Show this help message
// /test - Send a sample Azkar message
// /stop - Unsubscribe from daily reminders

// 🕓 *Reminder Times:*
// ☀️ Morning: 7:00 AM
// 🌙 Evening: 5:00 PM (17:00)
// `;
//   bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: "Markdown" });
// });

// bot.onText(/\/stop/, (msg) => {
//   const chatId = msg.chat.id;
//   users = users.filter((u) => u.id !== chatId);
//   bot.sendMessage(
//     chatId,
//     "🛑 You have unsubscribed from Azkar reminders. You can rejoin anytime using /start"
//   );
// });

// // 🧭 Test Command (Uses the new sendLongMessage function)
// bot.onText(/\/test/, async (msg) => {
//   const chatId = msg.chat.id;
//   const now = moment().tz("Africa/Addis_Ababa");
//   const user = users.find((u) => u.id === chatId);
//   const lang = user ? user.language : "Arabic";

//   const isMorning = now.hour() >= 5 && now.hour() < 12;
//   const message = isMorning
//     ? formatAzkarMessage(morningAzkar, "☀️ Morning Azkar", lang)
//     : formatAzkarMessage(eveningAzkar, "🌙 Evening Azkar", lang);

//   await sendLongMessage(chatId, message, {
//     parse_mode: "Markdown",
//     reply_markup: {
//       inline_keyboard: [
//         [
//           {
//             text: isMorning
//               ? "🎧 Play Morning Azkar Audio"
//               : "🎧 Play Evening Azkar Audio",
//             url: isMorning
//               ? "https://www.tvquran.com/en/selection/3/adhkar-of-the-morning"
//               : "https://www.tvquran.com/en/selection/4/embeddable",
//           },
//         ],
//       ],
//     },
//   });
// });

// // =========================
// // ⏰ GLOBAL AZKAR SCHEDULE (Uses the new sendLongMessage function)
// // =========================
// schedule.scheduleJob("* * * * *", async () => {
//   const nowUTC = moment.utc();
//   for (const user of users) {
//     try {
//       const userTime = nowUTC.clone().tz(user.timezone);
//       const hour = userTime.hour();
//       const minute = userTime.minute();
//       const lang = user.language; // Morning reminder at 6:55

//       if (hour === 6 && minute === 55) {
//         await bot.sendMessage(
//           user.id,
//           "⏰ Morning Azkar will start in 5 minutes, in shaa Allah ☀️"
//         );
//       } // Morning Azkar at 7:00

//       if (hour === 7 && minute === 0) {
//         const msg = formatAzkarMessage(morningAzkar, "☀️ Morning Azkar", lang); // Using sendLongMessage ensures correct chunking and final button placement
//         await sendLongMessage(user.id, msg, {
//           parse_mode: "Markdown",
//           reply_markup: {
//             inline_keyboard: [
//               [
//                 {
//                   text: "🎧 Play Morning Azkar Audio",
//                   url: "https://www.tvquran.com/en/selection/3/adhkar-of-the-morning",
//                 },
//               ],
//             ],
//           },
//         });
//       } // Evening reminder at 16:55

//       if (hour === 16 && minute === 55) {
//         await bot.sendMessage(
//           user.id,
//           "🌙 Evening Azkar will start in 5 minutes, in shaa Allah 🤲"
//         );
//       } // Evening Azkar at 17:00

//       if (hour === 17 && minute === 0) {
//         const msg = formatAzkarMessage(eveningAzkar, "🌙 Evening Azkar", lang); // Using sendLongMessage ensures correct chunking and final button placement
//         await sendLongMessage(user.id, msg, {
//           parse_mode: "Markdown",
//           reply_markup: {
//             inline_keyboard: [
//               [
//                 {
//                   text: "🎧 Play Evening Azkar Audio",
//                   url: "https://www.tvquran.com/en/selection/4/embeddable",
//                 },
//               ],
//             ],
//           },
//         });
//       }
//     } catch (e) {
//       console.error(
//         `Error sending scheduled azkar to user ${user.id}:`,
//         e.message
//       );
//     }
//   }
// });

// // =========================
// // 🌐 WEBHOOK ENDPOINT
// // =========================
// app.post(`/bot${TELEGRAM_BOT_TOKEN}`, (req, res) => {
//   bot.processUpdate(req.body);
//   res.sendStatus(200);
// });

// app.get("/", (req, res) => res.send("🌿 Azkar Bot is running, Alhamdulillah!"));
// app.listen(PORT, () => console.log(`✅ Bot running on port ${PORT}`));












// // =========================
// // 🌿 GLOBAL AZKAR BOT FOR THE UMMAH
// // =========================
// require("dotenv").config();
// const express = require("express");
// const TelegramBot = require("node-telegram-bot-api");
// const moment = require("moment-timezone");
// const schedule = require("node-schedule");
// const axios = require("axios");
// const { morningAzkar, eveningAzkar } = require("./azkar");

// // =========================
// // ⚙️ CONFIGURATION
// // =========================
// const app = express();
// app.use(express.json());

// const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// const BASE_URL = process.env.BASE_URL;
// const PORT = process.env.PORT || 10000;

// // 🎧 Google Drive Audio URLs (Direct Download Links)
// const MORNING_AZKAR_AUDIO_URL =
//   "https://drive.google.com/uc?export=download&id=1YaPDxQgbJYeO9NMGJND-PKov28nabUKy"; // Morning Azkar

// const EVENING_AZKAR_AUDIO_URL =
//   "https://drive.google.com/uc?export=download&id=1AwG9xxG9BKPxYfrRBDnAV8keNeGhRe1_"; // Evening Azkar

// // =========================
// // 🤖 TELEGRAM BOT SETUP
// // =========================
// const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
// bot.setWebHook(`${BASE_URL}/bot${TELEGRAM_BOT_TOKEN}`);

// let users = [];

// // =========================
// // 🌍 Helper Functions
// // =========================
// async function getUserTimezone() {
//   try {
//     const res = await axios.get("https://ipapi.co/json/");
//     return res.data.timezone || "Africa/Addis_Ababa";
//   } catch {
//     return "Africa/Addis_Ababa";
//   }
// }

// function formatAzkarMessage(azkarList, title, lang) {
//   let msg = `🌿 *${title}* 🌿\n\n`;
//   azkarList.forEach((azkar, i) => {
//     msg += `✨ *${i + 1}.*\n`;
//     if (lang === "Arabic") msg += `🕋 _${azkar.arabic}_\n`;
//     else if (lang === "English") msg += `🇬🇧 *Meaning:* _${azkar.english}_\n`;
//     else if (lang === "Amharic") msg += `🇪🇹 *ትርጉም:* _${azkar.amharic}_\n`;
//     msg += `🔁 *Repeat:* \`${azkar.repetitions}x\`\n📖 *Source:* _${azkar.source}_\n\n`;
//   });
//   return msg;
// }

// // Sends long text in chunks (safe for Telegram)
// async function sendLongMessage(chatId, text, options = {}) {
//   const chunks = text.match(/[\s\S]{1,4000}/g) || [];
//   for (const chunk of chunks) {
//     await bot.sendMessage(chatId, chunk, options);
//     await new Promise((resolve) => setTimeout(resolve, 100));
//   }
// }

// // =========================
// // 🤖 BOT COMMANDS
// // =========================
// bot.onText(/\/start/, async (msg) => {
//   const chatId = msg.chat.id;
//   const name = msg.from.first_name || "Akhi/Akhti";
//   const timezone = await getUserTimezone();

//   if (!users.find((u) => u.id === chatId)) {
//     users.push({ id: chatId, timezone, language: "Arabic" });
//   }

//   const welcome = `
// 🕌 *As-salamu Alaikum ${name}!*
// 🌿 Welcome to the *Azkar Reminder Bot*

// ☀️ Morning Azkar → 7:00 AM
// 🌙 Evening Azkar → 5:00 PM
// 🌍 Detected timezone: *${timezone}*

// Would you like to subscribe to daily Azkar reminders?
// `;

//   bot.sendMessage(chatId, welcome, {
//     parse_mode: "Markdown",
//     reply_markup: {
//       inline_keyboard: [[{ text: "📿 Subscribe", callback_data: "subscribe_user" }]],
//     },
//   });
// });

// bot.on("callback_query", async (callbackQuery) => {
//   const chatId = callbackQuery.message.chat.id;
//   const data = callbackQuery.data;
//   const user = users.find((u) => u.id === chatId);

//   if (data.startsWith("lang_")) {
//     if (!user) return;
//     if (data === "lang_arabic") user.language = "Arabic";
//     else if (data === "lang_english") user.language = "English";
//     else if (data === "lang_amharic") user.language = "Amharic";

//     const msgByLang = {
//       Arabic: "✅ تم تعيين اللغة إلى العربية. ستتلقى الأذكار بهذه اللغة إن شاء الله.",
//       English: "✅ Language set to English. You'll now receive Azkar in English.",
//       Amharic: "✅ ቋንቋዎን ወደ አማርኛ ቀይረዋል። አዝካር በዚህ ቋንቋ ይደርሳችሁ።",
//     };

//     bot.sendMessage(chatId, msgByLang[user.language], { parse_mode: "Markdown" });
//     return;
//   }

//   if (data === "subscribe_user") {
//     if (!user) {
//       const timezone = await getUserTimezone();
//       users.push({ id: chatId, timezone, language: "Arabic" });
//     }

//     bot.sendMessage(
//       chatId,
//       "✅ You are now subscribed to daily Azkar reminders! Choose your language below:",
//       {
//         parse_mode: "Markdown",
//         reply_markup: {
//           inline_keyboard: [
//             [
//               { text: "🕋 Arabic", callback_data: "lang_arabic" },
//               { text: "🇬🇧 English", callback_data: "lang_english" },
//               { text: "🇪🇹 Amharic", callback_data: "lang_amharic" },
//             ],
//           ],
//         },
//       }
//     );
//   }
// });

// bot.onText(/\/help/, (msg) => {
//   const helpMessage = `
// 🤖 *Available Commands:*
// /start - Start or restart the bot
// /help - Show this help message
// /test - Send a sample Azkar message
// /stop - Unsubscribe from daily reminders

// 🕓 *Reminder Times:*
// ☀️ Morning: 7:00 AM
// 🌙 Evening: 5:00 PM (17:00)
// `;
//   bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: "Markdown" });
// });

// bot.onText(/\/stop/, (msg) => {
//   const chatId = msg.chat.id;
//   users = users.filter((u) => u.id !== chatId);
//   bot.sendMessage(
//     chatId,
//     "🛑 You have unsubscribed from Azkar reminders. You can rejoin anytime using /start"
//   );
// });

// // 🧭 Test Command
// bot.onText(/\/test/, async (msg) => {
//   const chatId = msg.chat.id;
//   const now = moment().tz("Africa/Addis_Ababa");
//   const user = users.find((u) => u.id === chatId);
//   const lang = user ? user.language : "Arabic";

//   const isMorning = now.hour() >= 5 && now.hour() < 12;
//   const message = isMorning
//     ? formatAzkarMessage(morningAzkar, "☀️ Morning Azkar", lang)
//     : formatAzkarMessage(eveningAzkar, "🌙 Evening Azkar", lang);

//   const audioLink = isMorning ? MORNING_AZKAR_AUDIO_URL : EVENING_AZKAR_AUDIO_URL;
//   const captionText = isMorning ? "*Morning Azkar Audio*" : "*Evening Azkar Audio*";

//   await sendLongMessage(chatId, message, { parse_mode: "Markdown" });
//   await bot.sendAudio(chatId, audioLink, { caption: captionText, parse_mode: "Markdown" });
// });

// // =========================
// // ⏰ GLOBAL AZKAR SCHEDULE
// // =========================
// schedule.scheduleJob("* * * * *", async () => {
//   const nowUTC = moment.utc();
//   for (const user of users) {
//     try {
//       const userTime = nowUTC.clone().tz(user.timezone);
//       const hour = userTime.hour();
//       const minute = userTime.minute();
//       const lang = user.language;

//       // Morning reminder at 6:55
//       if (hour === 6 && minute === 55) {
//         await bot.sendMessage(user.id, "⏰ Morning Azkar will start in 5 minutes, in shaa Allah ☀️");
//       }

//       // Morning Azkar at 7:00
//       if (hour === 7 && minute === 0) {
//         const msg = formatAzkarMessage(morningAzkar, "☀️ Morning Azkar", lang);
//         await sendLongMessage(user.id, msg, { parse_mode: "Markdown" });
//         await bot.sendAudio(user.id, MORNING_AZKAR_AUDIO_URL, {
//           caption: "*Morning Azkar Audio*",
//           parse_mode: "Markdown",
//         });
//       }

//       // Evening reminder at 16:55
//       if (hour === 16 && minute === 55) {
//         await bot.sendMessage(user.id, "🌙 Evening Azkar will start in 5 minutes, in shaa Allah 🤲");
//       }

//       // Evening Azkar at 17:00
//       if (hour === 17 && minute === 0) {
//         const msg = formatAzkarMessage(eveningAzkar, "🌙 Evening Azkar", lang);
//         await sendLongMessage(user.id, msg, { parse_mode: "Markdown" });
//         await bot.sendAudio(user.id, EVENING_AZKAR_AUDIO_URL, {
//           caption: "*Evening Azkar Audio*",
//           parse_mode: "Markdown",
//         });
//       }
//     } catch (e) {
//       console.error(`Error sending scheduled azkar to user ${user.id}:`, e.message);
//     }
//   }
// });

// // =========================
// // 🌐 WEBHOOK ENDPOINT
// // =========================
// app.post(`/bot${TELEGRAM_BOT_TOKEN}`, (req, res) => {
//   bot.processUpdate(req.body);
//   res.sendStatus(200);
// });

// app.get("/", (req, res) => res.send("🌿 Azkar Bot is running, Alhamdulillah!"));
// app.listen(PORT, () => console.log(`✅ Bot running on port ${PORT}`));














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

// 🎧 FIX: Using Telegram File IDs for reliable streaming playback.
// *** You MUST replace these placeholders with the actual File IDs
// *** obtained by sending the MP3 files to your bot and inspecting the log.
const MORNING_AZKAR_AUDIO_URL = "YOUR_MORNING_AZKAR_TELEGRAM_FILE_ID"; 
const EVENING_AZKAR_AUDIO_URL = "YOUR_EVENING_AZKAR_TELEGRAM_FILE_ID";

// =========================
// 🤖 TELEGRAM BOT SETUP
// =========================
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
bot.setWebHook(`${BASE_URL}/bot${TELEGRAM_BOT_TOKEN}`);

let users = [];

// =========================
// 🌍 Helper Functions
// =========================
async function getUserTimezone() {
  try {
    const res = await axios.get("https://ipapi.co/json/");
    return res.data.timezone || "Africa/Addis_Ababa";
  } catch {
    return "Africa/Addis_Ababa";
  }
}

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

// Sends long text in chunks (safe for Telegram)
async function sendLongMessage(chatId, text, options = {}) {
  const chunks = text.match(/[\s\S]{1,4000}/g) || [];
  for (const chunk of chunks) {
    await bot.sendMessage(chatId, chunk, options);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

// =========================
// 🤖 BOT COMMANDS
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
      Arabic: "✅ تم تعيين اللغة إلى العربية. ستتلقى الأذكار بهذه اللغة إن شاء الله.",
      English: "✅ Language set to English. You'll now receive Azkar in English.",
      Amharic: "✅ ቋንቋዎን ወደ አማርኛ ቀይረዋል። አዝካር በዚህ ቋንቋ ይደርሳችሁ።",
    };

    bot.sendMessage(chatId, msgByLang[user.language], { parse_mode: "Markdown" });
    return;
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

  // 1. Send the long text message first
  await sendLongMessage(chatId, message, { parse_mode: "Markdown" });
  
  // 2. Send the audio file after the text
  await bot.sendAudio(chatId, audioLink, { caption: captionText, parse_mode: "Markdown" });
});

// =========================
// 🎧 FILE ID CAPTURE (TEMPORARY CODE)
// =========================
bot.on('audio', (msg) => {
    const chatId = msg.chat.id;
    const fileId = msg.audio.file_id;
    const fileName = msg.audio.title || "Untitled Audio";

    console.log(`\n\n✅ AUDIO RECEIVED!`);
    console.log(`File Name: ${fileName}`);
    console.log(`Chat ID: ${chatId}`);
    console.log(`⭐ FILE ID (COPY THIS): ${fileId}`);
    console.log(`\n`);
    
    // Optional: Send the ID back to your chat for easy copying
    bot.sendMessage(chatId, 
        `Audio File ID Received:\n\`${fileId}\`\n\nCopy this ID and paste it into the MORNING/EVENING_AZKAR_AUDIO_URL constant.`,
        { parse_mode: 'Markdown' }
    );
});
// =========================

// =========================
// ⏰ GLOBAL AZKAR SCHEDULE
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
        
        // 1. Send the long text message
        await sendLongMessage(user.id, msg, { parse_mode: "Markdown" });
        
        // 2. Send the audio file using the reliable File ID
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
        
        // 1. Send the long text message
        await sendLongMessage(user.id, msg, { parse_mode: "Markdown" });
        
        // 2. Send the audio file using the reliable File ID
        await bot.sendAudio(user.id, EVENING_AZKAR_AUDIO_URL, {
          caption: "*Evening Azkar Audio*",
          parse_mode: "Markdown",
        });
      }
    } catch (e) {
      console.error(`Error sending scheduled azkar to user ${user.id}:`, e.message);
    }
  }
});

// =========================
// 🌐 WEBHOOK ENDPOINT
// =========================
app.post(`/bot${TELEGRAM_BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get("/", (req, res) => res.send("🌿 Azkar Bot is running, Alhamdulillah!"));
app.listen(PORT, () => console.log(`✅ Bot running on port ${PORT}`));