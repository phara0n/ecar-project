# Connection Pooling Deployment Guide

This guide outlines the deployment process for implementing PgBouncer connection pooling in the ECAR Garage Management System.

## Pre-Deployment Preparation

### 1. Performance Testing
Before deploying connection pooling to production, conduct performance testing to ensure it will improve, not degrade, system performance:

```bash
# Install pgbench (if not already installed)
sudo apt-get install postgresql-contrib

# Create a test database with similar schema
createdb ecar_test

# Initialize test data
pgbench -i -s 10 ecar_test

# Run baseline test without connection pooling
pgbench -c 20 -j 4 -T 60 ecar_test
```

### 2. Backup Database
Always create a backup before making infrastructure changes:

```bash
# For Docker environments
docker exec -t ecar_postgres pg_dump -U ecar_user -d ecar_db > ecar_db_backup_$(date +%Y%m%d).sql

# For direct PostgreSQL installations
pg_dump -U ecar_user -d ecar_db > ecar_db_backup_$(date +%Y%m%d).sql
```

### 3. Prepare Configuration Files
Create all necessary configuration files in advance:

- `pgbouncer.ini`
- `userlist.txt`
- Updated environment variables
- Updated Django settings

## Deployment Steps

### 1. Deploy in Development Environment First

Always test in development before applying to production:

```bash
# Deploy to development
cd /path/to/dev/ecar_project
git checkout -b feature/connection-pooling
# Make changes to docker-compose.yml and configuration files
docker-compose down
docker-compose up -d
```

### 2. Production Deployment (Docker)

```bash
# Stop existing services
cd /path/to/production/ecar_project
docker-compose down

# Update configuration files
cp /path/to/updated/docker-compose.yml ./
mkdir -p ./backend/docker/pgbouncer
cp /path/to/prepared/pgbouncer.ini ./backend/docker/pgbouncer/
cp /path/to/prepared/userlist.txt ./backend/docker/pgbouncer/

# Start services with new configuration
docker-compose up -d
```

### 3. Production Deployment (Direct Installation)

```bash
# Install PgBouncer
sudo apt-get update
sudo apt-get install -y pgbouncer

# Configure PgBouncer
sudo cp /path/to/prepared/pgbouncer.ini /etc/pgbouncer/
sudo cp /path/to/prepared/userlist.txt /etc/pgbouncer/

# Set proper permissions
sudo chown postgres:postgres /etc/pgbouncer/pgbouncer.ini
sudo chown postgres:postgres /etc/pgbouncer/userlist.txt
sudo chmod 640 /etc/pgbouncer/userlist.txt

# Start/restart PgBouncer
sudo systemctl restart pgbouncer

# Update Django settings
cd /path/to/production/ecar_project/backend
# Update settings.py with new connection parameters
```

## Post-Deployment Verification

### 1. Verify Connection Pooling Status

```bash
# For Docker environments
docker exec -it ecar_pgbouncer psql -h 127.0.0.1 -p 6432 -U pgbouncer pgbouncer -c "SHOW POOLS;"
docker exec -it ecar_pgbouncer psql -h 127.0.0.1 -p 6432 -U pgbouncer pgbouncer -c "SHOW STATS;"

# For direct installation
sudo -u postgres psql -h 127.0.0.1 -p 6432 -U pgbouncer pgbouncer -c "SHOW POOLS;"
sudo -u postgres psql -h 127.0.0.1 -p 6432 -U pgbouncer pgbouncer -c "SHOW STATS;"
```

### 2. Verify Application Functionality

Ensure the application is working correctly with the new connection pooling:

```bash
# Check application logs
docker logs ecar_django

# Test API endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.ecar.tn/customers/
```

### 3. Performance Monitoring

Setup monitoring to compare performance before and after the deployment:

```bash
# Install prometheus-node-exporter for system metrics
sudo apt-get install prometheus-node-exporter

# Set up pgBouncer monitoring
# See monitoring documentation for details
```

## Rollback Procedure

If issues arise, be prepared to roll back the changes:

### 1. Docker Rollback

```bash
# Stop services
docker-compose down

# Restore previous docker-compose.yml
cp /path/to/backup/docker-compose.yml ./

# Restart with previous configuration
docker-compose up -d
```

### 2. Direct Installation Rollback

```bash
# Stop PgBouncer
sudo systemctl stop pgbouncer

# Restore previous Django settings
cd /path/to/production/ecar_project/backend
# Restore previous database connection settings in settings.py

# Restart application
sudo systemctl restart gunicorn
```

## Connection Pool Configuration

### Production Pool Size Guidelines

| System Size | Default Pool Size | Max Client Connections | Min Pool Size |
|-------------|------------------|------------------------|---------------|
| Small       | 10-20            | 50-100                 | 3-5           |
| Medium      | 20-40            | 100-200                | 5-10          |
| Large       | 40-80            | 200-500                | 10-20         |

Customize based on your specific workload and server resources:

```ini
# Example for medium-sized deployment
[pgbouncer]
default_pool_size = 30
max_client_conn = 150
min_pool_size = 8
```

## Additional Considerations

### 1. Monitoring Setup

Set up Prometheus and Grafana for comprehensive monitoring:

```yaml
# Example Prometheus configuration for PgBouncer
scrape_configs:
  - job_name: 'pgbouncer'
    static_configs:
      - targets: ['pgbouncer:9127']
```

### 2. Load Testing After Deployment

Conduct load tests after deployment to verify performance improvements:

```bash
# Using Apache Benchmark for simple API endpoint testing
ab -n 1000 -c 50 -H "Authorization: Bearer YOUR_TOKEN" https://api.ecar.tn/customers/
```

### 3. Regular Maintenance

Schedule regular maintenance tasks:

```bash
# Example cron job for weekly PgBouncer stats collection
0 0 * * 0 psql -h 127.0.0.1 -p 6432 -U pgbouncer pgbouncer -c "SHOW POOLS; SHOW STATS;" > /var/log/pgbouncer-stats-$(date +\%Y\%m\%d).log
```

## Troubleshooting Common Deployment Issues

### Authentication Failures

If authentication fails:

```bash
# Check PgBouncer logs
sudo tail -f /var/log/postgresql/pgbouncer.log

# Verify userlist.txt format
cat /etc/pgbouncer/userlist.txt

# Recreate MD5 password hash
echo -n "PASSWORD_HERE$(echo -n 'ecar_user' | tr -d '\n')" | md5sum | awk '{print "md5" $1}'
```

### Connection Issues

If applications can't connect:

```bash
# Test direct connection to PgBouncer
psql -h localhost -p 6432 -U ecar_user ecar_db

# Check if PgBouncer is listening
sudo netstat -tulpn | grep 6432

# Verify firewall rules
sudo ufw status
```

### Performance Degradation

If performance degrades after deployment:

```bash
# Check for resource constraints
free -m
top

# Optimize pool size
sudo nano /etc/pgbouncer/pgbouncer.ini
# Adjust default_pool_size, max_client_conn, etc.
```

## Documentation Updates

After successful deployment, update the following documentation:

1. System architecture diagrams to include PgBouncer
2. Deployment guides for future deployments
3. Operation manuals for maintenance procedures
4. Developer guides for database connection best practices 