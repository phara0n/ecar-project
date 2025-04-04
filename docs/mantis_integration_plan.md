# Mantis Template Integration Plan

## Overview

The Mantis template provides a well-structured, professionally designed dashboard built with Material UI. We'll adapt its architecture and design patterns to our ECAR admin dashboard while maintaining our Toolpad Core integration.

## Key Features to Adopt

1. **Directory Structure**:
   - Adopt the more granular organizational structure from Mantis
   - Add specialized directories like `sections` for larger feature components
   - Implement a clearer separation of concerns in layouts

2. **Theming System**:
   - Implement the comprehensive theming approach with separate files for palette, typography, and shadows
   - Use theme overrides for consistent component styling
   - Adopt the responsive breakpoints configuration

3. **Layout Architecture**:
   - Implement the hierarchical layout system with specialized layouts for different areas (Dashboard, Auth)
   - Use the drawer/header/footer component organization
   - Adopt the responsive drawer handling

4. **Navigation & Routing**:
   - Implement the route configuration system using React Router v7
   - Organize routes by feature/access level
   - Add breadcrumbs navigation

## Implementation Steps

### Phase 1: Restructure Project Files

1. **Update Directory Structure**:
   ```
   src/
   ├── assets/            # Static assets (already exists)
   ├── components/        # Reusable components (already exists)
   │   ├── common/        # Common components
   │   ├── dashboard/     # Dashboard components
   │   ├── forms/         # Form components
   │   ├── @extended/     # Extended components (e.g., Breadcrumbs)
   │   └── ScrollTop/     # Scroll to top utility
   ├── layout/            # Layout components
   │   ├── Auth/          # Authentication layout
   │   └── Dashboard/     # Main dashboard layout
   │       ├── Drawer/    # Sidebar drawer
   │       ├── Header/    # App header
   │       └── Footer.tsx # Footer component
   ├── themes/            # Theme customization
   │   ├── overrides/     # Component style overrides
   │   ├── palette.ts     # Color palette
   │   ├── typography.ts  # Typography settings
   │   └── shadows.ts     # Shadow definitions
   ├── sections/          # Larger feature sections
   ├── pages/             # Page components (already exists)
   ├── api/               # API services (replaces services/)
   ├── store/             # Redux store (already exists)
   ├── contexts/          # React contexts (already exists)
   ├── hooks/             # Custom hooks (already exists)
   ├── routes/            # Route definitions
   ├── utils/             # Utility functions (already exists)
   ├── types/             # TypeScript types (already exists)
   └── menu-items/        # Menu configuration
   ```

2. **Create Missing Directories**:
   - Set up new directories according to the plan above
   - Move existing files to their appropriate locations

### Phase 2: Implement Theming System

1. **Create Theme Files**:
   - Implement `palette.ts` with color definitions
   - Create `typography.ts` with font settings
   - Set up `shadows.ts` for elevation
   - Add component overrides in the `overrides` directory

2. **Update Theme Provider**:
   - Enhance the existing theme provider with the new theme structure
   - Add support for theme switching (light/dark)

### Phase 3: Enhance Layout Components

1. **Implement Dashboard Layout**:
   - Create a robust dashboard layout similar to Mantis
   - Implement responsive drawer toggling
   - Add header with user profile menu
   - Create footer with version info and links

2. **Develop Auth Layout**:
   - Create a dedicated layout for authentication pages
   - Style the login page according to the new design

### Phase 4: Update Routing

1. **Reorganize Routes**:
   - Implement main routes and authentication routes
   - Set up protected route handling
   - Add breadcrumbs support

2. **Create Menu Configuration**:
   - Set up menu items with icons and paths
   - Implement menu access control based on user roles

### Phase 5: Integrate Toolpad Core

1. **Create Toolpad Components**:
   - Implement Toolpad components following the Mantis design patterns
   - Ensure proper theme integration with Toolpad Core
   - Develop dashboard widgets with Toolpad capabilities

2. **Dashboard Enhancement**:
   - Create statistics cards using Toolpad and Mantis design
   - Implement charts and data visualizations
   - Add interactive elements

## Components to Implement

1. **Layout Components**:
   - Main dashboard layout
   - Authentication layout
   - Responsive drawer
   - Header with profile menu
   - Footer

2. **Extended Components**:
   - Breadcrumbs navigation
   - Card components with consistent styling
   - Dialog components
   - Enhanced form fields
   - Custom buttons

3. **Dashboard Components**:
   - Statistics cards
   - Data visualization charts
   - Activity timeline
   - Recent transactions

## Timeline

- **Week 1**: Restructure the project directories and implement the theming system
- **Week 2**: Enhance layout components and update routing
- **Week 3**: Integrate Toolpad Core components with the new design
- **Week 4**: Implement resource management screens and add final polish

## Benefits of Mantis Integration

1. **Professional Design**: Adopting the Mantis design patterns will provide a professional, cohesive look
2. **Better Organization**: The directory structure improves organization and maintainability
3. **Enhanced Theming**: The comprehensive theming system allows for consistent styling
4. **Responsive Layout**: Built-in responsive handling for different screen sizes
5. **Scalable Architecture**: The architecture scales well for larger applications

## Considerations

1. **React Version**: Mantis uses React 18.3.1, which is compatible with Toolpad Core
2. **MUI Version**: We'll need to handle any differences between Mantis's MUI version and our own
3. **TypeScript Integration**: We'll need to convert some JS files to TypeScript
4. **React Admin**: We'll need to ensure React Admin works well with the Mantis-style layout

---

*Document created: April 3, 2023* 