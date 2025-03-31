# ECAR Garage Management System

## Overview

The ECAR Garage Management System is a self-hosted solution for Tunisian automotive workshops. It provides a comprehensive system for managing garage operations, customers, vehicles, services, and invoicing.

## System Components

- **Backend API**: Django + Django REST Framework (Python)
- **Database**: PostgreSQL with PgBouncer connection pooling
- **Caching**: Redis
- **Web Server**: Nginx (production)
- **Mobile App**: React Native (planned)
- **Admin Interface**: React + Vite (planned)

## Current Status

- ✅ Docker environment with PgBouncer connection pooling
- ✅ Django backend with initial models and API endpoints
- ✅ PostgreSQL database with proper connection pooling
- ✅ Redis for caching
- ✅ Nginx for serving the application
- ✅ Utility scripts for local development

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

3. Access the Django admin:
   - URL: http://localhost:8000/admin
   - Username: admin
   - Password: admin123

### Local Development

1. Set up local environment:
   ```bash
   ./setup_local_env.sh
   ```

2. Run with PgBouncer:
   ```bash
   ./run_with_pgbouncer.sh
   ```

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- `docs/setup_guide.md`: Complete setup guide
- `docs/for_mehd.md`: Current status summary
- `docs/connection_pooling_setup.md`: PgBouncer connection pooling setup

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

This project follows the ECAR Coding Rules:

- Backend: Django + Django REST Framework
- Authentication: JWT-based
- Security: HTTPS, IP whitelisting for admin
- Mobile: React Native with TypeScript
- Admin: React + Vite with TypeScript

## Contact

For questions or support, contact: phara0ntn@gmail.com 