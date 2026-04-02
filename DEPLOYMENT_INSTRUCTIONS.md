# Azkar Bot Deployment Instructions

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Telegram Bot Token (from @BotFather)
- Base URL for webhook (if deploying to a server)

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Azkar_Bot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
BASE_URL=https://your-domain.com  # Required for webhook setup
PORT=10000  # Optional, defaults to 10000
```

### 4. Initialize the Database

The database will be automatically initialized on first run. SQLite database file (`azkar_bot.db`) will be created in the `database/` directory.

### 5. Start the Bot

```bash
npm start
```

### 6. Set Up Webhook (for production)

If deploying to a server with a public URL, the bot will automatically set up the webhook using the BASE_URL environment variable.

For local development/testing, you can use polling instead of webhook by modifying index.js:

- Comment out: `bot.setWebHook(`${BASE_URL}/bot${TELEGRAM_BOT_TOKEN}`);`
- Uncomment: `bot.startPolling();`

## Database Information

- **Type**: SQLite (file-based)
- **Location**: `database/azkar_bot.db`
- **Tables**:
  - `users`: Stores user information and preferences
  - `prayer_times`: Caches prayer times for users
  - `feedback`: Stores user feedback and suggestions
  - `channel_posts`: Tracks bot announcements to channels

## Important Notes

1. The bot uses SQLite for reliable data persistence - user data will survive bot restarts and updates
2. First-time startup may take a moment as the database initializes and loads existing users
3. The `database/` directory should be backed up regularly to prevent data loss
4. Do not commit the `.env` file or `database/` directory to version control

## Troubleshooting

- If you encounter database errors, check that the `database/` directory is writable
- Ensure all dependencies are installed: `npm install`
- Check the console output for startup messages and errors
- Verify that your Telegram bot token is correct and has webhook permissions enabled

## Features Currently Implemented

- Morning/Evening Azkar reminders (7:00 AM and 5:00 PM)
- Ramadan countdown
- User management with timezone detection
- Multi-language support (Arabic, English, Amharic)
- Inline menu system
- Location-based timezone setting
- Database-backed user persistence

## Planned Features (Next Steps)

1. Prayer times notifications (salah/azan)
2. User feedback/comment system
3. Telegram channel posting capability
4. Enhanced user preferences for notification types

## Security Considerations

- Keep your TELEGRAM_BOT_TOKEN secure and never expose it in public repositories
- The BASE_URL should be HTTPS for production deployments
- Regularly backup the SQLite database file
- Consider implementing rate limiting for API calls to external services
