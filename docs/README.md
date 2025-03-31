# ECAR Garage Management System Documentation

## Overview
This directory contains documentation for the ECAR Garage Management System project. The system consists of three main components:
- Backend API (Django + DRF)
- Admin Web Interface (React + Vite + Ant Design)
- Mobile App (React Native)

## Documentation Files

### Setup and Installation
- [Local Development Setup](./local_setup.md) - Instructions for setting up a local development environment
- [Local Environment Quick Reference](./local_env_quickstart.md) - Quick reference guide for local development
- [Troubleshooting Guide](./troubleshooting.md) - Common issues and solutions

### Project Status
- [For Mehd](./for_mehd.md) - Latest project status update for project management
- [Connection Pooling Status](./connection_pooling_status.md) - Status of PgBouncer implementation

### System Architecture
- [System Architecture](./system_architecture.md) - Overall system design and component interactions
- [Database Schema](./database_schema.md) - Database design and entity relationships

### API Documentation
- [API Endpoints](./api_endpoints.md) - List of available API endpoints and usage
- [Authentication](./authentication.md) - JWT authentication implementation details

## Project Structure
```
ecar_project/
├── backend/              # Django backend API
├── frontend/             # React admin interface
├── mobile/               # React Native mobile app
├── nginx/                # Nginx configuration
├── docs/                 # Documentation (you are here)
└── docker-compose.yml    # Docker Compose configuration
```

## Getting Started

### Local Development
For local development, refer to the [Local Development Setup](./local_setup.md) guide or the [Quick Reference](./local_env_quickstart.md).

Use the provided scripts in the project root directory:
```bash
# Initial setup
./setup_local_env.sh

# Check service status
./check_local_services.sh

# Start development server
./run_local_server.sh

# Database management
./manage_local_db.sh [command]
```

### Docker Development
For Docker-based development, use the following commands:
```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

## Troubleshooting

If you encounter issues, refer to the [Troubleshooting Guide](./troubleshooting.md). 