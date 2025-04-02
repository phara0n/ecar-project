#!/bin/bash
# Script to make all Python scripts executable and copy them to the Docker container

# Make all scripts executable
echo "Making scripts executable..."
chmod +x *.py

# Create the APISSYNC directory in the Docker container if it doesn't exist
echo "Creating APISSYNC directory in Docker container..."
docker-compose exec backend mkdir -p /app/APISSYNC

# Copy all Python scripts to the Docker container
echo "Copying scripts to Docker container..."
for script in *.py; do
  echo "Copying $script..."
  docker cp "$script" "$(docker-compose ps -q backend):/app/APISSYNC/"
done

# Copy this script itself to the Docker container
docker cp "copy_to_docker.sh" "$(docker-compose ps -q backend):/app/APISSYNC/"

echo "Making scripts executable in the Docker container..."
docker-compose exec backend chmod +x /app/APISSYNC/*.py

echo "✅ All scripts have been copied to the Docker container"
echo "To run all fixes, execute:"
echo "docker-compose exec backend python /app/APISSYNC/run_all_fixes.py" 