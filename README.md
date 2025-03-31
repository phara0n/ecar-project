# ECAR Garage Management System

## Overview
ECAR Garage Management System is a comprehensive solution for automotive workshops in Tunisia. It consists of:
- Backend API (Django + DRF)
- Admin Web Interface (React + Vite + Ant Design)
- Mobile App (React Native)

## Features

- Customer management with profile and vehicle information
- Service scheduling and tracking
- Appointment booking system
- Invoice generation with PDF export
- Email notifications for service updates
- SMS notifications for service completion and invoices
- Admin dashboard for garage management
- API with JWT authentication and rate limiting
- Redis caching for optimized performance
- Data encryption for sensitive information
- Automated database backup system

## Tech Stack

- **Backend**: Django/Django REST Framework
- **Database**: PostgreSQL (Production) / SQLite (Development)
- **Caching**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **Containerization**: Docker and Docker Compose
- **CI/CD**: GitHub Actions
- **PDF Generation**: ReportLab
- **Email**: Django SMTP integration

## Setup Instructions

### Prerequisites
- Docker and Docker Compose
- Python 3.12 (for local development)
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ecar_project
   ```

2. Copy the environment template and configure variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Start the services using Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. Run migrations:
   ```bash
   docker-compose exec backend python manage.py migrate
   ```

5. Create a superuser:
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

## Development Setup

### Local Environment (Recommended for Development)
For faster development and debugging, a local environment setup is recommended:

1. Check prerequisites:
   ```bash
   ./check_local_services.sh
   ```

2. Set up the local environment:
   ```bash
   ./setup_local_env.sh
   ```

3. Start the development server:
   ```bash
   ./run_local_server.sh
   ```

4. Manage the database:
   ```bash
   ./manage_local_db.sh [command]
   ```
   
   Available commands: migrate, reset, shell, backup, restore, showmigrations, check

For detailed instructions, see the [Local Environment Quick Reference](./docs/local_env_quickstart.md).

### Docker Environment (Recommended for Production)
The project can also be run using Docker Compose:

1. Start all services:
   ```bash
   docker-compose up -d
   ```

2. Check service status:
   ```bash
   docker-compose ps
   ```

3. View logs:
   ```bash
   docker-compose logs -f [service_name]
   ```

## Documentation

Comprehensive documentation is available in the `docs` directory:

- [Local Development Setup](./docs/local_setup.md)
- [Local Environment Quick Reference](./docs/local_env_quickstart.md)
- [Troubleshooting Guide](./docs/troubleshooting.md)
- [Project Status](./docs/for_mehd.md)

## Project Structure

```
ecar_project/
├── backend/              # Django backend API
├── frontend/             # React admin interface (planned)
├── mobile/               # React Native mobile app (planned)
├── nginx/                # Nginx configuration
├── docs/                 # Documentation
├── docker-compose.yml    # Docker Compose configuration
├── setup_local_env.sh    # Local environment setup script
├── check_local_services.sh  # Service status check script
├── run_local_server.sh   # Local development server script
└── manage_local_db.sh    # Database management script
```

## Troubleshooting

If you encounter issues, refer to the [Troubleshooting Guide](./docs/troubleshooting.md) or run:

```bash
./check_local_services.sh
```

## Contributors

- ECAR Development Team

## Key Features

- User Authentication with JWT
- Customer and Vehicle Management
- Service and Maintenance Tracking
- Parts Inventory Management
- Invoice Generation with PDF Export
- Email and SMS Notification System
- Redis Caching for Performance
- Data Encryption for Sensitive Information
- Automated Database Backup System

## Getting Started

## Configuration

### Environment Variables

Create a `.env` file based on the provided `.env.example`. The system uses 
environment variables for configuration, including database settings, email 
configuration, and API keys.

Key environment variable sections:
- Database Configuration
- Email Settings
- JWT Authentication
- Redis Configuration
- Backup System Configuration
- SMS API Settings (future)

See `.env.example` for a complete list of available settings.

## Documentation

- [API Documentation](docs/api_documentation.md)
- [Development Status](docs/development-status.md)
- [Database Schema](docs/database_schema.md)
- [Automated Backup System](docs/automated_backup_system.md)
- [SMS Notification System](docs/sms_notification_system.md)
- [Email Templates](docs/email_templates.md)
- [PostgreSQL Migration](docs/postgresql_migration.md)
- [PostgreSQL Performance](docs/postgresql_performance.md)
- [PostgreSQL Backup & Recovery](docs/postgresql_backup_recovery.md) 