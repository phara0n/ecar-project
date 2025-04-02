#!/bin/bash

echo "Starting ECAR Admin Web Interface development server..."

# Navigate to the web-admin directory
cd "$(dirname "$0")" || {
  echo "Error: Could not navigate to web-admin directory"
  exit 1
}

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Run the development server
echo "Starting development server..."
npm run dev 