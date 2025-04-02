# ECAR Garage Management System

## Overview

The ECAR Garage Management System is a self-hosted solution for Tunisian automotive workshops. It provides a comprehensive system for managing garage operations, customers, vehicles, services, and invoicing.

## Latest Features

- ✅ **Mileage-Based Service Prediction** - Track vehicle usage patterns and predict when services will be needed
- ✅ **Service History Tracking** - Record completed services and use them to improve future predictions
- ✅ **Enhanced API Documentation** - Complete Swagger documentation for all endpoints

## System Components

- **Backend API**: Django + Django REST Framework (Python)
- **Database**: PostgreSQL with PgBouncer connection pooling
- **Caching**: Redis
- **Web Server**: Nginx (production)
- **Web Admin**: React + React Admin (96% complete)
- **Mobile App**: React Native (planned)

## Current Status

- ✅ Backend API with complete CRUD operations (92% complete)
- ✅ Web Admin interface with modern UI (96% complete)
- ✅ Django Admin interface (100% complete)
- ✅ Docker environment with PgBouncer connection pooling
- ✅ PostgreSQL database with proper connection pooling
- ✅ Redis for caching
- ✅ Nginx for serving the application
- ✅ Swagger API documentation
- ✅ PDF generation for invoices
- ✅ Email notification system
- ✅ Service prediction system

## Getting Started

### Docker Setup (Recommended)

1. Start all services:
   ```bash
   docker-compose up -d
   ```

2. Check service status:
   ```bash
   docker-compose ps
   ```

3. Access the interfaces:
   - Django Admin:
     - URL: http://localhost:8000/admin
     - Username: admin
     - Password: Phara0n$
   
   - Web Admin:
     - URL: http://localhost:5173
     - Username: admin
     - Password: Phara0n$
   
   - API Documentation:
     - URL: http://localhost:8000/api/docs/

### Local Development

1. Set up local environment:
   ```bash
   ./setup_local_env.sh
   ```

2. Run with PgBouncer:
   ```bash
   ./run_with_pgbouncer.sh
   ```

3. Start the web admin:
   ```bash
   cd web-admin && npm run dev
   ```

## Backend API

The backend API provides RESTful endpoints for all core ECAR features:

### Authentication
- JWT-based authentication with token refresh
- User registration and profile management
- Password change functionality
- Role-based access control

### Core Features
- Customer management
- Vehicle management
- Service scheduling and tracking
- Service items and parts
- Invoice generation with PDF support
- Notification system

### API Documentation
- **URL**: http://localhost:8000/api/docs/
- **Interactive Testing**: Yes (via Swagger UI)
- **Alternative Docs**: http://localhost:8000/api/redoc/

Full API documentation is available in `docs/api_documentation_guide.md`

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- `docs/setup_guide.md`: Complete setup guide
- `docs/for_mehd.md`: Current status summary
- `docs/connection_pooling_setup.md`: PgBouncer connection pooling setup
- `docs/api_documentation_guide.md`: API usage guide
- `docs/backend_status.md`: Backend implementation status
- `docs/backend_api_tasklist.md`: Remaining backend tasks
- `docs/checkpoint.md`: Project checkpoint status

## GitHub Repository Setup

To push this code to GitHub:

1. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Name: ecar_project
   - Description: ECAR Garage Management System
   - Set to private if needed

2. Push the code to GitHub:
   ```bash
   git push -u origin main
   ```

3. For future changes, follow the ECAR branching strategy:
   - `main`: Production-ready code (protected)
   - `dev`: Active development branch
   - Feature branches: `feature/<name>` (e.g., `feature/invoice-system`)

4. Use the Conventional Commits format for all commits:
   ```bash
   git commit -m "feat(auth): add JWT token refresh endpoint"
   git commit -m "fix(api): correct invoice calculation"
   git commit -m "docs(readme): update API documentation"
   ```

## Development Guidelines

### ⚠️ IMPORTANT: Backend Code Policy

**DO NOT MODIFY BACKEND CODE under any circumstances**

- All development should focus exclusively on the frontend (web-admin) components
- If backend functionality is missing or needs adjustment, document it and communicate it rather than changing it directly
- Frontend must adapt to existing backend API contracts and data structures
- Any data transformation or format handling should be implemented on the frontend side

See [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md) for detailed instructions.

This project follows the ECAR Coding Rules:

- Backend: Django + Django REST Framework
- Authentication: JWT-based
- Security: HTTPS, IP whitelisting for admin
- Mobile: React Native with TypeScript
- Admin: React + Vite with TypeScript

## Contact

For questions or support, contact: phara0ntn@gmail.com

## Recent Bug Fixes

- Fixed circular import issue in serializers (April 2, 2025)
- Improved Swagger documentation generation for complex viewsets
- Enhanced error handling for service completion and history tracking

See [docs/bug_fixes.md](docs/bug_fixes.md) for a complete list of resolved issues. 