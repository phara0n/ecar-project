# ECAR Admin Dashboard

This is the admin dashboard for the ECAR Garage Management System, built with React, TypeScript, Material UI, and Toolpad Core.

## Technologies

- **React** - A JavaScript library for building user interfaces
- **TypeScript** - Typed JavaScript at scale
- **Vite** - Next generation frontend tooling
- **Material UI** - React components for faster and easier web development
- **Toolpad Core** - A set of full-stack React components for building dashboards
- **React Admin** - A frontend framework for building admin applications
- **Redux Toolkit** - The official, opinionated, batteries-included toolset for efficient Redux development
- **React Router** - Declarative routing for React
- **Axios** - Promise based HTTP client
- **React Hook Form** - Performant, flexible and extensible forms
- **Recharts** - A composable charting library for React

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm (v8+)

### Installation

1. Clone the repository
2. Navigate to the web-admin directory:
   ```bash
   cd ecar_project/web-admin
   ```
3. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
   Note: The `--legacy-peer-deps` flag is required due to React version compatibility with Toolpad Core.

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:5173.

### Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
web-admin/
├── public/              # Static assets
├── src/
│   ├── assets/         # Images, icons, etc.
│   ├── components/     # Reusable UI components
│   │   ├── common/    # Shared components
│   │   ├── dashboard/ # Dashboard components
│   │   └── forms/     # Form components
│   ├── contexts/       # React contexts (auth, theme)
│   ├── hooks/          # Custom React hooks
│   ├── layouts/        # Layout components
│   │   └── MainLayout.tsx  # Main application layout
│   ├── pages/          # Page components
│   │   ├── Dashboard.tsx   # Dashboard page
│   │   ├── Login.tsx       # Login page
│   │   └── NotFound.tsx    # 404 page
│   ├── services/       # API services
│   ├── store/          # Redux store
│   │   └── index.ts    # Store configuration
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main App component
│   └── main.tsx        # Entry point
├── package.json        # Dependencies
└── vite.config.ts      # Vite configuration
```

## Features

- **Authentication** - JWT-based authentication with role-based access control
- **Dashboard** - Interactive dashboard with key metrics and visualizations
- **Resource Management** - CRUD operations for customers, vehicles, services, and invoices
- **Responsive Design** - Mobile-friendly interface with Material UI components
- **Theming** - Light and dark mode support with customizable themes
- **Advanced Components** - Toolpad Core integration for advanced dashboard components

## Available Scripts

- `npm run dev` - Starts the development server
- `npm run build` - Builds the app for production to the `dist` folder
- `npm run preview` - Locally preview production build
- `npm run lint` - Lints the codebase
- `npm run type-check` - Checks TypeScript types
- `npm run format` - Formats code with Prettier

## Known Issues

- Toolpad Core requires React 18, but Vite sets up React 19 by default. Currently using `--legacy-peer-deps` as a workaround.

## License

This project is licensed under the proprietary ECAR license.

## Acknowledgments

- Material UI for the component library
- React Admin for the admin framework
- Toolpad Core for advanced dashboard components
