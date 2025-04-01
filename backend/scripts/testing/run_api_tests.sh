#!/bin/bash
# ECAR API Testing Script Wrapper
# ---------------------------------
# This script runs the API tests for the ECAR project

set -e

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
API_TEST_SCRIPT="$SCRIPT_DIR/api_test.py"
RESULTS_DIR="$SCRIPT_DIR/results"

# Create the results directory if it doesn't exist
mkdir -p "$RESULTS_DIR"

# Generate a timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$RESULTS_DIR/api_test_${TIMESTAMP}.log"

echo "Starting ECAR API Tests..."
echo "Log file: $LOG_FILE"

# Check if Docker is running and the backend is available
echo "Checking if the API is available..."
if ! curl -s http://localhost:8000/api/ -o /dev/null; then
    echo "Error: Cannot connect to the API at http://localhost:8000/api/"
    echo "Make sure the Docker containers are running using 'docker-compose up -d'"
    exit 1
fi
echo "API is available."

# Create a virtual environment if it doesn't exist
if [ ! -d "$SCRIPT_DIR/venv" ]; then
    echo "Creating a virtual environment..."
    python3 -m venv "$SCRIPT_DIR/venv"
fi

# Activate the virtual environment
echo "Activating virtual environment..."
source "$SCRIPT_DIR/venv/bin/activate"

# Install required Python packages
echo "Installing required packages..."
pip install requests > /dev/null

# Run the API tests and capture output
echo "Running API tests..."
python3 "$API_TEST_SCRIPT" "$@" 2>&1 | tee "$LOG_FILE"

# Check the exit code of the API test script
EXIT_CODE=${PIPESTATUS[0]}

if [ $EXIT_CODE -eq 0 ]; then
    echo "API Tests completed successfully!"
else
    echo "API Tests failed with exit code $EXIT_CODE"
    echo "Check the log file for details: $LOG_FILE"
fi

# Deactivate the virtual environment
deactivate

exit $EXIT_CODE 