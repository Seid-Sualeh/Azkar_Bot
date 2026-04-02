# Comprehensive Feature Plan for Azkar Bot

Based on user feedback, I'm expanding the original prayer times feature plan to include:

1. Prayer times notifications (salah/azan)
2. Proper database implementation (replacing file-based storage)
3. Comment/feedback system from subscribers
4. Telegram channel posting capability

## 1. Prayer Times Notification Feature

### Overview

Add prayer times (salah/azan) notifications to the Azkar Bot using the existing AlAdhan API integration.

### Implementation Steps

- Modify getHijriString function to also fetch and cache prayer times
- Add prayer time data structure to user objects
- Add prayer time notifications to the scheduler
- Add user preferences for prayer time notifications
- Add commands for prayer times (/prayer, /salah)
- Add prayer time reminders (X minutes before each prayer)
- Integration with existing features (/mytime, welcome message)

## 2. Database Implementation

### Current State

- Uses file-based storage with `./users.json`
- Data loss risk when updating bot
- No proper querying capabilities

### Recommended Solution: SQLite

- Lightweight, file-based but more robust than JSON
- Built-in Node.js support via `better-sqlite3` or `sqlite3`
- Supports proper relations, queries, and transactions
- Easy to migrate from current JSON structure

### Database Schema

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  chat_id INTEGER UNIQUE,
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
);

CREATE TABLE prayer_times (
  id INTEGER PRIMARY KEY,
  chat_id INTEGER,
  date DATE,
  fajr TIME,
  dhuhr TIME,
  asr TIME,
  maghrib TIME,
  isha TIME,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_id) REFERENCES users(chat_id),
  UNIQUE(chat_id, date)
);

CREATE TABLE feedback (
  id INTEGER PRIMARY KEY,
  chat_id INTEGER,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_id) REFERENCES users(chat_id)
);

CREATE TABLE channel_posts (
  id INTEGER PRIMARY KEY,
  chat_id INTEGER, -- Target channel/chat ID
  message TEXT,
  posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Implementation Approach

1. Install `better-sqlite3` package
2. Create database initialization script
3. Replace loadUsers()/saveUsers() with database operations
4. Add helper functions for user CRUD operations
5. Migrate existing JSON data to SQLite on first run

## 3. Comment/Feedback System

### Purpose

Allow subscribers to send feedback/comments to help improve the bot and suggest new features.

### Features

- Users can send feedback via `/feedback` command or inline button
- Feedback stored in database with user ID and timestamp
- Admin can view feedback (via separate admin interface or commands)
- Option to acknowledge feedback receipt

### Implementation

- Add `/feedback` command that prompts user for message
- Store feedback in database
- Add optional `/feedback` admin command to view recent feedback
- Add inline button in main menu for feedback

## 4. Telegram Channel Posting Capability

### Purpose


i want to post by bot not to telegram channel i told that i want to post message by bot to subscriber like telegram channels
### Features

- Designate specific chats/channels as broadcast targets
- Admin-only ability to send broadcast messages
- Support for text, photos, videos, and audio
- Scheduled posts for future announcements
- Post confirmation and logging

### Implementation

- Add `/broadcast` command (admin only)
- Add `/schedulepost` command for future posts
- Store channel IDs in database or environment variables
- Add permission checking for broadcast commands
- Add inline confirmation before sending broadcasts

### Example Use Cases

- Eid Mubarak announcements
- Important Islamic reminders
- Bot update notifications
- Community announcements

## Updated Implementation Plan

### Phase 1: Database Migration

1. Install `better-sqlite3`
2. Create database initialization
3. Migrate existing users.json data
4. Replace file storage functions with database operations
5. Test data persistence across bot restarts

### Phase 2: Prayer Times Implementation

1. Extend AlAdhan API integration to fetch prayer times
2. Add prayer times to user/session cache
3. Implement prayer time checking in scheduler
4. Add prayer time notifications
5. Add user preferences for prayer times
6. Add prayer time commands (/prayer, /salah)
7. Integrate with /mytime and welcome message

### Phase 3: Feedback System

1. Add feedback table to database
2. Implement `/feedback` command
3. Add feedback storage and retrieval
4. Add feedback button to main menu
5. Optional: admin feedback viewing

### Phase 4: Channel Broadcasting

1. Add channel posting capabilities
2. Implement `/broadcast` command (admin only)
3. Add permission system for broadcast commands
4. Add `/schedulepost` for future announcements
5. Test with actual Telegram channel

### Phase 5: Testing and Refinement

1. Test all new features thoroughly
2. Ensure backward compatibility
3. Optimize database queries
4. Add error handling and logging
5. Document new features for users

## Benefits to Muslim Ummah

1. **Prayer Times**: Never miss a prayer with accurate location-based timing
2. **Database**: Reliable data persistence - users won't lose subscriptions during updates
3. **Feedback System**: Community-driven improvement - users can suggest features
4. **Channel Broadcasting**: Timely announcements for Islamic events and important notices

## Files to Modify

- `index.js` - Main implementation of all features
- `package.json` - Add new dependencies
- Possibly `azkar.js` - If adding prayer-specific content
- New database initialization files

## Technical Considerations

- Use connection pooling or single connection for SQLite
- Handle database migrations gracefully
- Implement proper error handling for database operations
- Consider timezone storage and conversion for prayer times
- Add rate limiting for API calls to AlAdhan
- Secure admin commands for broadcasting
