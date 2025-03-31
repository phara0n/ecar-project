# Admin Web Interface Requirements

## Overview

The ECAR Garage Management System requires a dedicated Admin Web Interface separate from Django Admin. This document outlines the technical requirements and implementation details for this component.

## Technology Stack

- **Frontend Framework**: React with Vite
- **Language**: TypeScript
- **UI Components**: Ant Design (AntD) prebuilt admin templates
- **State Management**: Redux Toolkit (RTK Query for API calls)
- **Build Tools**: Vite, ESLint, Prettier

## Core Features

### Authentication & Authorization

- JWT-based authentication (same as mobile app)
- Role-based access control:
  - `super-admin`: Full access to all features and data
  - `technician`: Limited access to assigned services and customer data
- IP whitelisting for additional security
- Session management with token refresh

### Dashboard

- Real-time metrics and KPIs:
  - Revenue (daily, weekly, monthly)
  - Pending services
  - Completed services
  - Upcoming appointments
- Interactive charts using Ant Design Charts:
  - Service type distribution
  - Revenue trends
  - Customer satisfaction metrics
- Task management for administrators and technicians

### Customer Management

- CRUD operations for customer records
- Customer profile viewing and editing
- Customer history and service records
- Communication tools (email, SMS)
- Search and filter capabilities

### Vehicle Management

- Vehicle registration and details
- Service history per vehicle
- Document storage (registration papers, etc.)
- Maintenance schedules and reminders

### Service Management

- Service creation and scheduling
- Service status tracking
- Technician assignment
- Parts and labor tracking
- Service completion workflow

### Invoicing

- Generate invoices from services
- PDF preview within the interface
- Payment tracking and status updates
- Bulk operations for invoices
- Email invoice directly to customers

### Data Import/Export

- CSV/Excel import for bulk customer & vehicle data
- Data export functionality for reporting
- Backup and restore capabilities

## UI/UX Requirements

- Responsive design for desktop and tablet
- Dark/light theme support
- French language as primary interface
- Arabic language support (with RTL layout)
- Consistent branding with ECAR visual identity
- Optimized loading states and error handling
- Accessibility compliance

## Security Features

- CSRF protection for all forms
- XSS prevention
- Secure form validation
- Audit logging for critical actions
- Session timeout after inactivity
- Environment-specific settings

## Integration Points

- Backend API integration via RTK Query
- PDF generation (via backend API)
- Email notification system
- SMS notification capability

## Implementation Guidelines

### Project Structure

```
admin/
├── public/
├── src/
│   ├── api/            # RTK Query API definitions
│   ├── assets/         # Static assets
│   ├── components/     # Reusable components
│   ├── features/       # Feature-based modules
│   ├── layouts/        # Page layouts
│   ├── pages/          # Main page components
│   ├── store/          # Redux store configuration
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Entry point
├── .eslintrc.js
├── package.json
├── tsconfig.json
└── vite.config.js
```

### Code Standards

- Use functional components with hooks
- Implement lazy loading for better performance
- Use TypeScript interfaces for all props and state
- Follow the AntD design patterns and guidelines
- Implement proper error boundaries and fallbacks
- Use RTK Query for all API calls with caching

### Testing Strategy

- Unit tests for components using Jest and React Testing Library
- E2E tests with Cypress for critical workflows
- Visual regression testing for UI components

## Deployment

- Build optimized for production using Vite
- Containerize with Docker for consistent deployment
- Serve via NGINX in the same infrastructure as the backend
- Configure for the subdomain `admin.ecar.tn`

## Future Enhancements

- Advanced analytics and reporting
- Integration with accounting software
- Inventory management system
- Supplier management
- Customer loyalty program management
- Mobile-optimized views for technicians in the field 