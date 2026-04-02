# Prayer Times Notification Feature Plan

## Overview
Add prayer times (salah/azan) notifications to the Azkar Bot using the existing AlAdhan API integration that's already being used for Hijri date conversion.

## Current State
- The bot already makes calls to `https://api.aladhan.com/v1/gToH?date={date}` for Hijri date conversion
- The AlAdhan API also provides prayer times data when using the `/timings` endpoint
- No prayer time notifications are currently implemented

## Implementation Steps

### 1. Modify getHijriString function to also fetch and cache prayer times
- Extend the existing AlAdhan API call to fetch timings data
- Cache prayer times per user per day to avoid excessive API calls
- Store prayer times in user object or separate cache

### 2. Add prayer time data structure
```javascript
// Example structure to store per user
user.prayerTimes = {
  date: "YYYY-MM-DD",
  timings: {
    Fajr: "05:00",
    Dhuhr: "12:00",
    Asr: "15:30",
    Maghrib: "18:00",
    Isha: "19:30"
  }
}
```

### 3. Add prayer time notifications to the scheduler
- Check prayer times alongside existing morning/evening azkar checks
- Send notifications at each prayer time (Fajr, Dhuhr, Asr, Maghrib, Isha)
- Include azkar/specific duas for each prayer time if desired

### 4. Add user preferences for prayer time notifications
- Allow users to enable/disable prayer time notifications
- Allow users to select which prayer times they want to be notified for
- Store preferences in user object

### 5. Add commands for prayer times
- `/prayer` or `/salah` - Show today's prayer times
- `/prayertimes` - Same as above
- Allow users to toggle prayer time notifications via inline keyboard

### 6. Add prayer time reminders (optional)
- Send reminders X minutes before each prayer time
- Similar to existing 5-minute reminders for morning/evening azkar

### 7. Integration with existing features
- Include prayer times in `/mytime` command output
- Show next prayer time in user interface
- Include prayer time information in welcome message

## Technical Details

### API Endpoint
Use: `https://api.aladhan.com/v1/timings/{latitude},{longitude}?method=2&school=0`
Or for date-specific: `https://api.aladhan.com/v1/timings/{date}?latitude={lat}&longitude={lon}&method=2`

### Implementation Approach
1. Modify `getUserTimezone` or create new function to get prayer times
2. Cache results to minimize API calls (prayer times don't change daily for same location)
3. Update scheduler to check prayer times
4. Add notification sending functions

### Files to Modify
- `index.js` - Main implementation
- Possibly `azkar.js` - If adding prayer-specific azkar/duas

## Benefits to Muslim Ummah
- Helps Muslims pray on time regardless of location
- Provides accurate prayer times based on user's location
- Integrates seamlessly with existing azkar reminder system
- Uses trusted AlAdhan API for accurate calculations

## Estimated Complexity
Low-Medium - Leverages existing API integration and scheduler infrastructure