# ECAR Garage Management System - Admin Web Interface

This is the administration interface for the ECAR Garage Management System. It provides a comprehensive dashboard and management tools for garage administrators and staff.

## Features

- **Dashboard:** Real-time metrics and analytics about services, revenue, and customers
- **Customer Management:** Add, edit, and manage customer information
- **Vehicle Management:** Track vehicles associated with customers
- **Service Management:** Schedule and manage vehicle services
- **Invoice Management:** Generate and track invoices
- **Multi-language Support:** Available in English, French, and Arabic

## Technology Stack

- React 18+ with TypeScript
- React Admin for UI components and data handling
- Material-UI for component styling
- Redux Toolkit + RTK Query for state management
- JWT authentication for secure access
- i18next for internationalization

## Getting Started

### Prerequisites

- Node.js 18+ and npm 7+
- Backend API running (default: http://localhost:8000/api)

### Installation

1. Navigate to the web-admin directory:
```bash
cd /home/ecar/ecar_project/web-admin
```

2. Install the dependencies:
```bash
npm install
```

3. Create a `.env` file with the following content (customize as needed):
```
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=ECAR Garage Admin
```

### Development

Run the development server:
```bash
npm run dev
```

The application will be available at http://localhost:5173

### Building for Production

Build the application for production:
```bash
npm run build
```

The output will be in the `dist` directory.

## Project Structure

```
src/
  ├── api/              # API integration (dataProvider, authProvider)
  ├── assets/           # Static assets
  ├── components/       # Shared components
  ├── features/         # Feature modules
  │   ├── customers/    # Customer management
  │   ├── vehicles/     # Vehicle management
  │   ├── services/     # Service management
  │   └── invoices/     # Invoice management
  ├── i18n/             # Internationalization
  ├── layouts/          # Layout components
  ├── pages/            # Top-level pages
  ├── store/            # Redux store
  │   ├── api/          # RTK Query APIs
  │   └── slices/       # Redux slices
  └── utils/            # Utility functions
```

## Security

The admin interface uses JWT authentication with token refresh. Access is controlled via role-based permissions.
