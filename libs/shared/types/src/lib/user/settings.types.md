# Settings Types

This directory contains TypeScript interfaces for the Code Heroes settings system. The settings are divided into two main categories: user settings and system settings.

## Overview

### User Settings (`UserSettings`)

Individual user preferences that control their experience within the platform:

- **Notifications**: Control various notification channels

  - Email notifications
  - Push notifications
  - Discord notifications (future integration)
  - Specific notification types (level ups, achievements)

- **Privacy**: User visibility preferences

  - Profile visibility
  - Activity feed visibility
  - Achievements visibility

- **Theme**: UI customization

  - Light/Dark/System mode
  - Accent color preferences

- **Dashboard**: Layout preferences
  - Default view selection
  - Widget layout customization

### System Settings (`SystemSettings`)

Platform-wide configurations managed by administrators:

- **Allowed Domains**: Control user registration through domain restrictions
- **Feature Flags**: Toggle platform features
- **Gamification Parameters**: Configure game mechanics
- **Integration Settings**: External service configurations

## Future Implementation Notes

This types file serves as a blueprint for:

- User settings management system
- Admin configuration dashboard
- Settings validation middleware
- User preferences API

The actual implementation should include:

- Settings persistence in Firestore
- Settings migration system
- Default values management
- Settings validation
- Access control for system settings

## Usage Example

```typescript
// Update user notification preferences
const updateSettings: UpdateUserSettingsDto = {
  notifications: {
    email: true,
    push: false,
    levelUp: true,
  },
};

// Update system features
const updateSystem: UpdateSystemSettingsDto = {
  features: {
    enableTeams: true,
    enableChallenges: false,
  },
};
```

## Related Components (Future)

- Settings Management Service
- User Preferences Dashboard
- Admin Configuration Panel
- Settings Migration System
