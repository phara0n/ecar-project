# PostgreSQL Backup and Recovery Procedures

This document outlines the backup and recovery procedures for the PostgreSQL database used in the ECAR Garage Management System.

## Backup Strategies

The ECAR system employs multiple backup strategies to ensure data integrity and availability.

### 1. Scheduled Automated Backups

Automated backups are performed daily using the integrated backup system. The system creates SQL dumps that can be used for point-in-time recovery.

#### Configuration

The backup system is configured in the Django settings and uses environment variables to control its behavior:

```python
# Database Backup Configuration
BACKUP_DIR = os.path.join(BASE_DIR, 'backups')
BACKUP_RETENTION_COUNT = int(os.environ.get('BACKUP_RETENTION_COUNT', 10))
BACKUP_SFTP_ENABLED = os.environ.get('BACKUP_SFTP_ENABLED', 'False') == 'True'
BACKUP_SFTP_HOST = os.environ.get('BACKUP_SFTP_HOST', '')
BACKUP_SFTP_PORT = int(os.environ.get('BACKUP_SFTP_PORT', 22))
BACKUP_SFTP_USER = os.environ.get('BACKUP_SFTP_USER', '')
BACKUP_SFTP_PASSWORD = os.environ.get('BACKUP_SFTP_PASSWORD', '')
BACKUP_SFTP_DIRECTORY = os.environ.get('BACKUP_SFTP_DIRECTORY', '/backups')
```

### 2. Manual Backups

Manual backups can be performed using the Django management command:

```bash
python manage.py create_backup --upload-to-sftp
```

### 3. Direct PostgreSQL Backups

For more control, you can create backups directly using PostgreSQL tools:

```bash
# Simple backup
pg_dump -h localhost -U ecar_user -d ecar_db > /path/to/backup/ecar_db_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
pg_dump -h localhost -U ecar_user -d ecar_db | gzip > /path/to/backup/ecar_db_$(date +%Y%m%d_%H%M%S).sql.gz

# Custom format (recommended for large databases)
pg_dump -h localhost -U ecar_user -d ecar_db -Fc > /path/to/backup/ecar_db_$(date +%Y%m%d_%H%M%S).dump
```

## Backup Rotation and Retention

We follow the 3-2-1 backup strategy:

1. Keep at least 3 copies of your data
2. Store backups on 2 different storage media
3. Keep 1 backup offsite

Recommended retention policy:

- Daily backups: Keep for 7 days
- Weekly backups: Keep for 4 weeks
- Monthly backups: Keep for 12 months
- Yearly backups: Keep indefinitely

## Recovery Procedures

### 1. Recovery Using Django Management Command

To restore a database from a backup created by the automated system:

```bash
python manage.py restore_backup /path/to/backup/file.sql
```

### 2. Direct PostgreSQL Restoration

Restoring directly using PostgreSQL tools:

```bash
# For SQL backups
psql -h localhost -U ecar_user -d ecar_db < /path/to/backup/file.sql

# For compressed backups
gunzip -c /path/to/backup/file.sql.gz | psql -h localhost -U ecar_user -d ecar_db

# For custom format backups
pg_restore -h localhost -U ecar_user -d ecar_db /path/to/backup/file.dump
```

### 3. Point-in-Time Recovery

For more advanced recovery scenarios, PostgreSQL supports point-in-time recovery using WAL (Write-Ahead Log) files. This requires configuring WAL archiving:

```bash
# In postgresql.conf:
wal_level = replica
archive_mode = on
archive_command = 'cp %p /path/to/archive/%f'
```

## Backup Verification

Every backup should be verified to ensure it can be restored successfully:

1. **Automated Verification**: The backup system includes verification steps to check backup integrity.
2. **Manual Verification**: Periodically restore backups to a test environment to verify they work correctly.

## Disaster Recovery Planning

### 1. Database Server Failure

In case of database server failure:

1. Set up a new PostgreSQL server
2. Install required extensions
3. Restore the latest backup
4. Update connection settings if needed

### 2. Data Corruption

In case of data corruption:

1. Identify the extent of corruption
2. Determine the most recent clean backup
3. Restore to the clean backup
4. Apply transaction logs if using WAL archiving

## Special Considerations for Docker Environment

When running in Docker, adjust the backup and recovery commands:

```bash
# Backup in Docker
docker-compose exec db pg_dump -U ecar_user -d ecar_db > backup.sql

# Restore in Docker
cat backup.sql | docker-compose exec -T db psql -U ecar_user -d ecar_db
```

## Monitoring Backup Status

The ECAR system includes a backup monitoring dashboard that shows:

1. Last successful backup time
2. Backup sizes and locations
3. Failed backup attempts
4. Available storage space

## Best Practices

1. **Test Restores Regularly**: Monthly test restores ensure backup integrity
2. **Document Changes**: Keep this document updated with any changes to backup procedures
3. **Secure Backups**: Encrypt sensitive data in backups
4. **Monitor Logs**: Review backup logs regularly for errors
5. **Automate Everything**: Minimize manual intervention in backup processes 