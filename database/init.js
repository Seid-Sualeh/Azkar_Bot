const Database = require("better-sqlite3");
const path = require("path");

// Initialize database
const db = new Database(path.join(__dirname, "azkar_bot.db"));

// Create tables if they don't exist
function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER UNIQUE NOT NULL,
      timezone TEXT,
      language TEXT DEFAULT 'Arabic',
      tz_source TEXT DEFAULT 'auto',
      last_active TIMESTAMP,
      prayer_notifications BOOLEAN DEFAULT 1,
      fajr_notification BOOLEAN DEFAULT 1,
      dhuhr_notification BOOLEAN DEFAULT 1,
      asr_notification BOOLEAN DEFAULT 1,
      maghrib_notification BOOLEAN DEFAULT 1,
      isha_notification BOOLEAN DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Prayer times table
  db.exec(`
    CREATE TABLE IF NOT EXISTS prayer_times (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      date DATE NOT NULL,
      fajr TIME,
      dhuhr TIME,
      asr TIME,
      maghrib TIME,
      isha TIME,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chat_id) REFERENCES users(chat_id),
      UNIQUE(chat_id, date)
    )
  `);

  // Feedback table
  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chat_id) REFERENCES users(chat_id)
    )
  `);

  // Channel posts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS channel_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_chat_id ON users(chat_id);
    CREATE INDEX IF NOT EXISTS idx_prayer_times_chat_id_date ON prayer_times(chat_id, date);
    CREATE INDEX IF NOT EXISTS idx_feedback_chat_id ON feedback(chat_id);
  `);

  console.log("Database initialized successfully");
}

// Initialize the database immediately
initializeDatabase();

// User operations
const userOperations = {
  // Get user by chat_id
  getByChatId: db.prepare(`
    SELECT * FROM users WHERE chat_id = ?
  `),

  // Create new user
  create: db.prepare(`
    INSERT INTO users (chat_id, timezone, language, tz_source, last_active)
    VALUES (?, ?, ?, ?, ?)
  `),

  // Update user
  update: db.prepare(`
    UPDATE users SET 
      timezone = COALESCE(?, timezone),
      language = COALESCE(?, language),
      tz_source = COALESCE(?, tz_source),
      last_active = COALESCE(?, last_active),
      prayer_notifications = COALESCE(?, prayer_notifications),
      fajr_notification = COALESCE(?, fajr_notification),
      dhuhr_notification = COALESCE(?, dhuhr_notification),
      asr_notification = COALESCE(?, asr_notification),
      maghrib_notification = COALESCE(?, maghrib_notification),
      isha_notification = COALESCE(?, isha_notification)
    WHERE chat_id = ?
  `),

  // Get all users
  getAll: db.prepare(`
    SELECT * FROM users
  `),

  // Delete user
  delete: db.prepare(`
    DELETE FROM users WHERE chat_id = ?
  `),
};

// Prayer times operations
const prayerTimeOperations = {
  // Get prayer times for a user on a specific date
  getByChatIdAndDate: db.prepare(`
    SELECT * FROM prayer_times WHERE chat_id = ? AND date = ?
  `),

  // Create or update prayer times
  upsert: db.prepare(`
    INSERT INTO prayer_times (chat_id, date, fajr, dhuhr, asr, maghrib, isha)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(chat_id, date) DO UPDATE SET
      fajr = COALESCE(excluded.fajr, fajr),
      dhuhr = COALESCE(excluded.dhuhr, dhuhr),
      asr = COALESCE(excluded.asr, asr),
      maghrib = COALESCE(excluded.maghrib, maghrib),
      isha = COALESCE(excluded.isha, isha),
      updated_at = CURRENT_TIMESTAMP
  `),

  // Get prayer times for today
  getToday: db.prepare(`
    SELECT * FROM prayer_times WHERE chat_id = ? AND date = DATE('now')
  `),
};

// Feedback operations
const feedbackOperations = {
  // Create feedback
  create: db.prepare(`
    INSERT INTO feedback (chat_id, message) VALUES (?, ?)
  `),

  // Get feedback for a user
  getByChatId: db.prepare(`
    SELECT * FROM feedback WHERE chat_id = ? ORDER BY created_at DESC
  `),

  // Get recent feedback (for admin)
  getRecent: db.prepare(`
    SELECT f.*, u.chat_id as user_chat_id 
    FROM feedback f 
    JOIN users u ON f.chat_id = u.chat_id 
    ORDER BY f.created_at DESC 
    LIMIT ?
  `),
};

// Channel posts operations
const channelPostOperations = {
  // Create channel post
  create: db.prepare(`
    INSERT INTO channel_posts (chat_id, message) VALUES (?, ?)
  `),

  // Get recent channel posts
  getRecent: db.prepare(`
    SELECT * FROM channel_posts ORDER BY posted_at DESC LIMIT ?
  `),
};

module.exports = {
  db,
  initializeDatabase,
  userOperations,
  prayerTimeOperations,
  feedbackOperations,
  channelPostOperations,
};
