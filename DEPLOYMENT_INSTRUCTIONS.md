# 🌿 Azkar Bot - Complete Deployment Guide

## 📋 Overview

This guide provides step-by-step instructions for deploying the Azkar Bot, a comprehensive Islamic reminder bot with prayer times notifications, daily Azkar reminders, and community features.

## 🔧 Prerequisites

Before deploying, ensure you have:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Telegram Bot Token** from [@BotFather](https://t.me/botfather)
- **Git** for cloning the repository
- **Text Editor** (VS Code recommended)
- **Proper .gitignore**: Ensure `node_modules/` is in your `.gitignore` file to avoid cross-platform binary conflicts

### System Requirements

- **RAM**: Minimum 512MB, Recommended 1GB
- **Storage**: 500MB free space
- **Network**: Stable internet connection for API calls

---

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Environment

#### 1.1 Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow the prompts
3. Choose a name and username for your bot
4. **Save the bot token** - you'll need it later
5. Send `/setcommands` to set up command hints:
   ```
   start - Start the bot and get reminders
   menu - Show interactive menu
   help - Show available commands
   mytime - Check your settings
   prayer - Show prayer times
   prayersettings - Configure notifications
   feedback - Send suggestions
   stop - Unsubscribe
   ```

#### 1.2 Choose Deployment Method

- **Local Development**: Use polling (no public URL needed)
- **VPS/Server**: Use webhooks (requires HTTPS domain)
- **Cloud Platforms**: Heroku, Railway, Render, etc.

### Step 2: Download and Setup

#### 2.1 Clone the Repository

```bash
# Open terminal/command prompt
git clone <your-repository-url>
cd Azkar_Bot
```

#### 2.2 Install Dependencies

```bash
# Install all required packages
npm install

# Verify installation
npm list --depth=0
```

#### 2.3 Create Environment Configuration

Create a `.env` file in the root directory:

```bash
# Create the file
touch .env
# Or on Windows:
# type nul > .env
```

Edit `.env` with your configuration:

```env
# Required: Your Telegram bot token from BotFather
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Required for production (webhook mode)
BASE_URL=https://your-domain.com

# Optional: Port for the web server (default: 10000)
PORT=10000

# Optional: Admin chat IDs for broadcasting (comma-separated)
ADMIN_CHAT_IDS=123456789,987654321
```

**Security Note**: Never commit `.env` to version control!

### Step 3: Database Setup

#### 3.1 Automatic Initialization

The database initializes automatically on first run. No manual setup required.

#### 3.2 Database Location

- **File**: `database/azkar_bot.db`
- **Type**: SQLite (file-based, no server needed)
- **Tables Created**:
  - `users` - User profiles and preferences
  - `prayer_times` - Cached prayer times
  - `feedback` - User suggestions
  - `channel_posts` - Broadcast history

### Step 4: Configure Deployment Mode

#### Option A: Local Development (Polling)

For testing on your local machine:

1. **Edit index.js** (lines ~32-35):

   ```javascript
   // Comment out webhook setup:
   // bot.setWebHook(`${BASE_URL}/bot${TELEGRAM_BOT_TOKEN}`);

   // Uncomment polling:
   bot.startPolling();
   ```

2. **Remove BASE_URL** from `.env` (not needed for polling)

3. **Start the bot**:
   ```bash
   npm start
   ```

#### Option B: Production Server (Webhooks)

For live deployment with a public URL:

1. **Ensure HTTPS**: Your domain must use HTTPS
2. **Keep webhook setup** in index.js (default)
3. **Set BASE_URL** in `.env` to your HTTPS domain
4. **Deploy to server**

### Step 5: Start the Bot

#### 5.1 First Run

```bash
# Start the bot
npm start

# Expected output:
# Database initialized successfully
# 📊 Loaded X users from database
# Bot is running on port 10000
```

#### 5.2 Verify Bot is Working

1. Open Telegram
2. Search for your bot username
3. Send `/start`
4. Test basic commands: `/help`, `/menu`

### Step 6: Production Deployment Options

#### Option A: VPS/Dedicated Server

```bash
# 1. Upload files to server
scp -r Azkar_Bot/ user@your-server:/path/to/app/

# 2. Install Node.js on server
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PM2 for process management
sudo npm install -g pm2

# 4. Start with PM2
cd /path/to/app
pm2 start index.js --name "azkar-bot"
pm2 startup
pm2 save

# 5. Configure nginx (if using domain)
sudo apt install nginx
# Configure nginx to proxy to port 10000
```

#### Option B: Render (Recommended for Beginners)

Render is a modern cloud platform perfect for Telegram bots with automatic deployments and persistent disk storage.

##### Step-by-Step Render Deployment:

1. **Create Render Account**
   - Go to [render.com](https://render.com) and sign up
   - Connect your GitHub account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Choose the Azkar_Bot repository

3. **Configure Service Settings**

   ```
   Name: azkar-bot (or your preferred name)
   Environment: Node
   Build Command: rm -rf node_modules package-lock.json && npm install
   Start Command: npm start
   ```

4. **Set Environment Variables**
   In Render dashboard, add these environment variables:

   ```
   TELEGRAM_BOT_TOKEN = your_bot_token_from_botfather
   BASE_URL = https://your-service-name.onrender.com
   NODE_ENV = production
   ADMIN_CHAT_IDS = your_admin_chat_ids (optional)
   ```

5. **Configure Persistent Storage**
   - In Render dashboard, go to "Disks"
   - Create a new disk:
     ```
     Name: azkar-db
     Mount Path: /app/database
     Size: 1 GB (sufficient for SQLite database)
     ```

6. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy
   - Your bot will be available at: `https://your-service-name.onrender.com`

7. **Verify Deployment**
   - Check the deployment logs in Render dashboard
   - Test your bot on Telegram with `/start`
   - The database will be created automatically on first run

##### Render-Specific Notes:

- ✅ **Free Tier Available**: 750 hours/month free
- ✅ **Automatic HTTPS**: SSL certificate included
- ✅ **Persistent Storage**: Database survives deployments
- ✅ **Auto-Deploy**: Deploys on every Git push
- ✅ **Health Checks**: Built-in monitoring
- ⚠️ **Cold Starts**: Free tier may have startup delays
- ⚠️ **Timeout Limits**: Web services have 30-second timeout

##### Troubleshooting Render Deployment:

###### Common Issue: better-sqlite3 "invalid ELF header" Error

If you see this error: `Error: /opt/render/project/src/node_modules/better-sqlite3/build/Release/better_sqlite3.node: invalid ELF header`

**Cause**: Native binaries compiled on Windows don't work on Render's Linux environment.

**Solutions**:

1. **Ensure node_modules is ignored** (already fixed in .gitignore)
2. **Force clean install on Render**:
   - In Render dashboard, update Build Command to:
     ```
     rm -rf node_modules package-lock.json && npm install
     ```
3. **Add Python build tools** (if needed):
   - Add environment variable: `PYTHONUNBUFFERED=1`
4. **Alternative**: Use a different database solution like PostgreSQL

**Quick Fix for Existing Deployment**:
```bash
# On your local machine
rm -rf node_modules
npm install
git add .
git commit -m "Fix: Remove node_modules for cross-platform compatibility"
git push origin main
```

##### Updating Your Bot on Render:

```bash
# Make changes to your code
git add .
git commit -m "Update bot features"
git push origin main

# Render will automatically redeploy
```

#### Option C: Heroku

```bash
# 1. Install Heroku CLI
# 2. Login to Heroku
heroku login

# 3. Create app
heroku create your-azkar-bot

# 4. Set environment variables
heroku config:set TELEGRAM_BOT_TOKEN=your_token_here
heroku config:set BASE_URL=https://your-azkar-bot.herokuapp.com

# 5. Deploy
git push heroku main
```

#### Option D: Railway

```bash
# 1. Connect GitHub repository to Railway
# 2. Add environment variables in Railway dashboard
# 3. Deploy automatically
```

#### Option E: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 10000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t azkar-bot .
docker run -p 10000:10000 --env-file .env azkar-bot
```

---

## 🔍 Testing Your Deployment

### Basic Functionality Test

```bash
# 1. Start the bot
npm start

# 2. In another terminal, test the webhook endpoint
curl http://localhost:10000/health

# Expected response:
{
  "status": "healthy",
  "users": 0,
  "time": "2026-04-03T...",
  "timezone": "Africa/Addis_Ababa"
}
```

### Telegram Bot Test

1. Send `/start` to your bot
2. Send `/help` to see commands
3. Send `/test` to receive sample Azkar
4. Send `/prayer` to test prayer times
5. Send `/menu` to test interactive menu

### Prayer Times Test

1. Share location with the bot
2. Check `/mytime` for prayer times display
3. Test `/prayersettings` for notification preferences

---

## 🛠️ Troubleshooting

### Common Issues

#### Bot Not Responding

```bash
# Check if bot is running
ps aux | grep node

# Check logs
npm start 2>&1 | tee bot.log

# Test token validity
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getMe"
```

#### Database Errors

```bash
# Check database file permissions
ls -la database/

# Recreate database (WARNING: loses data)
rm database/azkar_bot.db
npm start  # Will recreate automatically
```

#### Webhook Issues

```bash
# Check webhook info
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo"

# Delete webhook (switch to polling)
curl "https://api.telegram.org/bot<YOUR_TOKEN>/deleteWebhook"

# Set webhook manually
curl "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://your-domain.com/bot<YOUR_TOKEN>"
```

#### Prayer Times Not Working

- Check AlAdhan API: `curl "https://api.aladhan.com/v1/timings/2026-04-03?latitude=9.145&longitude=38.7379"`
- Verify user timezone settings
- Check database for prayer_times table

### Performance Issues

```bash
# Monitor memory usage
node --expose-gc --max-old-space-size=512 index.js

# Check for memory leaks
npm install -g clinic
clinic heapprofiler -- npm start
```

---

## 📊 Monitoring & Maintenance

### Daily Checks

- Monitor bot uptime
- Check error logs
- Verify prayer time accuracy
- Test user interactions

### Weekly Tasks

```bash
# Backup database
cp database/azkar_bot.db database/backup_$(date +%Y%m%d).db

# Update dependencies
npm audit
npm update

# Check disk space
df -h
```

### Monthly Tasks

- Review user feedback
- Update prayer time calculations
- Optimize database queries
- Update bot commands in BotFather

---

## 🔒 Security Best Practices

### Environment Security

```bash
# Set proper file permissions
chmod 600 .env
chmod 644 database/azkar_bot.db

# Use strong, unique tokens
# Rotate tokens regularly
```

### Network Security

- Use HTTPS for webhooks
- Implement rate limiting
- Monitor API usage
- Regular security updates

### Data Protection

- Regular database backups
- Encrypt sensitive data
- GDPR compliance for user data
- Secure admin access

---

## 📞 Support & Resources

### Getting Help

1. Check the logs: `tail -f bot.log`
2. Test individual components
3. Review the README.md for features
4. Check GitHub issues

### Useful Commands

```bash
# View active users
sqlite3 database/azkar_bot.db "SELECT COUNT(*) FROM users;"

# Check recent feedback
sqlite3 database/azkar_bot.db "SELECT * FROM feedback ORDER BY created_at DESC LIMIT 5;"

# View prayer times cache
sqlite3 database/azkar_bot.db "SELECT COUNT(*) FROM prayer_times;"
```

### External Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [AlAdhan API Documentation](https://aladhan.com/prayer-times-api)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## ✅ Deployment Checklist

- [ ] Telegram bot created and token obtained
- [ ] Repository cloned and dependencies installed
- [ ] Environment variables configured
- [ ] Database initialized
- [ ] Deployment mode configured (polling/webhook)
- [ ] Bot started and responding
- [ ] Basic commands tested
- [ ] Prayer times working
- [ ] User registration tested
- [ ] Admin features configured (if applicable)
- [ ] Monitoring and logging set up
- [ ] Backup procedures established

**Congratulations! Your Azkar Bot is now deployed and ready to serve the Muslim Ummah! 🤲**</content>
<parameter name="filePath">c:\Users\pc\Desktop\Safaricom Talent\Azkar_Bot\DEPLOYMENT_INSTRUCTIONS.md
