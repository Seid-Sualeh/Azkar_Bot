// =========================
// 📦 IMPORTS
// =========================
 require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const moment = require("moment-timezone");
const schedule = require("node-schedule");
const axios = require("axios");
const { morningAzkar, eveningAzkar } = require("./azkar");
  
// =========================
// 🤖 BOT SETUP
// =========================
  const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

let users = [];

// =========================
// 🕋 HELPER FUNCTIONS
// =========================

// Detect user's timezone automatically using IP
async function getUserTimezone() {
  try {
    const res = await axios.get("https://ipapi.co/json/");
    return res.data.timezone || "Africa/Addis_Ababa";
  } catch (err) {
    return "Africa/Addis_Ababa";
  }
}

// Labels per language
const labels = {
  Arabic: {
    repeat: "التكرار",
    source: "المصدر",
    languageSet: "✅ تم ضبط اللغة على",
    morningAzkar: "☀️ أذكار الصباح",
    eveningAzkar: "🌙 أذكار المساء",
    part: "📖 الجزء",
  },
  English: {
    repeat: "Repeat",
    source: "Source",
    languageSet: "✅ Language set to",
    morningAzkar: "☀️ Morning Azkar",
    eveningAzkar: "🌙 Evening Azkar",
    part: "📖 Part",
  },
  Amharic: {
    repeat: "መደገፊያ",
    source: "መነሻ",
    languageSet: "✅ ቋንቋ ተሰብስቧል",
    morningAzkar: "☀️ የጠዋት አዝካር",
    eveningAzkar: "🌙 የማታ አዝካር",
    part: "📖 ክፍል",
  },
};

// Format Azkar message beautifully, only in the selected language
function formatAzkarMessageByLanguage(azkarList, title, language) {
  const langLabels = labels[language];
  let message = `🌿 *${title}* 🌿\n\n`;
  azkarList.forEach((azkar, i) => {
    message += `✨ *${i + 1}.*\n`;
    if (language === "Arabic") message += `🕋 _${azkar.arabic}_\n`;
    else if (language === "English") message += `🇬🇧 _${azkar.english}_\n`;
    else if (language === "Amharic") message += `🇪🇹 _${azkar.amharic}_\n`;

    message += `🔁 *${langLabels.repeat}:* \`${azkar.repetitions}x\`\n`;
    message += `📖 *${langLabels.source}:* _${azkar.source}_\n\n`;
  });
  return message;
}

// 🧩 Helper: Split long messages
function sendLongMessage(chatId, text, language, options = {}) {
  const MAX_LENGTH = 4000; // Telegram limit
  const langLabels = labels[language];
  const parts = text.match(new RegExp(`.{1,${MAX_LENGTH}}`, "gs"));

  parts.forEach((part, index) => {
    const label =
      parts.length > 1
        ? `${langLabels.part} ${index + 1}/${parts.length}\n\n`
        : "";
    setTimeout(() => {
      bot.sendMessage(chatId, label + part, options);
    }, index * 1500);
  });
}

// =========================
// 💠 BOT COMMANDS
// =========================

// /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || "Akhi/Akhti";
  const timezone = await getUserTimezone();

  if (!users.find((u) => u.id === chatId)) {
    users.push({ id: chatId, timezone, language: "Arabic" }); // default Arabic
  }

  const welcomeMsg = `
🕌 *As-salamu Alaikum ${userName}!*  

🤖 Welcome to *Azkar Reminder Bot* 🌿  
This bot will send you:  
☀️ Morning Azkar (7:00 AM)  
🌙 Evening Azkar (7:00 PM)  
📍Timezone detected: *${timezone}*  

Please select your preferred *language*:
  `;

  const opts = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🕋 Arabic", callback_data: "lang_arabic" },
          { text: "🇬🇧 English", callback_data: "lang_english" },
          { text: "🇪🇹 Amharic", callback_data: "lang_amharic" },
        ],
      ],
    },
    parse_mode: "Markdown",
  };

  bot.sendMessage(chatId, welcomeMsg, opts);
});

// Language selection
bot.on("callback_query", (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const user = users.find((u) => u.id === chatId);

  if (!user) return;

  if (data === "lang_arabic") user.language = "Arabic";
  else if (data === "lang_english") user.language = "English";
  else if (data === "lang_amharic") user.language = "Amharic";

  const langLabels = labels[user.language];
  bot.sendMessage(chatId, `${langLabels.languageSet} *${user.language}*.`, {
    parse_mode: "Markdown",
  });
});

// /stop
bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  users = users.filter((u) => u.id !== chatId);
  bot.sendMessage(chatId, "🛑 You have unsubscribed from Azkar reminders.");
});

// /menu
bot.onText(/\/menu/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "📋 *Main Menu*", {
    parse_mode: "Markdown",
    reply_markup: {
      keyboard: [
        ["/start", "/stop"],
        ["/test", "/help"],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  });
});

// /help
bot.onText(/\/help/, (msg) => {
  const helpMessage = `
📖 *Bot Commands:*  
/start - Start the bot and set preferences  
/stop - Stop receiving reminders  
/menu - Show the main menu  
/test - Send Azkar immediately for testing  
/help - Show this help message
  `;
  bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: "Markdown" });
});

// /test
bot.onText(/\/test/, (msg) => {
  const chatId = msg.chat.id;
  const user = users.find((u) => u.id === chatId);
  if (!user) return;

  const now = moment().tz(user.timezone);
  const hour = now.hour();

  const message =
    hour >= 5 && hour < 12
      ? formatAzkarMessageByLanguage(
          morningAzkar,
          labels[user.language].morningAzkar,
          user.language
        )
      : formatAzkarMessageByLanguage(
          eveningAzkar,
          labels[user.language].eveningAzkar,
          user.language
        );

  sendLongMessage(chatId, message, user.language, { parse_mode: "Markdown" });
});

// =========================
// ⏰ SCHEDULER
// =========================
schedule.scheduleJob("* * * * *", () => {
  const nowUTC = moment.utc();

  users.forEach((user) => {
    const userTime = nowUTC.clone().tz(user.timezone);
    const hour = userTime.hour();
    const minute = userTime.minute();
    const langLabels = labels[user.language];

    // Morning reminder 5 min before (6:55)
    if (hour === 6 && minute === 55) {
      bot.sendMessage(
        user.id,
        `⏰ ${langLabels.morningAzkar} will start in 5 minutes. Get ready! 🌅`
      );
    }

    // Morning Azkar (7:00)
    if (hour === 7 && minute === 0) {
      bot.sendMessage(
        user.id,
        `☀️ *${langLabels.morningAzkar} starting now...*`,
        { parse_mode: "Markdown" }
      );
      const msg = formatAzkarMessageByLanguage(
        morningAzkar,
        langLabels.morningAzkar,
        user.language
      );
      sendLongMessage(user.id, msg, user.language, { parse_mode: "Markdown" });
    }

    // Evening reminder 5 min before (6:55 PM)
    if (hour === 18 && minute === 55) {
      bot.sendMessage(
        user.id,
        `🌙 ${langLabels.eveningAzkar} will start in 5 minutes. Prepare yourself 🤲`
      );
    }

    // Evening Azkar (7:00 PM)
    if (hour === 19 && minute === 0) {
      bot.sendMessage(
        user.id,
        `🌙 *${langLabels.eveningAzkar} starting now...*`,
        { parse_mode: "Markdown" }
      );
      const msg = formatAzkarMessageByLanguage(
        eveningAzkar,
        langLabels.eveningAzkar,
        user.language
      );
      sendLongMessage(user.id, msg, user.language, { parse_mode: "Markdown" });
    }
  });
});

console.log("✅ Azkar Bot is running...");

// // =========================
// // 📦 IMPORTS
// // =========================
// const TelegramBot = require("node-telegram-bot-api");
// const moment = require("moment-timezone");
// const schedule = require("node-schedule");
// const axios = require("axios");
// const { morningAzkar, eveningAzkar } = require("./azkar");

// // =========================
// // 🤖 BOT SETUP
// // =========================
// const token = "8361772688:AAFW6APA3DP1TYziMxgY3Dq3FxLNXxB9MME"; // replace with your token
// const bot = new TelegramBot(token, { polling: true });

// let users = [];

// // =========================
// // 🕋 HELPER FUNCTIONS
// // =========================

// // Detect user's timezone automatically using IP
// async function getUserTimezone() {
//   try {
//     const res = await axios.get("https://ipapi.co/json/");
//     return res.data.timezone || "Africa/Addis_Ababa";
//   } catch (err) {
//     return "Africa/Addis_Ababa";
//   }
// }

// // Send long messages safely (Telegram max = 4096 chars)
// function sendLongMessage(bot, chatId, message, options = {}) {
//   const MAX_LENGTH = 4000;
//   if (message.length <= MAX_LENGTH) {
//     return bot.sendMessage(chatId, message, options);
//   }

//   const parts = [];
//   for (let i = 0; i < message.length; i += MAX_LENGTH) {
//     parts.push(message.slice(i, i + MAX_LENGTH));
//   }

//   parts.forEach((part, index) => {
//     setTimeout(() => {
//       bot.sendMessage(chatId, part, options);
//     }, index * 1000);
//   });
// }

// // Format Azkar message based on language
// function formatAzkarMessage(azkarList, title, language) {
//   let message = `🌿 *${title}* 🌿\n\n`;

//   azkarList.forEach((azkar, i) => {
//     message += `✨ *${i + 1}.*\n`;

//     if (language === "Arabic") {
//       message += `🕋 *${azkar.arabic}*\n`;
//     } else if (language === "English") {
//       message += `🇬🇧 *${azkar.english}*\n`;
//       message += `📖 *Meaning:* _${azkar.meaning || ""}_\n`;
//     } else if (language === "Amharic") {
//       message += `🇪🇹 *${azkar.amharic}*\n`;
//     }

//     message += `🔁 *Repeat:* \`${azkar.repetitions}x\`\n`;
//     message += `📖 *Source:* _${azkar.source}_\n\n`;
//   });

//   return message;
// }

// // =========================
// // 💠 BOT COMMANDS
// // =========================

// // /start
// bot.onText(/\/start/, async (msg) => {
//   const chatId = msg.chat.id;
//   const userName = msg.from.first_name || "Akhi/Akhti";
//   const timezone = await getUserTimezone();

//   if (!users.find((u) => u.id === chatId)) {
//     users.push({ id: chatId, timezone, language: null });
//   }

//   const welcomeMsg = `
// 🕌 *As-salamu Alaikum ${userName}!*

// 🤖 Welcome to *Azkar Reminder Bot* 🌿
// This bot will send you:
// ☀️ Morning Azkar (7:00 AM)
// 🌙 Evening Azkar (7:00 PM)
// 📍 Timezone detected: *${timezone}*

// Please select your preferred *language*:
//   `;

//   const opts = {
//     reply_markup: {
//       inline_keyboard: [
//         [
//           { text: "🕋 Arabic", callback_data: "lang_arabic" },
//           { text: "🇬🇧 English", callback_data: "lang_english" },
//           { text: "🇪🇹 Amharic", callback_data: "lang_amharic" },
//         ],
//       ],
//     },
//     parse_mode: "Markdown",
//   };

//   bot.sendMessage(chatId, welcomeMsg, opts);
// });

// // Language selection
// bot.on("callback_query", (callbackQuery) => {
//   const chatId = callbackQuery.message.chat.id;
//   const data = callbackQuery.data;
//   const user = users.find((u) => u.id === chatId);

//   if (!user) return;

//   if (data === "lang_arabic") user.language = "Arabic";
//   else if (data === "lang_english") user.language = "English";
//   else if (data === "lang_amharic") user.language = "Amharic";

//   bot.sendMessage(
//     chatId,
//     `✅ Language set to *${user.language}*. You’ll now receive Azkar in that language.`,
//     { parse_mode: "Markdown" }
//   );
// });

// // /stop
// bot.onText(/\/stop/, (msg) => {
//   const chatId = msg.chat.id;
//   users = users.filter((u) => u.id !== chatId);
//   bot.sendMessage(chatId, "🛑 You have unsubscribed from Azkar reminders.");
// });

// // /menu
// bot.onText(/\/menu/, (msg) => {
//   const chatId = msg.chat.id;
//   bot.sendMessage(chatId, "📋 *Main Menu*", {
//     parse_mode: "Markdown",
//     reply_markup: {
//       keyboard: [
//         ["/start", "/stop"],
//         ["/test", "/help"],
//       ],
//       resize_keyboard: true,
//     },
//   });
// });

// // /help
// bot.onText(/\/help/, (msg) => {
//   const helpMessage = `
// 📖 *Bot Commands:*
// /start - Start and choose your language
// /stop - Stop receiving reminders
// /menu - Show menu buttons
// /test - Send Azkar immediately for testing
// /help - Show this help message
//   `;
//   bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: "Markdown" });
// });

// // /test
// bot.onText(/\/test/, (msg) => {
//   const chatId = msg.chat.id;
//   const user = users.find((u) => u.id === chatId);

//   if (!user || !user.language) {
//     return bot.sendMessage(
//       chatId,
//       "⚙️ Please set your language first using /start.",
//       { parse_mode: "Markdown" }
//     );
//   }

//   const now = moment().tz(user.timezone || "Africa/Addis_Ababa");
//   const hour = now.hour();

//   const title =
//     hour >= 5 && hour < 12
//       ? "☀️ Morning Azkar"
//       : "🌙 Evening Azkar";

//   const list =
//     hour >= 5 && hour < 12 ? morningAzkar : eveningAzkar;

//   const message = formatAzkarMessage(list, title, user.language);
//   sendLongMessage(bot, chatId, message, { parse_mode: "Markdown" });
// });

// // =========================
// // ⏰ SCHEDULER (5-min Reminder)
// // =========================
// schedule.scheduleJob("* * * * *", () => {
//   const nowUTC = moment.utc();

//   users.forEach(async (user) => {
//     const userTime = nowUTC.clone().tz(user.timezone);
//     const hour = userTime.hour();
//     const minute = userTime.minute();

//     // Morning 6:55 - reminder
//     if (hour === 6 && minute === 55) {
//       bot.sendMessage(
//         user.id,
//         "⏰ Morning Azkar will start in 5 minutes. Get ready! 🌅"
//       );
//     }

//     // Morning 7:00 - send Azkar
//     if (hour === 7 && minute === 0) {
//       await bot.sendMessage(user.id, "☀️ *Morning Azkar starting now...*", {
//         parse_mode: "Markdown",
//       });
//       const msg = formatAzkarMessage(
//         morningAzkar,
//         "☀️ أذكار الصباح (Morning Azkar)",
//         user.language
//       );
//       sendLongMessage(bot, user.id, msg, { parse_mode: "Markdown" });
//     }

//     // Evening 6:55 PM - reminder
//     if (hour === 18 && minute === 55) {
//       bot.sendMessage(
//         user.id,
//         "🌙 Evening Azkar will start in 5 minutes. Prepare yourself 🤲"
//       );
//     }

//     // Evening 7:00 PM - send Azkar
//     if (hour === 19 && minute === 0) {
//       await bot.sendMessage(user.id, "🌙 *Evening Azkar starting now...*", {
//         parse_mode: "Markdown",
//       });
//       const msg = formatAzkarMessage(
//         eveningAzkar,
//         "🌙 أذكار المساء (Evening Azkar)",
//         user.language
//       );
//       sendLongMessage(bot, user.id, msg, { parse_mode: "Markdown" });
//     }
//   });
// });

// console.log("✅ Azkar Bot is running...");

// // =========================
// // 📦 IMPORTS
// // =========================
// const TelegramBot = require("node-telegram-bot-api");
// const moment = require("moment-timezone");
// const schedule = require("node-schedule");
// const axios = require("axios");
// const { morningAzkar, eveningAzkar } = require("./azkar");

// // =========================
// // 🤖 BOT SETUP
// // =========================
// const token = "8361772688:AAFW6APA3DP1TYziMxgY3Dq3FxLNXxB9MME"; // ← replace with your actual Telegram bot token
// const bot = new TelegramBot(token, { polling: true });

// let users = [];

// // =========================
// // 🕋 HELPER FUNCTIONS
// // =========================

// // Detect user's timezone automatically using IP
// async function getUserTimezone() {
//   try {
//     const res = await axios.get("https://ipapi.co/json/");
//     return res.data.timezone || "Africa/Addis_Ababa";
//   } catch (err) {
//     return "Africa/Addis_Ababa";
//   }
// }

// // Format Azkar message beautifully, only in the selected language
// function formatAzkarMessageByLanguage(azkarList, title, language) {
//   let message = `🌿 *${title}* 🌿\n\n`;
//   azkarList.forEach((azkar, i) => {
//     message += `✨ *${i + 1}.*\n`;
//     if (language === "Arabic") message += `🕋 _${azkar.arabic}_\n`;
//     else if (language === "English") message += `🇬🇧 _${azkar.english}_\n`;
//     else if (language === "Amharic") message += `🇪🇹 _${azkar.amharic}_\n`;
//     message += `🔁 *Repeat:* \`${azkar.repetitions}x\`\n`;
//     message += `📖 *Source:* _${azkar.source}_\n\n`;
//   });
//   return message;
// }

// // 🧩 Helper: Split long messages
// function sendLongMessage(chatId, text, options = {}) {
//   const MAX_LENGTH = 4000; // Telegram limit
//   const parts = text.match(new RegExp(`.{1,${MAX_LENGTH}}`, "gs"));

//   parts.forEach((part, index) => {
//     const label =
//       parts.length > 1 ? `📖 Part ${index + 1}/${parts.length}\n\n` : "";
//     setTimeout(() => {
//       bot.sendMessage(chatId, label + part, options);
//     }, index * 1500);
//   });
// }

// // =========================
// // 💠 BOT COMMANDS
// // =========================

// // /start
// bot.onText(/\/start/, async (msg) => {
//   const chatId = msg.chat.id;
//   const userName = msg.from.first_name || "Akhi/Akhti";
//   const timezone = await getUserTimezone();

//   if (!users.find((u) => u.id === chatId)) {
//     users.push({ id: chatId, timezone, language: "Arabic" }); // default Arabic
//   }

//   const welcomeMsg = `
// 🕌 *As-salamu Alaikum ${userName}!*  

// 🤖 Welcome to *Azkar Reminder Bot* 🌿  
// This bot will send you:  
// ☀️ Morning Azkar (7:00 AM)  
// 🌙 Evening Azkar (7:00 PM)  
// 📍Timezone detected: *${timezone}*  

// Please select your preferred *language*:
//   `;

//   const opts = {
//     reply_markup: {
//       inline_keyboard: [
//         [
//           { text: "🕋 Arabic", callback_data: "lang_arabic" },
//           { text: "🇬🇧 English", callback_data: "lang_english" },
//           { text: "🇪🇹 Amharic", callback_data: "lang_amharic" },
//         ],
//       ],
//     },
//     parse_mode: "Markdown",
//   };

//   bot.sendMessage(chatId, welcomeMsg, opts);
// });

// // Language selection
// bot.on("callback_query", (callbackQuery) => {
//   const chatId = callbackQuery.message.chat.id;
//   const data = callbackQuery.data;
//   const user = users.find((u) => u.id === chatId);

//   if (!user) return;

//   if (data === "lang_arabic") user.language = "Arabic";
//   else if (data === "lang_english") user.language = "English";
//   else if (data === "lang_amharic") user.language = "Amharic";

//   bot.sendMessage(
//     chatId,
//     `✅ Language set to *${user.language}*. You’ll now receive Azkar in that language.`,
//     { parse_mode: "Markdown" }
//   );
// });

// // /stop
// bot.onText(/\/stop/, (msg) => {
//   const chatId = msg.chat.id;
//   users = users.filter((u) => u.id !== chatId);
//   bot.sendMessage(chatId, "🛑 You have unsubscribed from Azkar reminders.");
// });

// // /menu
// bot.onText(/\/menu/, (msg) => {
//   const chatId = msg.chat.id;
//   bot.sendMessage(chatId, "📋 *Main Menu*", {
//     parse_mode: "Markdown",
//     reply_markup: {
//       keyboard: [
//         ["/start", "/stop"],
//         ["/test", "/help"],
//       ],
//       resize_keyboard: true,
//       one_time_keyboard: false,
//     },
//   });
// });

// // /help
// bot.onText(/\/help/, (msg) => {
//   const helpMessage = `
// 📖 *Bot Commands:*  
// /start - Start the bot and set preferences  
// /stop - Stop receiving reminders  
// /menu - Show the main menu  
// /test - Send Azkar immediately for testing  
// /help - Show this help message
//   `;
//   bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: "Markdown" });
// });

// // /test
// bot.onText(/\/test/, (msg) => {
//   const chatId = msg.chat.id;
//   const user = users.find((u) => u.id === chatId);
//   if (!user) return;

//   const now = moment().tz(user.timezone);
//   const hour = now.hour();

//   const message =
//     hour >= 5 && hour < 12
//       ? formatAzkarMessageByLanguage(
//           morningAzkar,
//           "☀️ Morning Azkar",
//           user.language
//         )
//       : formatAzkarMessageByLanguage(
//           eveningAzkar,
//           "🌙 Evening Azkar",
//           user.language
//         );

//   sendLongMessage(chatId, message, { parse_mode: "Markdown" });
// });

// // =========================
// // ⏰ SCHEDULER
// // =========================
// schedule.scheduleJob("* * * * *", () => {
//   const nowUTC = moment.utc();

//   users.forEach((user) => {
//     const userTime = nowUTC.clone().tz(user.timezone);
//     const hour = userTime.hour();
//     const minute = userTime.minute();

//     // Morning reminder 5 min before (6:55)
//     if (hour === 6 && minute === 55) {
//       bot.sendMessage(
//         user.id,
//         "⏰ Morning Azkar will start in 5 minutes. Get ready! 🌅"
//       );
//     }

//     // Morning Azkar (7:00)
//     if (hour === 7 && minute === 0) {
//       bot.sendMessage(user.id, "☀️ *Morning Azkar starting now...*", {
//         parse_mode: "Markdown",
//       });
//       const msg = formatAzkarMessageByLanguage(
//         morningAzkar,
//         "☀️ Morning Azkar",
//         user.language
//       );
//       sendLongMessage(user.id, msg, { parse_mode: "Markdown" });
//     }

//     // Evening reminder 5 min before (6:55 PM)
//     if (hour === 18 && minute === 55) {
//       bot.sendMessage(
//         user.id,
//         "🌙 Evening Azkar will start in 5 minutes. Prepare yourself 🤲"
//       );
//     }

//     // Evening Azkar (7:00 PM)
//     if (hour === 19 && minute === 0) {
//       bot.sendMessage(user.id, "🌙 *Evening Azkar starting now...*", {
//         parse_mode: "Markdown",
//       });
//       const msg = formatAzkarMessageByLanguage(
//         eveningAzkar,
//         "🌙 Evening Azkar",
//         user.language
//       );
//       sendLongMessage(user.id, msg, { parse_mode: "Markdown" });
//     }
//   });
// });

// console.log("✅ Azkar Bot is running...");
