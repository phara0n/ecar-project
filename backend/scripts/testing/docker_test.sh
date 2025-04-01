#!/bin/bash
# ECAR API Testing Script for Docker
# ---------------------------------
# This script runs API tests directly inside the Docker container

set -e

echo "=== ECAR API Testing (Docker Mode) ==="

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker."
    exit 1
fi

# Verify if the backend container is running
if ! docker ps | grep -q ecar_project_backend; then
    echo "Error: The backend container is not running."
    echo "Start the containers with: docker-compose up -d"
    exit 1
fi

# Install necessary tools inside the container
echo "Installing network tools in the container..."
docker exec ecar_project_backend_1 apt-get update -q && docker exec ecar_project_backend_1 apt-get install -y --no-install-recommends curl iputils-ping

# Check if the backend is responding to basic requests
echo "Checking if Django admin is accessible..."
docker exec ecar_project_backend_1 curl -s http://backend:8000/admin/ > /dev/null || echo "Django admin not responding"

# Install necessary Python libraries
echo "Installing dependencies in the container..."
docker exec ecar_project_backend_1 pip install requests

# Create and copy the admin user creation script
echo "Creating admin user..."
docker cp /home/ecar/ecar_project/backend/scripts/testing/create_admin.py ecar_project_backend_1:/app/create_admin.py
docker exec ecar_project_backend_1 python /app/create_admin.py

# Copy the direct API test script to the container
echo "Copying API test script to container..."
docker cp /tmp/simple_api_test.py ecar_project_backend_1:/app/scripts/testing/direct_api_test.py

# Run the API test script
echo "Running API tests inside container..."
docker exec ecar_project_backend_1 python /app/scripts/testing/direct_api_test.py

# Get the exit code
EXIT_CODE=$?

# Copy all potential result files
echo "Copying test results back from container..."
mkdir -p "$(dirname "$0")/results"

# Copy log files if available
echo "Checking for test results..."
if docker exec ecar_project_backend_1 test -f /app/api_test_results.log; then
    echo "Found log at /app/api_test_results.log"
    docker cp ecar_project_backend_1:/app/api_test_results.log "$(dirname "$0")/results/api_test_$(date +"%Y%m%d_%H%M%S").log"
fi

if docker exec ecar_project_backend_1 test -f /app/scripts/testing/api_test_results.log; then
    echo "Found log at /app/scripts/testing/api_test_results.log"
    docker cp ecar_project_backend_1:/app/scripts/testing/api_test_results.log "$(dirname "$0")/results/api_test_scripts_$(date +"%Y%m%d_%H%M%S").log"
fi

echo "=== API Test Complete (Exit Code: $EXIT_CODE) ==="

# Create a summary file with the test results
SUMMARY_FILE="$(dirname "$0")/results/summary_$(date +"%Y%m%d_%H%M%S").txt"
echo "Creating test summary in $SUMMARY_FILE"

# Summary of the test results
cat > "$SUMMARY_FILE" << EOF
ECAR API Test Summary
====================
Date: $(date)
Exit Code: $EXIT_CODE

Environment:
- Docker containers running: $(docker ps | grep ecar_project | wc -l)
- Backend container status: $(docker inspect --format '{{.State.Status}}' ecar_project_backend_1)
- Running user: $(whoami)

Key Findings:
- API accessibility: $([ $EXIT_CODE -eq 0 ] && echo "PASS" || echo "FAIL")
- Detailed logs available in the results directory

Next Steps:
$(if [ $EXIT_CODE -eq 0 ]; then
    echo "- The API endpoints are accessible and functioning as expected"
    echo "- Continue with more detailed API functional testing"
else
    echo "- Review the logs to identify the specific API issues"
    echo "- Check the JWT authentication implementation in the Django backend"
    echo "- Consider updating to use session-based authentication for testing"
fi)
EOF

# Display summary
cat "$SUMMARY_FILE"

exit $EXIT_CODE 