#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "===================================================="
echo -e "ECAR Garage Management System - PgBouncer Setup"
echo -e "===================================================="
echo

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}This script must be run with sudo.${NC}"
  exit 1
fi

echo -e "Setting up PgBouncer for local development..."
echo

# Install PgBouncer
echo -e "1. Installing PgBouncer..."
apt update
apt install -y pgbouncer
echo -e "${GREEN}PgBouncer installed${NC}"

# Configure PgBouncer
echo -e "\n2. Configuring PgBouncer..."

# Create pgbouncer.ini
cat > /etc/pgbouncer/pgbouncer.ini << 'EOF'
[databases]
ecar_db = host=localhost port=5432 dbname=ecar_db

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = trust
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
min_pool_size = 0
reserve_pool_size = 5
reserve_pool_timeout = 3
log_connections = 1
log_disconnections = 1
admin_users = postgres,ecar_user
stats_users = postgres,ecar_user
EOF

# Create userlist.txt
cat > /etc/pgbouncer/userlist.txt << 'EOF'
"ecar_user" "ecar_password"
"postgres" "postgres"
EOF

echo -e "${GREEN}PgBouncer configuration created${NC}"

# Create environment file for Django
echo -e "\n3. Creating Django environment file for PgBouncer..."
BACKEND_DIR="/home/ecar/ecar_project/backend"
ENV_FILE="$BACKEND_DIR/.env.pgbouncer"

# Check if source .env.local exists
if [ ! -f "$BACKEND_DIR/.env.local" ]; then
  echo -e "${RED}Error: $BACKEND_DIR/.env.local not found${NC}"
  exit 1
fi

# Copy .env.local to .env.pgbouncer
cp "$BACKEND_DIR/.env.local" "$ENV_FILE"

# Update database settings
sed -i 's/DB_PORT=5432/DB_PORT=6432/' "$ENV_FILE"
echo "CONN_MAX_AGE=0" >> "$ENV_FILE"

chown ecar:ecar "$ENV_FILE"

echo -e "${GREEN}Django environment file created at $ENV_FILE${NC}"

# Create a script to run Django with PgBouncer
echo -e "\n4. Creating run script for Django with PgBouncer..."

cat > /home/ecar/ecar_project/run_with_pgbouncer.sh << 'EOF'
#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BACKEND_DIR="/home/ecar/ecar_project/backend"
ENV_FILE="$BACKEND_DIR/.env.pgbouncer"

# Check if virtual environment exists
if [ ! -d "$BACKEND_DIR/.venv" ]; then
  echo -e "${RED}Error: Virtual environment not found at $BACKEND_DIR/.venv${NC}"
  echo -e "Please run ${YELLOW}./setup_local_env.sh${NC} first."
  exit 1
fi

# Check if .env.pgbouncer exists
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Error: Environment file not found at $ENV_FILE${NC}"
  exit 1
fi

# Check if PgBouncer is running
if ! pg_isready -h localhost -p 6432 >/dev/null 2>&1; then
  echo -e "${RED}Error: PgBouncer is not running on port 6432.${NC}"
  echo -e "Run: ${YELLOW}sudo systemctl start pgbouncer${NC}"
  exit 1
fi

# Activate virtual environment
echo -e "Activating virtual environment..."
source "$BACKEND_DIR/.venv/bin/activate"

# Change to backend directory
cd "$BACKEND_DIR" || exit 1

# Load environment variables
echo -e "Loading environment from ${YELLOW}$ENV_FILE${NC}..."
set -a
source "$ENV_FILE"
set +a

# Run collectstatic if needed
if [ ! -d "$BACKEND_DIR/staticfiles" ]; then
  echo -e "Collecting static files..."
  python3 manage.py collectstatic --noinput
fi

# Run development server
echo -e "${GREEN}Starting Django development server with PgBouncer...${NC}"
echo -e "The server will be available at ${GREEN}http://localhost:8000${NC}"
echo -e "Press Ctrl+C to stop the server."
echo -e "==============================================="
python3 manage.py runserver 0.0.0.0:8000
EOF

chmod +x /home/ecar/ecar_project/run_with_pgbouncer.sh
chown ecar:ecar /home/ecar/ecar_project/run_with_pgbouncer.sh

echo -e "${GREEN}Run script created at /home/ecar/ecar_project/run_with_pgbouncer.sh${NC}"

# Restart PgBouncer
echo -e "\n5. Starting PgBouncer service..."
systemctl restart pgbouncer
systemctl status pgbouncer | grep Active

echo -e "\n6. Testing PgBouncer connection..."
if sudo -u postgres psql -h localhost -p 6432 -d ecar_db -c "SELECT 1 as connection_test;" > /dev/null 2>&1; then
  echo -e "${GREEN}PgBouncer connection test successful!${NC}"
else
  echo -e "${RED}PgBouncer connection test failed. Check configuration and logs.${NC}"
  echo -e "You can check logs with: ${YELLOW}sudo tail -f /var/log/postgresql/pgbouncer.log${NC}"
fi

echo -e "\n===================================================="
echo -e "${GREEN}PgBouncer setup complete!${NC}"
echo -e "===================================================="
echo -e "\nTo run Django with PgBouncer, execute:"
echo -e "  ${YELLOW}./run_with_pgbouncer.sh${NC}"
echo -e "\nTo check PgBouncer status:"
echo -e "  ${YELLOW}sudo systemctl status pgbouncer${NC}"
echo -e "\nTo check PgBouncer logs:"
echo -e "  ${YELLOW}sudo tail -f /var/log/postgresql/pgbouncer.log${NC}"
echo -e "\nTo check connections:"
echo -e "  ${YELLOW}psql -h localhost -p 6432 -U postgres pgbouncer -c \"SHOW pools;\"${NC}"
