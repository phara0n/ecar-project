# API Testing Documentation

## Overview

This document provides information about testing the ECAR API endpoints. We've created automated testing tools to verify the functionality of all API endpoints, detect potential issues, and ensure the system is working correctly.

## Testing Tools

### API Test Script

We've developed a comprehensive Python-based testing tool (`api_test.py`) that systematically tests all API endpoints. The script:

1. Authenticates using JWT token authentication
2. Tests all customer management endpoints
3. Tests all car management endpoints
4. Tests all service management endpoints
5. Tests all invoice management endpoints
6. Verifies token refresh and blacklisting

The test script creates test resources (customers, cars, services, invoices) as needed and reports detailed results including success rates.

## Running the Tests

#### Prerequisites

- Docker containers must be running (`docker-compose up -d`)
- Python 3.6+ with the `requests` library installed

#### Option 1: Running Tests in Docker (Recommended)

The most reliable way to run tests is directly inside the Docker container:

```bash
cd /home/ecar/ecar_project/backend/scripts/testing
./docker_test.sh
```

This script will:
- Verify Docker and the backend container are running
- Install the necessary dependencies inside the container
- Run the tests directly in the container (the same environment as the API)
- Copy results back to the host machine

#### Option 2: Using the Convenience Shell Script

```bash
cd /home/ecar/ecar_project/backend/scripts/testing
./run_api_tests.sh
```

This script will:
- Check that the API is accessible
- Set up a virtual environment with required dependencies
- Run the tests with detailed logging
- Save results to a timestamped log file in the `results` directory

#### Option 3: Running the Python Script Directly

```bash
cd /home/ecar/ecar_project/backend/scripts/testing
python3 api_test.py [--base-url=http://localhost:8000] [--username=admin] [--password=admin123]
```

### Command-line Options

The API test script accepts the following command-line options:

- `--base-url`: The base URL of the API (default: http://localhost:8000)
- `--username`: The username for authentication (default: admin)
- `--password`: The password for authentication (default: admin123)

### Test Results

The script generates a log file with detailed results of each API test, including:

- HTTP method and URL
- Status code
- Response data for failed tests
- Overall statistics (success rate, failures, etc.)

Example output:
```
========================================================
ECAR API TEST RESULTS
========================================================
Total Tests:    42
Successful:     40
Failed:         2
Skipped:        0
Success Rate:   95.24%
========================================================
```

## Troubleshooting

If tests fail, check the following:

1. **Connection Issues**: Make sure the Docker containers are running and the API is accessible
2. **Authentication Issues**: Verify that the admin credentials are correct
3. **Permission Issues**: Ensure the test user has the necessary permissions
4. **Data Issues**: Some tests may fail if required data isn't available

## Using During Development

It's recommended to run the API tests:

1. After making significant changes to the API
2. Before deploying to production
3. As part of the CI/CD pipeline
4. When troubleshooting issues

## Adding New Tests

As new API endpoints are added, the testing script should be updated to include them. Follow these steps:

1. Identify the new endpoint(s) to test
2. Add appropriate test methods in the `EcarApiTester` class
3. Update the `run_all_tests` method to include the new test methods
4. Run the tests to verify the new endpoints work correctly 