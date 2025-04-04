# CoreUI v5 Customization Plan for ECAR

## Overview
This document outlines the specific steps and tasks needed to customize the CoreUI v5 template for the ECAR Garage Management System admin interface. It provides a detailed roadmap for transforming the base template into a fully functional admin interface tailored to ECAR's requirements.

## Phase 1: Initial Setup (1-2 days)

### 1.1 Dependencies Installation
```bash
npm install axios jwt-decode react-hook-form yup @hookform/resolvers date-fns
```

### 1.2 Project Structure Setup
- Create `/src/api` folder for API services
- Create `/src/features` folder for feature modules
- Create `/src/utils` folder for helper functions
- Create `/src/types` folder for TypeScript definitions

### 1.3 Environment Configuration
- Create `.env` file for environment variables
- Set up API URL and other configuration
- Configure proxy for local development

## Phase 2: Authentication Setup (2-3 days)

### 2.1 JWT Authentication Service
- Create `src/api/authService.ts` for authentication methods
- Implement login, logout, token refresh functions
- Set up secure token storage with proper expiration

### 2.2 Protected Routes
- Modify existing routes.js to add authentication guards
- Create redirect logic for unauthenticated users
- Set up role-based route protection

### 2.3 Login Page Customization
- Customize the login page with ECAR branding
- Connect login form to authentication service
- Add error handling and validation

## Phase 3: API Integration (2-3 days)

### 3.1 API Client Setup
- Create base API client with axios
- Set up request/response interceptors
- Configure automatic token refresh
- Implement error handling

### 3.2 Resource Services
- Create service files for each resource:
  - `src/api/customerService.ts`
  - `src/api/vehicleService.ts`
  - `src/api/serviceService.ts`
  - `src/api/invoiceService.ts`
- Implement CRUD operations for each resource

### 3.3 Data Models
- Define TypeScript interfaces for all data models
- Create validation schemas using Yup
- Set up data transformation utilities

## Phase 4: Feature Development (7-10 days)

### 4.1 Customer Management
- Create list view with search and filtering
- Implement create/edit forms with validation
- Add detail view with related vehicles
- Implement delete functionality with confirmation

### 4.2 Vehicle Management
- Create list view with filtering by customer
- Implement vehicle registration form
- Add service history view
- Create vehicle details page

### 4.3 Service Management
- Implement service scheduling interface
- Create service history view
- Add service details page with related invoice
- Implement service status tracking

### 4.4 Invoice Management
- Create invoice generation interface
- Implement invoice listing with filtering
- Add invoice detail view with print option
- Create payment tracking functionality

## Phase 5: Dashboard Development (3-4 days)

### 5.1 KPI Cards
- Create revenue overview card
- Implement pending services counter
- Add new customers this month metric
- Create service completion rate indicator

### 5.2 Charts and Graphs
- Implement revenue trend chart
- Create service category distribution chart
- Add customer acquisition chart
- Implement vehicle type breakdown chart

### 5.3 Activity Feed
- Create recent services activity feed
- Implement upcoming services reminder
- Add recent invoice payments list
- Create notifications panel

## Phase 6: UI Customization (2-3 days)

### 6.1 Branding
- Apply ECAR color scheme
- Add logo to header and sidebar
- Create custom favicon and app icons
- Implement branded login screen

### 6.2 Navigation Customization
- Modify _nav.js to include ECAR-specific items
- Organize navigation by business function
- Add icons for all navigation items
- Implement role-based menu visibility

### 6.3 Layout Adjustments
- Customize header with user information
- Modify footer with ECAR information
- Adjust layout for optimal workflow
- Ensure responsive design for all screen sizes

## Phase 7: Testing & Polishing (3-4 days)

### 7.1 Functional Testing
- Test all CRUD operations
- Verify authentication workflow
- Test dashboard data accuracy
- Validate form validations

### 7.2 UI/UX Testing
- Test responsive layout on different devices
- Verify accessibility compliance
- Test navigation flow and user journey
- Validate error states and messaging

### 7.3 Performance Optimization
- Implement lazy loading for heavy components
- Optimize API calls with caching
- Reduce bundle size where possible
- Add loading states for better UX

## Timeline Summary
- **Phase 1-2 (Initial Setup & Authentication)**: 3-5 days
- **Phase 3 (API Integration)**: 2-3 days
- **Phase 4 (Feature Development)**: 7-10 days
- **Phase 5 (Dashboard Development)**: 3-4 days
- **Phase 6 (UI Customization)**: 2-3 days
- **Phase 7 (Testing & Polishing)**: 3-4 days

**Total Estimated Time**: 20-29 days

## Core Files to Modify

### Layout Files
- `src/layout/DefaultLayout.js` - Main layout container
- `src/components/AppSidebar.js` - Sidebar navigation
- `src/components/AppHeader.js` - Header with user controls
- `src/_nav.js` - Navigation configuration

### Core Pages
- `src/views/pages/login/Login.js` - Authentication screen
- `src/views/dashboard/Dashboard.js` - Main dashboard
- New feature files to be created in `src/features/`

## Dependencies to Add
- `axios` - API communication
- `jwt-decode` - JWT token handling
- `react-hook-form` - Form handling
- `yup` - Form validation
- `@hookform/resolvers` - Integration between yup and react-hook-form
- `date-fns` - Date manipulation

## Conclusion
This customization plan provides a comprehensive roadmap for transforming the CoreUI v5 template into a tailored admin interface for the ECAR Garage Management System. Following this plan will ensure all ECAR requirements are met while maintaining the professional design and functionality of the CoreUI framework. 