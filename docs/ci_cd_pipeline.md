# CI/CD Pipeline Documentation

## Overview

The ECAR Garage Management System uses GitHub Actions for continuous integration and deployment. This pipeline automates testing, validation, and (potentially) deployment processes to ensure code quality and reliability.

## Pipeline Configuration

The CI/CD pipeline is defined in `.github/workflows/backend-ci.yml` and is triggered on:
- Push to the `main` branch (when changes occur in the `backend/` directory)
- Pull requests to the `main` branch (when changes occur in the `backend/` directory)

## Pipeline Steps

### Testing

The testing job runs on ubuntu-latest and sets up the following services:

1. **PostgreSQL**:
   - Version: 15
   - Configuration: Test database with credentials specified in the workflow

2. **Redis**:
   - Version: 7.2-alpine
   - Purpose: For caching during tests

The job then performs these steps:
1. Checks out the code
2. Sets up Python 3.12
3. Installs dependencies from `requirements.txt`
4. Runs database migrations
5. Executes the test suite

### Deployment (Commented Out)

The pipeline includes a commented deployment job that could be enabled for production:
- Triggers only on push to `main` branch after successful tests
- Uses SSH to connect to the production server
- Pulls the latest code
- Rebuilds and restarts Docker containers

## Environment Variables

The pipeline requires these environment variables:
- `DJANGO_SETTINGS_MODULE`: Set to `ecar_backend.settings`
- `DATABASE_URL`: Database connection string
- `REDIS_URL`: Redis connection string

For the deployment job (when uncommented), these secrets would be needed:
- `HOST`: Production server hostname
- `USERNAME`: SSH username
- `SSH_KEY`: SSH private key for authentication

## How to Use

### Running Locally

You can test the workflow locally using [act](https://github.com/nektos/act):

```bash
act -j test
```

### Debugging Pipeline Issues

If the pipeline fails:
1. Check the GitHub Actions logs for error messages
2. Verify that tests pass locally before pushing
3. Ensure environment variables are correctly configured

## Future Enhancements

Planned improvements to the CI/CD pipeline:
1. Add code coverage reporting
2. Implement security scanning
3. Configure automated deployments to staging and production environments
4. Add notification system for pipeline failures

## Manual Deployment

Until automated deployment is fully configured, manual deployment can be performed:

```bash
# SSH into the production server
ssh user@production-server

# Navigate to the application directory
cd /path/to/app

# Pull the latest changes
git pull

# Restart the containers
docker-compose up -d --build
``` 