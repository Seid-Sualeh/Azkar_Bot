


// // // =========================
// // // 🌿 GLOBAL AZKAR BOT FOR THE UMMAH
// // // =========================
// // require("dotenv").config();
// // const express = require("express");
// // const TelegramBot = require("node-telegram-bot-api");
// // const moment = require("moment-timezone");
// // const schedule = require("node-schedule");
// // const axios = require("axios");
// // const { morningAzkar, eveningAzkar } = require("./azkar");

// // // =========================
// // // ⚙️ CONFIGURATION
// // // =========================
// // const app = express();
// // app.use(express.json());

// // const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// // const BASE_URL = process.env.BASE_URL;
// // const PORT = process.env.PORT || 10000;

// // // Initialize bot (no polling)
// // const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
// // bot.setWebHook(`${BASE_URL}/bot${TELEGRAM_BOT_TOKEN}`);

// // let users = [];

// // // =========================
// // // 🌍 Helper Functions
// // // =========================
// // async function getUserTimezone() {
// //   try {
// //     const res = await axios.get("https://ipapi.co/json/");
// //     return res.data.timezone || "Africa/Addis_Ababa";
// //   } catch {
// //     return "Africa/Addis_Ababa";
// //   }
// // }

// // function formatAzkarMessage(azkarList, title, lang) {
// //   let msg = `🌿 *${title}* 🌿\n\n`;

// //   azkarList.forEach((azkar, i) => {
// //     msg += `✨ *${i + 1}.*\n`;

// //     if (lang === "Arabic") {
// //       msg += `🕋 _${azkar.arabic}_\n`;
// //     } else if (lang === "English") {
// //       msg += `🇬🇧 *Meaning:* _${azkar.english}_\n`;
// //     } else if (lang === "Amharic") {
// //       msg += `🇪🇹 *ትርጉም:* _${azkar.amharic}_\n`;
// //     }

// //     msg += `🔁 *Repeat:* \`${azkar.repetitions}x\`\n`;
// //     msg += `📖 *Source:* _${azkar.source}_\n\n`;
// //   });

// //   return msg;
// // }

// // // =========================
// // // 🤖 BOT COMMANDS
// // // =========================
// // bot.onText(/\/start/, async (msg) => {
// //   const chatId = msg.chat.id;
// //   const name = msg.from.first_name || "Akhi/Akhti";
// //   const timezone = await getUserTimezone();

// //   if (!users.find((u) => u.id === chatId)) {
// //     users.push({ id: chatId, timezone, language: "Arabic" });
// //   }

// //   const welcome = `
// // 🕌 *As-salamu Alaikum ${name}!*

// // 🌿 Welcome to the *Azkar Reminder Bot*
// // ☀️ Morning Azkar → 7:00 AM
// // 🌙 Evening Azkar → 17:00 PM
// // 🌍 Detected timezone: *${timezone}*

// // Please select your preferred language:
// // `;

// //   bot.sendMessage(chatId, welcome, {
// //     parse_mode: "Markdown",
// //     reply_markup: {
// //       inline_keyboard: [
// //         [
// //           { text: "🕋 Arabic", callback_data: "lang_arabic" },
// //           { text: "🇬🇧 English", callback_data: "lang_english" },
// //           { text: "🇪🇹 Amharic", callback_data: "lang_amharic" },
// //         ],
// //       ],
// //     },
// //   });
// // });

// // // Language Selection
// // bot.on("callback_query", (callbackQuery) => {
// //   const chatId = callbackQuery.message.chat.id;
// //   const data = callbackQuery.data;
// //   const user = users.find((u) => u.id === chatId);
// //   if (!user) return;

// //   if (data === "lang_arabic") user.language = "Arabic";
// //   else if (data === "lang_english") user.language = "English";
// //   else if (data === "lang_amharic") user.language = "Amharic";

// //   const msgByLang = {
// //     Arabic: "✅ تم تعيين اللغة إلى العربية. ستتلقى الأذكار بهذه اللغة إن شاء الله.",
// //     English: "✅ Language set to English. You’ll now receive Azkar in English.",
// //     Amharic: "✅ ቋንቋዎን ወደ አማርኛ ቀይረዋል። አዝካር በዚህ ቋንቋ ይደርሳችሁ።",
// //   };

// //   bot.sendMessage(chatId, msgByLang[user.language], { parse_mode: "Markdown" });
// // });

// // // Stop command
// // bot.onText(/\/stop/, (msg) => {
// //   const chatId = msg.chat.id;
// //   users = users.filter((u) => u.id !== chatId);
// //   bot.sendMessage(chatId, "🛑 You have unsubscribed from Azkar reminders.");
// // });

// // // Test command
// // bot.onText(/\/test/, (msg) => {
// //   const chatId = msg.chat.id;
// //   const now = moment().tz("Africa/Addis_Ababa");
// //   const user = users.find((u) => u.id === chatId);
// //   const lang = user ? user.language : "Arabic";

// //   const message =
// //     now.hour() >= 5 && now.hour() < 12
// //       ? formatAzkarMessage(morningAzkar, "☀️ Morning Azkar", lang)
// //       : formatAzkarMessage(eveningAzkar, "🌙 Evening Azkar", lang);

// //   // Split long messages
// //   const chunks = message.match(/[\s\S]{1,4000}/g) || [];
// //   chunks.forEach((chunk) => {
// //     bot.sendMessage(chatId, chunk, { parse_mode: "Markdown" });
// //   });
// // });

// // // =========================
// // // ⏰ AZKAR SCHEDULE (GLOBAL)
// // // =========================
// // schedule.scheduleJob("* * * * *", async () => {
// //   const nowUTC = moment.utc();
// //   for (const user of users) {
// //     const userTime = nowUTC.clone().tz(user.timezone);
// //     const hour = userTime.hour();
// //     const minute = userTime.minute();
// //     const lang = user.language;

// //     if (hour === 6 && minute === 55) {
// //       bot.sendMessage(user.id, "⏰ Morning Azkar will start in 5 minutes, in shaa Allah ☀️");
// //     }

// //     if (hour === 7 && minute === 0) {
// //       const msg = formatAzkarMessage(morningAzkar, "☀️ Morning Azkar", lang);
// //       bot.sendMessage(user.id, msg, { parse_mode: "Markdown" });
// //     }

// //     if (hour === 16 && minute === 55) {
// //       bot.sendMessage(user.id, "🌙 Evening Azkar will start in 5 minutes, in shaa Allah 🤲");
// //     }

// //     if (hour === 17 && minute === 0) {
// //       const msg = formatAzkarMessage(eveningAzkar, "🌙 Evening Azkar", lang);
// //       bot.sendMessage(user.id, msg, { parse_mode: "Markdown" });
// //     }
// //   }
// // });

// // // =========================
// // // 🌐 WEBHOOK ENDPOINT
// // // =========================
// // app.post(`/bot${TELEGRAM_BOT_TOKEN}`, (req, res) => {
// //   bot.processUpdate(req.body);
// //   res.sendStatus(200);
// // });

// // app.get("/", (req, res) => res.send("🌿 Azkar Bot is running, Alhamdulillah!"));

// // app.listen(PORT, () => console.log(`✅ Bot running on port ${PORT}`));













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

// // Initialize bot (webhook mode)
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

//     if (lang === "Arabic") {
//       msg += `🕋 _${azkar.arabic}_\n`;
//     } else if (lang === "English") {
//       msg += `🇬🇧 *Meaning:* _${azkar.english}_\n`;
//     } else if (lang === "Amharic") {
//       msg += `🇪🇹 *ትርጉም:* _${azkar.amharic}_\n`;
//     }

//     msg += `🔁 *Repeat:* \`${azkar.repetitions}x\`\n`;
//     msg += `📖 *Source:* _${azkar.source}_\n\n`;
//   });

//   return msg;
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
// 🌙 Evening Azkar → 17:00 PM
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

// // 📩 Handle subscription confirmation
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
//       English: "✅ Language set to English. You’ll now receive Azkar in English.",
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

//     bot.sendMessage(chatId, "✅ You are now subscribed to daily Azkar reminders! Choose your language below:", {
//       parse_mode: "Markdown",
//       reply_markup: {
//         inline_keyboard: [
//           [
//             { text: "🕋 Arabic", callback_data: "lang_arabic" },
//             { text: "🇬🇧 English", callback_data: "lang_english" },
//             { text: "🇪🇹 Amharic", callback_data: "lang_amharic" },
//           ],
//         ],
//       },
//     });
//   }
// });

// // 📘 Help Command
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

// 💡 Tip: You can choose Arabic, English, or Amharic language anytime!
// `;

//   bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: "Markdown" });
// });

// // 🛑 Stop Command
// bot.onText(/\/stop/, (msg) => {
//   const chatId = msg.chat.id;
//   users = users.filter((u) => u.id !== chatId);
//   bot.sendMessage(chatId, "🛑 You have unsubscribed from Azkar reminders. You can rejoin anytime using /start");
// });

// // 🧭 Test Command
// bot.onText(/\/test/, (msg) => {
//   const chatId = msg.chat.id;
//   const now = moment().tz("Africa/Addis_Ababa");
//   const user = users.find((u) => u.id === chatId);
//   const lang = user ? user.language : "Arabic";

//   const isMorning = now.hour() >= 5 && now.hour() < 12;
//   const message = isMorning
//     ? formatAzkarMessage(morningAzkar, "☀️ Morning Azkar", lang)
//     : formatAzkarMessage(eveningAzkar, "🌙 Evening Azkar", lang);

//   const chunks = message.match(/[\s\S]{1,4000}/g) || [];
//   chunks.forEach((chunk) => {
//     bot.sendMessage(chatId, chunk, {
//       parse_mode: "Markdown",
//       reply_markup: {
//         inline_keyboard: [
//           [
//             {
//               text: isMorning ? "🎧 Play Morning Azkar Audio" : "🎧 Play Evening Azkar Audio",
//               url: isMorning
//                 ? "https://raw.githubusercontent.com/Seid-Sualeh/Azkar_Bot/main/audio/morning%20azkar.mp3"
//                 : "https://raw.githubusercontent.com/Seid-Sualeh/Azkar_Bot/main/audio/evening%20azkar.mp3",
//             },
//           ],
//         ],
//       },
//     });
//   });
// });

// // =========================
// // ⏰ AZKAR SCHEDULE (GLOBAL)
// // =========================
// schedule.scheduleJob("* * * * *", async () => {
//   const nowUTC = moment.utc();
//   for (const user of users) {
//     const userTime = nowUTC.clone().tz(user.timezone);
//     const hour = userTime.hour();
//     const minute = userTime.minute();
//     const lang = user.language;

//     if (hour === 6 && minute === 55) {
//       bot.sendMessage(user.id, "⏰ Morning Azkar will start in 5 minutes, in shaa Allah ☀️");
//     }

//     if (hour === 7 && minute === 0) {
//       const msg = formatAzkarMessage(morningAzkar, "☀️ Morning Azkar", lang);
//       bot.sendMessage(user.id, msg, {
//         parse_mode: "Markdown",
//         reply_markup: {
//           inline_keyboard: [
//             [
//               {
//                 text: "🎧 Play Morning Azkar Audio",
//                 url: "https://raw.githubusercontent.com/Seid-Sualeh/Azkar_Bot/main/audio/morning%20azkar.mp3",
//               },
//             ],
//           ],
//         },
//       });
//     }

//     if (hour === 16 && minute === 55) {
//       bot.sendMessage(user.id, "🌙 Evening Azkar will start in 5 minutes, in shaa Allah 🤲");
//     }

//     if (hour === 17 && minute === 0) {
//       const msg = formatAzkarMessage(eveningAzkar, "🌙 Evening Azkar", lang);
//       bot.sendMessage(user.id, msg, {
//         parse_mode: "Markdown",
//         reply_markup: {
//           inline_keyboard: [
//             [
//               {
//                 text: "🎧 Play Evening Azkar Audio",
//                 url: "https://raw.githubusercontent.com/Seid-Sualeh/Azkar_Bot/main/audio/evening%20azkar.mp3",
//               },
//             ],
//           ],
//         },
//       });
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

// // Initialize bot (webhook mode)
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

//     if (lang === "Arabic") {
//       msg += `🕋 _${azkar.arabic}_\n`;
//     } else if (lang === "English") {
//       msg += `🇬🇧 *Meaning:* _${azkar.english}_\n`;
//     } else if (lang === "Amharic") {
//       msg += `🇪🇹 *ትርጉም:* _${azkar.amharic}_\n`;
//     }

//     msg += `🔁 *Repeat:* \`${azkar.repetitions}x\`\n`;
//     msg += `📖 *Source:* _${azkar.source}_\n\n`;
//   });

//   return msg;
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
// 🌙 Evening Azkar → 17:00 PM
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

// // 📩 Handle subscription confirmation
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
//         "✅ Language set to English. You’ll now receive Azkar in English.",
//       Amharic: "✅ ቋንቋዎን ወደ አማርኛ ቀይረዋል። አዝካር በአማርኛ ቋንቋ ይደርሳችሁ።",
//     };

//     bot.sendMessage(chatId, msgByLang[user.language], { parse_mode: "Markdown" });
//     return;
//   }

//   if (data === "subscribe_user") {
//     if (!user) {
//       const timezone = await getUserTimezone();
//       users.push({ id: chatId, timezone, language: "Arabic" });
//     }

//     bot.sendMessage(chatId, "✅ You are now subscribed to daily Azkar reminders! Choose your language below:", {
//       parse_mode: "Markdown",
//       reply_markup: {
//         inline_keyboard: [
//           [
//             { text: "🕋 Arabic", callback_data: "lang_arabic" },
//             { text: "🇬🇧 English", callback_data: "lang_english" },
//             { text: "🇪🇹 Amharic", callback_data: "lang_amharic" },
//           ],
//         ],
//       },
//     });
//   }
// });

// // 📘 Help Command
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

// 💡 Tip: You can choose Arabic, English, or Amharic language anytime!
// `;

//   bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: "Markdown" });
// });

// // 🛑 Stop Command
// bot.onText(/\/stop/, (msg) => {
//   const chatId = msg.chat.id;
//   users = users.filter((u) => u.id !== chatId);
//   bot.sendMessage(chatId, "🛑 You have unsubscribed from Azkar reminders. You can rejoin anytime using /start");
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

//   const chunks = message.match(/[\s\S]{1,4000}/g) || [];
//   for (const chunk of chunks) {
//     await bot.sendMessage(chatId, chunk, { parse_mode: "Markdown" });
//   }

//   // 🎧 Send playable audio directly inside Telegram
//   const audioUrl = isMorning
//     ? "https://raw.githubusercontent.com/Seid-Sualeh/Azkar_Bot/main/audio/morning%20azkar.mp3"
//     : "https://raw.githubusercontent.com/Seid-Sualeh/Azkar_Bot/main/audio/evening%20azkar.mp3";

//   const caption = isMorning
//     ? "🎧 *Morning Azkar Audio* — Listen to all morning Azkar together 🌅"
//     : "🎧 *Evening Azkar Audio* — Listen to all evening Azkar together 🌙";

//   await bot.sendAudio(chatId, audioUrl, {
//     caption,
//     parse_mode: "Markdown",
//   });
// });

// // =========================
// // ⏰ AZKAR SCHEDULE (GLOBAL)
// // =========================
// schedule.scheduleJob("* * * * *", async () => {
//   const nowUTC = moment.utc();
//   for (const user of users) {
//     const userTime = nowUTC.clone().tz(user.timezone);
//     const hour = userTime.hour();
//     const minute = userTime.minute();
//     const lang = user.language;

//     if (hour === 6 && minute === 55) {
//       bot.sendMessage(user.id, "⏰ Morning Azkar will start in 5 minutes, in shaa Allah ☀️");
//     }

//     if (hour === 7 && minute === 0) {
//       const msg = formatAzkarMessage(morningAzkar, "☀️ Morning Azkar", lang);
//       await bot.sendMessage(user.id, msg, { parse_mode: "Markdown" });

//       // Send Morning Azkar Audio
//       await bot.sendAudio(
//         user.id,
//         "https://raw.githubusercontent.com/Seid-Sualeh/Azkar_Bot/main/audio/morning%20azkar.mp3",
//         {
//           caption: "🎧 *Morning Azkar Audio* — Listen to all morning Azkar 🌅",
//           parse_mode: "Markdown",
//         }
//       );
//     }

//     if (hour === 16 && minute === 55) {
//       bot.sendMessage(user.id, "🌙 Evening Azkar will start in 5 minutes, in shaa Allah 🤲");
//     }

//     if (hour === 17 && minute === 0) {
//       const msg = formatAzkarMessage(eveningAzkar, "🌙 Evening Azkar", lang);
//       await bot.sendMessage(user.id, msg, { parse_mode: "Markdown" });

//       // Send Evening Azkar Audio
//       await bot.sendAudio(
//         user.id,
//         "https://raw.githubusercontent.com/Seid-Sualeh/Azkar_Bot/main/audio/evening%20azkar.mp3",
//         {
//           caption: "🎧 *Evening Azkar Audio* — Listen to all evening Azkar 🌙",
//           parse_mode: "Markdown",
//         }
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

// === AUDIO URLs ===
const MORNING_AUDIO_URL = "https://raw.githubusercontent.com/Seid-Sualeh/Azkar_Bot/main/audio/morning%20azkar.mp3";
const EVENING_AUDIO_URL = "https://raw.githubusercontent.com/Seid-Sualeh/Azkar_Bot/main/audio/evening%20azkar.mp3";
// ==================

// Initialize bot (webhook mode)
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

    if (lang === "Arabic") {
      msg += `🕋 _${azkar.arabic}_\n`;
    } else if (lang === "English") {
      msg += `🇬🇧 *Meaning:* _${azkar.english}_\n`;
    } else if (lang === "Amharic") {
      msg += `🇪🇹 *ትርጉም:* _${azkar.amharic}_\n`;
    }

    msg += `🔁 *Repeat:* \`${azkar.repetitions}x\`\n`;
    msg += `📖 *Source:* _${azkar.source}_\n\n`;
  });

  return msg;
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
🌙 Evening Azkar → 17:00 PM
🌍 Detected timezone: *${timezone}*

Would you like to subscribe to daily Azkar reminders?
`;

  bot.sendMessage(chatId, welcome, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "📿 Subscribe", callback_data: "subscribe_user" }],
      ],
    },
  });
});

// 📩 Handle subscription confirmation
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
      English: "✅ Language set to English. You’ll now receive Azkar in English.",
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

    bot.sendMessage(chatId, "✅ You are now subscribed to daily Azkar reminders! Choose your language below:", {
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
    });
  }
});

// 📘 Help Command
bot.onText(/\/help/, (msg) => {
  const helpMessage = `
🤖 *Available Commands:*
/start - Start or restart the bot
/help - Show this help message
/test - Send a sample Azkar message (Text and Audio)
/stop - Unsubscribe from daily reminders

🕓 *Reminder Times:*
☀️ Morning: 7:00 AM
🌙 Evening: 5:00 PM (17:00)

💡 Tip: You can choose Arabic, English, or Amharic language anytime!
`;

  bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: "Markdown" });
});

// 🛑 Stop Command
bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  users = users.filter((u) => u.id !== chatId);
  bot.sendMessage(chatId, "🛑 You have unsubscribed from Azkar reminders. You can rejoin anytime using /start");
});

// 🧭 Test Command
bot.onText(/\/test/, (msg) => {
  const chatId = msg.chat.id;
  const now = moment().tz("Africa/Addis_Ababa");
  const user = users.find((u) => u.id === chatId);
  const lang = user ? user.language : "Arabic";

  const isMorning = now.hour() >= 5 && now.hour() < 12;
  const message = isMorning
    ? formatAzkarMessage(morningAzkar, "☀️ Morning Azkar", lang)
    : formatAzkarMessage(eveningAzkar, "🌙 Evening Azkar", lang);

  const audioUrl = isMorning ? MORNING_AUDIO_URL : EVENING_AUDIO_URL;
  const audioCaption = isMorning ? "🎧 Morning Azkar Audio" : "🎧 Evening Azkar Audio";

  // 1. Send the text message (Azkar list)
  const chunks = message.match(/[\s\S]{1,4000}/g) || [];
  chunks.forEach((chunk) => {
    // NOTE: Inline keyboard for audio is removed here
    bot.sendMessage(chatId, chunk, { parse_mode: "Markdown" });
  });

  // 2. Send the playable audio file directly
  bot.sendAudio(chatId, audioUrl, {
    caption: audioCaption,
    parse_mode: "Markdown",
  });
});

// =========================
// ⏰ AZKAR SCHEDULE (GLOBAL)
// =========================
schedule.scheduleJob("* * * * *", async () => {
  const nowUTC = moment.utc();
  for (const user of users) {
    const userTime = nowUTC.clone().tz(user.timezone);
    const hour = userTime.hour();
    const minute = userTime.minute();
    const lang = user.language;

    // === MORNING AZKAR ===
    if (hour === 6 && minute === 55) {
      bot.sendMessage(user.id, "⏰ Morning Azkar will start in 5 minutes, in shaa Allah ☀️");
    }

    if (hour === 7 && minute === 0) {
      // 1. Send the text message
      const msg = formatAzkarMessage(morningAzkar, "☀️ Morning Azkar", lang);
      bot.sendMessage(user.id, msg, { parse_mode: "Markdown" });

      // 2. Send the playable audio file
      bot.sendAudio(user.id, MORNING_AUDIO_URL, {
        caption: "🎧 Morning Azkar Audio",
        parse_mode: "Markdown",
      });
    }

    // === EVENING AZKAR ===
    if (hour === 16 && minute === 55) {
      bot.sendMessage(user.id, "🌙 Evening Azkar will start in 5 minutes, in shaa Allah 🤲");
    }

    if (hour === 17 && minute === 0) {
      // 1. Send the text message
      const msg = formatAzkarMessage(eveningAzkar, "🌙 Evening Azkar", lang);
      bot.sendMessage(user.id, msg, { parse_mode: "Markdown" });

      // 2. Send the playable audio file
      bot.sendAudio(user.id, EVENING_AUDIO_URL, {
        caption: "🎧 Evening Azkar Audio",
        parse_mode: "Markdown",
      });
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