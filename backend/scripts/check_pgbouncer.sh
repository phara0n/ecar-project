#!/bin/bash

# Script to check PgBouncer status and collect metrics
# Usage: ./check_pgbouncer.sh [hostname] [port] [username] [output_file]

# Default values
HOSTNAME=${1:-"pgbouncer"}
PORT=${2:-"6432"}
USERNAME=${3:-"postgres"}
OUTPUT_FILE=${4:-"/app/logs/pgbouncer/status_$(date +%Y%m%d_%H%M%S).log"}

# Ensure the output directory exists
mkdir -p $(dirname $OUTPUT_FILE)

# Start the log with a timestamp
echo "=== PgBouncer Status Check $(date) ===" > $OUTPUT_FILE

# Check if PgBouncer is running
if ! pg_isready -h $HOSTNAME -p $PORT -U $USERNAME > /dev/null 2>&1; then
    echo "ERROR: PgBouncer is not running or not accessible" >> $OUTPUT_FILE
    exit 1
fi

# Get PgBouncer pools
echo "=== POOLS ===" >> $OUTPUT_FILE
PGPASSWORD=$PGPASSWORD psql -h $HOSTNAME -p $PORT -U $USERNAME pgbouncer -c "SHOW POOLS;" >> $OUTPUT_FILE 2>&1

# Get PgBouncer stats
echo "=== STATS ===" >> $OUTPUT_FILE
PGPASSWORD=$PGPASSWORD psql -h $HOSTNAME -p $PORT -U $USERNAME pgbouncer -c "SHOW STATS;" >> $OUTPUT_FILE 2>&1

# Get PgBouncer clients
echo "=== CLIENTS ===" >> $OUTPUT_FILE
PGPASSWORD=$PGPASSWORD psql -h $HOSTNAME -p $PORT -U $USERNAME pgbouncer -c "SHOW CLIENTS;" >> $OUTPUT_FILE 2>&1

# Get PgBouncer servers
echo "=== SERVERS ===" >> $OUTPUT_FILE
PGPASSWORD=$PGPASSWORD psql -h $HOSTNAME -p $PORT -U $USERNAME pgbouncer -c "SHOW SERVERS;" >> $OUTPUT_FILE 2>&1

# Get PgBouncer config
echo "=== CONFIG ===" >> $OUTPUT_FILE
PGPASSWORD=$PGPASSWORD psql -h $HOSTNAME -p $PORT -U $USERNAME pgbouncer -c "SHOW CONFIG;" >> $OUTPUT_FILE 2>&1

echo "PgBouncer status check completed. Results saved to $OUTPUT_FILE"
exit 0 