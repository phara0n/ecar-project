# Backend Database Population Documentation

## Overview
This document describes the database population process for the ECAR Garage Management System. We've created a set of fixture files and scripts to automate the initialization of the database with sample data for development and testing purposes.

## Fixture Files
We have created several JSON fixture files to populate the database with sample data:

1. **service_intervals.json**: Contains common service interval types such as oil changes, brake inspections, etc.
2. **sample_data.json**: Contains users, customers, and cars data.
3. **services.json**: Contains service records and service items, along with invoices.
4. **service_history.json**: Contains service history records and mileage updates.
5. **notifications.json**: Contains notification records for users.

## Initialization Script
The `init_database.sh` script in the `backend/scripts` directory automates the process of applying migrations and loading fixtures. It performs the following actions:

1. Runs Django migrations
2. Creates a superuser (admin) with a default password
3. Loads all fixture files in the correct order to ensure proper relationships

## How to Use

### Using Docker Compose
The Docker Compose configuration has been updated to automatically run the initialization script when starting the backend container. Simply run:

```bash
cd ecar_project
docker-compose up
```

This will:
1. Start the PostgreSQL database container
2. Start the PgBouncer connection pooling container
3. Start the Redis cache container
4. Start the backend container, running migrations and loading fixtures
5. Start the Nginx container

### Manual Initialization
If you need to manually initialize the database:

```bash
cd ecar_project/backend
chmod +x scripts/init_database.sh
./scripts/init_database.sh
```

### Checking Database Status
To verify that the database has been properly populated, use the `check_db.sh` script:

```bash
cd ecar_project/backend
chmod +x scripts/check_db.sh
./scripts/check_db.sh
```

This will display the tables in the database and count the number of records in each main table.

## Sample Data

### Users
- **Admin**: Super admin user (username: admin, password: admin123)
- **Customers**: Three sample customers with associated user accounts

### Cars
- Five sample vehicles of different makes and models
- Each car has appropriate mileage and service history

### Services
- Sample service records with different statuses
- Associated service items and costs
- Historical service records

### Invoices
- Sample invoices associated with services
- Various payment statuses and amounts

## Next Steps
1. Verify the API endpoints using Swagger UI at `/api/swagger/`
2. Test authentication using JWT tokens
3. Connect the frontend to the backend API

## Updating Sample Data
If you need to modify or add to the sample data, edit the appropriate fixture file and then reload it using the `loaddata` management command:

```bash
python manage.py loaddata fixtures/your_fixture_file.json
```

## Resetting the Database
If you need to reset the database completely:

```bash
# Using Docker
docker-compose down -v  # This removes volumes
docker-compose up

# Manually
python manage.py flush  # This clears all data
./scripts/init_database.sh  # Reinitialize
```

## Important Notes
- The superuser password is set to `admin123` for development only. In production, use a strong password.
- All sample data is fictional and for testing purposes only.
- The initialization script should only be run once unless you want to reset the database.

Last updated: April 5, 2024 