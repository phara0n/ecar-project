# CI/CD Setup for ECAR Project

This document outlines the Continuous Integration and Continuous Deployment (CI/CD) pipeline set up for the ECAR Garage Management System.

## Overview

Our CI/CD pipeline uses GitHub Actions to automatically test, build, and deploy the application. The workflow is designed to ensure code quality and reliability while simplifying the deployment process.

## Pipeline Components

### 1. Backend CI (`.github/workflows/backend-ci.yml`)

**Triggers:**
- Push to `main` or `dev` branches that modify backend code
- Pull requests to `main` or `dev` branches that modify backend code

**Steps:**
1. Set up Python and PostgreSQL for testing
2. Install dependencies
3. Run database migrations
4. Execute Django tests
5. Check code quality with flake8
6. Build and push Docker image (only on push to main/dev)

### 2. Frontend CI (`.github/workflows/frontend-ci.yml`)

**Triggers:**
- Push to `main` or `dev` branches that modify frontend code
- Pull requests to `main` or `dev` branches that modify frontend code

**Steps:**
1. Set up Node.js environment
2. Install dependencies
3. Run lint checks
4. Build the application
5. Build and push Docker image (only on push to main)

### 3. Production Deployment (`.github/workflows/deploy.yml`)

**Triggers:**
- Push to `main` branch (excluding documentation changes)
- Manual trigger via workflow_dispatch

**Steps:**
1. Verify that all required files are present
2. Connect to production server via SSH
3. Pull latest code
4. Update Docker containers
5. Run migrations and other setup tasks
6. Back up the database

### 4. Documentation Update (`.github/workflows/docs-update.yml`)

**Triggers:**
- Push to `main` or `dev` branches that modify documentation
- Manual trigger

**Steps:**
1. Validate documentation files
2. Check for broken links
3. Generate documentation summary

## Required Secrets

The following secrets need to be configured in GitHub repository settings:

1. `DOCKER_HUB_USERNAME`: Username for Docker Hub
2. `DOCKER_HUB_TOKEN`: Access token for Docker Hub
3. `SSH_PRIVATE_KEY`: SSH key for connecting to the production server
4. `PRODUCTION_HOST`: Hostname or IP of the production server
5. `SSH_USERNAME`: Username for SSH login to the production server

## Setting Up CI/CD for Development

### For Developers

1. **Working with Feature Branches:**
   - Create feature branches from `dev`
   - Make sure your code passes all tests locally before pushing
   - Create pull requests to `dev` for code review

2. **Understanding CI Feedback:**
   - GitHub Actions will provide feedback on your pull requests
   - Fix any issues reported by the CI pipeline
   - Only merge when all checks pass

### For DevOps

1. **Managing Secrets:**
   - Regularly rotate access tokens and credentials
   - Use repository environments to restrict deployment access

2. **Monitoring Deployments:**
   - Check GitHub Actions logs for deployment status
   - Set up notifications for failed workflows
   - Perform post-deployment verification

## Backup Strategy

The CI/CD pipeline includes automatic database backups:

1. Backups are created before each deployment
2. Backup files are stored in `/backups` on the production server
3. Only the last 7 backups are retained to save space
4. Each backup is compressed to minimize storage requirements

## Troubleshooting

If you encounter issues with the CI/CD pipeline:

1. Check the workflow run logs in GitHub Actions
2. Verify that all required secrets are properly configured
3. Test the problematic steps locally to identify the issue
4. For deployment failures, check the server logs

## Future Improvements

1. Add end-to-end testing with Cypress
2. Implement performance testing
3. Add automated security scanning
4. Set up staging environment deployments
5. Implement blue/green deployment strategy 