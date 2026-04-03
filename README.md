# 🌿 Azkar Bot - Islamic Reminder Bot for the Ummah

[![Node.js](https://img.shields.io/badge/Node.js-14+-green.svg)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-blue.svg)](https://www.sqlite.org/)
[![Telegram](https://img.shields.io/badge/Telegram-Bot_API-blue.svg)](https://core.telegram.org/bots/api)

A comprehensive Islamic reminder bot that helps Muslims maintain their daily spiritual practices through automated Azkar (remembrance of Allah) notifications, accurate prayer times, and community engagement features.

## ✨ Features

### 🕌 **Prayer Times & Notifications**
- **Accurate Prayer Times**: Real-time prayer times using AlAdhan API with location-based calculations
- **Prayer Notifications**: Automated notifications at Fajr, Dhuhr, Asr, Maghrib, and Isha times
- **Customizable Alerts**: Enable/disable notifications for individual prayers
- **Multi-language Support**: Prayer announcements in Arabic, English, and Amharic

### 📿 **Daily Azkar Reminders**
- **Morning Azkar**: 7:00 AM reminders with authentic Islamic supplications
- **Evening Azkar**: 5:00 PM reminders with evening remembrance
- **Audio Support**: High-quality audio recitations for both morning and evening Azkar
- **Friday Special**: Automatic Surah Al-Kahf reminders and audio on Fridays

### 💬 **Community & Feedback**
- **User Feedback System**: Submit suggestions and comments to improve the bot
- **Admin Broadcasting**: Send announcements to all subscribers
- **Multi-language Interface**: Full support for Arabic, English, and Amharic

### ⚙️ **User Management**
- **Timezone Detection**: Automatic timezone detection with manual override
- **Location Services**: Share location for accurate prayer times
- **Persistent Settings**: All preferences saved securely in database
- **Interactive Menus**: User-friendly inline keyboard interface

### 📊 **Analytics & Stats**
- **Usage Statistics**: Monthly and 30-day active user counts
- **Ramadan Countdown**: Days until Ramadan with special notifications
- **User Activity Tracking**: Last active timestamps and engagement metrics

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Azkar_Bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   Create a `.env` file:
   ```env
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   BASE_URL=https://your-domain.com
   PORT=10000
   ADMIN_CHAT_IDS=123456789,987654321  # Comma-separated admin chat IDs
   ```

4. **Start the bot**
   ```bash
   npm start
   ```

The database will be automatically initialized on first run.

## 📱 Usage

### Getting Started
1. Start a chat with the bot
2. Send `/start` to initialize
3. Choose your language (Arabic, English, or Amharic)
4. Share your location for accurate prayer times
5. Subscribe to daily reminders

### Available Commands

| Command | Description |
|---------|-------------|
| `/start` | Initialize or restart the bot |
| `/menu` | Show interactive menu |
| `/help` | Display help and available commands |
| `/mytime` | Check your current settings and prayer times |
| `/prayer` | Show today's prayer times |
| `/prayersettings` | Configure prayer notification preferences |
| `/feedback` | Send feedback or suggestions |
| `/test` | Receive a sample Azkar message |
| `/ramadan` | Check days until Ramadan |
| `/stats` | View usage statistics |
| `/stop` | Unsubscribe from reminders |
| `/broadcast` | **Admin only**: Send announcements to all users |
| `/addadmin <chat_id>` | **Admin only**: Add a new admin |
| `/removeadmin <chat_id>` | **Admin only**: Remove an admin |
| `/listadmins` | **Admin only**: List all current admins |

### Interactive Menu
Use `/menu` to access all features through an intuitive inline keyboard interface.

### Prayer Settings
- Access via `/prayersettings` or the menu
- Enable/disable notifications for each prayer time
- Toggle all prayers on/off with one click
- Settings are saved automatically

## 🗄️ Database Schema

The bot uses SQLite for reliable data persistence:

### Tables
- **`users`**: User profiles, preferences, and timezone settings
- **`prayer_times`**: Cached prayer times per user per day
- **`feedback`**: User suggestions and comments
- **`channel_posts`**: Broadcast message history

### Data Persistence
- User data survives bot restarts and updates
- Prayer times cached to minimize API calls
- All user preferences automatically saved

## 🌍 Supported Languages

- **العربية** (Arabic) - Complete support
- **English** - Full feature support
- **አማርኛ** (Amharic) - Complete localization

## 🔧 Development

### Project Structure
```
Azkar_Bot/
├── index.js              # Main bot application
├── azkar.js              # Azkar content and translations
├── database/
│   ├── init.js          # Database initialization and operations
│   └── azkar_bot.db     # SQLite database (auto-generated)
├── audio/               # Audio files for Azkar recitations
├── plans/               # Feature planning documents
├── package.json         # Dependencies and scripts
└── .env                 # Environment configuration
```

### Environment Variables
```env
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
BASE_URL=https://your-webhook-domain.com
PORT=10000
ADMIN_CHAT_IDS=admin_chat_id_1,admin_chat_id_2
```

### API Dependencies
- **AlAdhan API**: For accurate prayer times
- **IP-API**: For fallback timezone detection
- **Telegram Bot API**: For bot functionality

## 📋 Deployment

### Local Development
```bash
# Use polling instead of webhook
# Comment out webhook setup in index.js
# Uncomment: bot.startPolling();
npm start
```

### Production Deployment
1. Set up HTTPS webhook URL
2. Configure environment variables
3. Start the application
4. The bot will automatically register webhooks

### Docker Support
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 10000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Submit a pull request with a clear description

### Guidelines
- Follow existing code style and structure
- Add appropriate error handling
- Test with multiple languages
- Update documentation for new features
- Respect Islamic content and cultural sensitivity

## 📄 License

This project is dedicated to serving the Muslim Ummah and is provided as-is for educational and religious purposes.

## 🙏 Acknowledgments

- **AlAdhan API** for accurate Islamic prayer times
- **Islamic Scholars** for authentic Azkar content
- **Open Source Community** for development tools
- **Muslim Developers** contributing to Islamic technology

## 📞 Support

For support, feedback, or feature requests:
- Use the in-bot `/feedback` command
- Create an issue in the repository
- Contact the maintainers

---

**May Allah accept our efforts and make this beneficial for the Ummah. 🤲**</content>
