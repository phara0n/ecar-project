# Mobile App Requirements

## Overview

The ECAR Garage Management System includes a customer-facing mobile application built with React Native. This document outlines the technical requirements and implementation details for the mobile app component.

## Technology Stack

- **Framework**: React Native 
- **Language**: TypeScript
- **State Management**: Redux Toolkit (RTK Query for API calls)
- **Secure Storage**: React Native Encrypted Storage
- **Database**: SQLite for offline data
- **Notifications**: Firebase Cloud Messaging
- **Internationalization**: i18next
- **RTL Support**: React Native RTL Layout
- **PDF Viewer**: React Native PDF

## Core Features

### Authentication & Security

- JWT-based authentication with the backend API
- Secure token storage using `react-native-encrypted-storage`
- Biometric authentication (optional)
- Session management with token refresh
- Automatic logout after inactivity

### User Profile Management

- View and edit personal information
- Change password functionality
- Contact information management
- Notification preferences

### Vehicle Management

- View all registered vehicles
- Vehicle details (make, model, year, license plate)
- Add new vehicles (subject to admin approval)
- Vehicle service history
- Vehicle documents storage

### Service Tracking

- Service history timeline
- Current service status with real-time updates
- Service details view:
  - Description
  - Status
  - Start and completion dates
  - Technician notes
  - Cost breakdown
- Service request submission

### Appointments

- Schedule new appointments
- View upcoming appointments
- Reschedule or cancel appointments
- Appointment reminders

### Invoice Management

- View all invoices (paid and unpaid)
- Invoice details with PDF download
- Payment history
- Mark invoice as paid (if payment made outside app)

### Notifications

- Push notifications for:
  - Service status updates
  - Appointment reminders
  - New invoices
  - Special offers
- In-app notification center
- Email notifications integration

### Offline Functionality

- Offline data access using SQLite
- Background synchronization when online
- Conflict resolution for offline changes
- Queue actions performed offline

## UI/UX Requirements

- Native-feeling UI components for both iOS and Android
- Dark/light theme support
- Support for both portrait and landscape modes on tablets
- Clean, intuitive navigation
- Consistent loading states and error handling
- Multi-language support:
  - French (primary)
  - Arabic (with RTL layout support)
- Accessibility compliance

## Technical Implementation

### Project Structure

```
mobile/
├── android/
├── ios/
├── src/
│   ├── api/            # API service integrations
│   ├── assets/         # Static assets and images
│   ├── components/     # Reusable components
│   ├── features/       # Feature-based modules
│   ├── hooks/          # Custom React hooks
│   ├── i18n/           # Internationalization files
│   ├── navigation/     # Navigation configuration
│   ├── screens/        # Main screen components
│   ├── store/          # Redux store configuration
│   ├── theme/          # Theming and styling
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   └── App.tsx         # Main application component
├── .eslintrc.js
├── package.json
├── tsconfig.json
└── babel.config.js
```

### Offline Data Management

- SQLite schema matching relevant parts of backend models
- Timestamp-based synchronization logic
- Prioritized sync for essential data
- Background data refresh when connection is available

### Security Measures

- Encrypted local storage for sensitive data
- Certificate pinning for API communication
- Obfuscated application code
- Jailbreak/root detection
- Screenshot protection for sensitive screens

### Performance Optimization

- Lazy loading of assets and screens
- Image optimization
- Minimized re-renders using memoization
- Native module usage for intensive operations

## Testing Strategy

- Unit tests for business logic
- Component tests with React Native Testing Library
- E2E tests with Detox
- Device compatibility testing across multiple:
  - iOS versions (iOS 14+)
  - Android versions (Android 9+)
  - Screen sizes and densities

## Deployment

- App Store (iOS) and Google Play Store (Android) releases
- CI/CD pipeline for automated builds
- Alpha and beta testing channels
- Staged rollouts for production updates

## Future Enhancements

- In-app payments
- Vehicle maintenance reminders
- Service package subscriptions
- Loyalty program integration
- Chat with service center
- Vehicle location tracking (pickup/delivery)
- AR features for vehicle issues reporting 