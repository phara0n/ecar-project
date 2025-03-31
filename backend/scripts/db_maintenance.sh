#!/bin/bash

# PostgreSQL database maintenance script for ECAR Garage Management System
# Run this script weekly to maintain database performance

# Load environment variables
source /home/ecar/ecar_project/.env

# Set default values if environment variables are not set
DB_NAME=${DB_NAME:-ecar_db}
DB_USER=${DB_USER:-ecar_user}
DB_PASSWORD=${DB_PASSWORD:-ecar_password}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

# Export password for psql commands
export PGPASSWORD=$DB_PASSWORD

echo "Starting PostgreSQL maintenance for $DB_NAME..."

# 1. Run VACUUM ANALYZE to reclaim space and update statistics
echo "Running VACUUM ANALYZE..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "VACUUM ANALYZE;"

# 2. Run VACUUM FULL on specific tables (more intensive)
echo "Running VACUUM FULL on large tables..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "VACUUM FULL core_service;"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "VACUUM FULL core_invoice;"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "VACUUM FULL core_notification;"

# 3. Reindex key tables to improve index performance
echo "Reindexing tables..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "REINDEX TABLE core_service;"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "REINDEX TABLE core_invoice;"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "REINDEX TABLE core_customer;"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "REINDEX TABLE core_car;"

# 4. Check for any bloated tables
echo "Checking for bloated tables..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT schemaname, relname, n_dead_tup, n_live_tup, 
       round(n_dead_tup::numeric / (n_live_tup + n_dead_tup + 0.01) * 100, 2) AS dead_percentage
FROM pg_stat_user_tables
WHERE n_dead_tup > 100
ORDER BY dead_percentage DESC
LIMIT 10;
"

# 5. Find unused indexes
echo "Finding unused indexes..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT
    idstat.relname AS table_name,
    indexrelname AS index_name,
    idstat.idx_scan AS index_scans,
    pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size
FROM
    pg_stat_user_indexes AS idstat
JOIN
    pg_index i ON idstat.indexrelid = i.indexrelid
WHERE
    idstat.idx_scan < 10  -- Indexes with fewer than 10 scans
    AND NOT i.indisprimary  -- Not a primary key
    AND NOT i.indisunique   -- Not a unique constraint
ORDER BY
    index_scans ASC,
    pg_relation_size(i.indexrelid) DESC;
"

# 6. Database size information
echo "Database size information:"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT
    pg_database.datname AS database_name,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS database_size
FROM
    pg_database
WHERE
    pg_database.datname = '$DB_NAME';
"

echo "PostgreSQL maintenance completed successfully!" 