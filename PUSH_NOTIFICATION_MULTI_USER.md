# Push Notifications - Multi-User Device Handling

## Overview
The push notification system now fully supports multiple users using the same device or the same user logging in from different devices.

## Key Features

### 1. User-Scoped Device IDs
- Each user gets a unique device ID per device they log in from
- Device IDs are stored in a user-device mapping in localStorage
- Format: `device-{userId-prefix}-{timestamp}-{random}`

### 2. Automatic User Switching
- When a user logs in, the system:
  - Sets the current user in localStorage
  - Detects if a different user was previously logged in
  - Re-syncs push subscriptions for the new user
  - Maintains separate subscriptions for each user-device pair

### 3. User Logout Handling
- Clears current user state from localStorage
- Preserves subscription data for future logins
- Doesn't unsubscribe (subscription remains valid for re-login)

### 4. Device Management UI
Located in `/view/settings`:
- Shows all devices where the user has push notifications enabled
- Displays device ID and subscription date
- Highlights the current device
- Provides "Remove Others" button to clean up old devices
- Shows warning when multiple devices are detected

### 5. Database Schema
The `DevicePushSubscriptions` table tracks:
- `userId` - The user who owns the subscription
- `deviceId` - User-scoped device identifier
- `subscription` - Browser push subscription details
- `createdAt` / `updatedAt` - Timestamps

Unique constraint on (`userId`, `deviceId`) ensures one subscription per user-device pair.

## API Endpoints

### POST /api/v1/push/subscribe
- Creates or updates subscription for current user and device
- Uses user-scoped device ID from request body
- Updates existing subscription if found

### POST /api/v1/push/unsubscribe
- Removes subscription for current user and device
- Only affects the specific user-device pair

### POST /api/v1/push/cleanup
- Lists all devices for current user (when `keepCurrentOnly: false`)
- Removes all other devices (when `keepCurrentOnly: true`)
- Helps users manage multiple device subscriptions

## Client-Side Functions

### Core Functions
```typescript
// Get device ID for current user
getDeviceId(userId?: string): string

// Handle user login (call when user logs in)
onUserLogin(userId: string): Promise<void>

// Handle user logout (call when user logs out)
onUserLogout(): void

// Get all user's devices
getUserDevices(): Promise<{...}>

// Clean up old devices
cleanupOldDevices(): Promise<{...}>
```

### Automatic Integration
The root `+layout.svelte` automatically:
1. Detects user login/logout from page data
2. Calls `onUserLogin(userId)` when user logs in or switches
3. Calls `onUserLogout()` when user logs out
4. Re-syncs subscriptions on user switch

## User Scenarios

### Scenario 1: Multiple Users on Same Device
1. User A logs in on Device 1
   - Gets deviceId: `device-userA123-{timestamp}-{random}`
   - Subscribes to notifications
   
2. User A logs out, User B logs in on Device 1
   - Gets deviceId: `device-userB456-{timestamp}-{random}`
   - Subscribes to notifications (separate from User A)
   
3. Both users receive their own notifications
   - Database has 2 rows: (userA, deviceA) and (userB, deviceB)

### Scenario 2: Same User on Multiple Devices
1. User A logs in on Device 1 (desktop)
   - Gets deviceId: `device-userA123-{timestamp1}-{random1}`
   
2. User A logs in on Device 2 (mobile)
   - Gets deviceId: `device-userA123-{timestamp2}-{random2}`
   
3. User receives notifications on both devices
   - Database has 2 rows: (userA, device1) and (userA, device2)
   
4. User can view both devices in settings
   - Click "Remove Others" to keep only current device

### Scenario 3: User Re-login on Same Device
1. User A logs in on Device 1
   - Reuses existing deviceId: `device-userA123-{timestamp}-{random}`
   - Updates subscription in database (same row)
   
2. No duplicate subscriptions created
   - Database constraint ensures uniqueness

## Testing

### Test Case 1: User Switching
1. Log in as User A
2. Enable notifications in `/view/settings`
3. Log out
4. Log in as User B
5. Enable notifications
6. Both users should receive separate notifications

### Test Case 2: Multiple Devices
1. Log in as User A on Device 1
2. Enable notifications
3. Log in as User A on Device 2 (different browser/device)
4. Enable notifications
5. Send notification to User A
6. Both devices should receive notification
7. Go to settings on Device 2
8. Click "Remove Others"
9. Only Device 2 should receive future notifications

### Test Case 3: Re-login
1. Log in as User A
2. Enable notifications
3. Log out and log back in as User A
4. Notifications should still be enabled
5. No duplicate subscriptions in database

## Best Practices

### For Users
- Visit `/view/settings` to manage devices
- Use "Remove Others" if you notice notifications on old devices
- Re-enable notifications after clearing browser data

### For Admins
- Use `/view/push-notifications` to send notifications
- Notifications sent to a user reach all their active devices
- Check stats to monitor total subscriptions vs unique users

### For Developers
- Always call `onUserLogin(userId)` on login
- Always call `onUserLogout()` on logout
- Don't manually manage device IDs
- Let the system handle user-device mapping

## Technical Details

### LocalStorage Keys
- `push_device_id` - Legacy device ID (backwards compatibility)
- `push_current_user` - Currently logged in user ID
- `push_user_device_map` - JSON map of userId → deviceId
- `push_permission_asked` - Whether permission prompt was shown
- `push_subscription_date` - When user first subscribed

### Database Queries
```sql
-- Get all subscriptions for a user
SELECT * FROM DevicePushSubscriptions WHERE userId = ?

-- Get specific user-device subscription
SELECT * FROM DevicePushSubscriptions 
WHERE userId = ? AND deviceId = ?

-- Clean up old devices (keep current)
DELETE FROM DevicePushSubscriptions 
WHERE userId = ? AND deviceId != ?
```

## Migration Notes

Existing users with old device IDs will:
1. Continue working with their existing deviceId
2. Get migrated to user-scoped IDs on next login
3. Maintain their subscription without re-prompting

No database migration needed - system handles both formats.
