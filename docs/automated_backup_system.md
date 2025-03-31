# Automated Backup System Documentation

## Overview

The ECAR Garage Management System includes an automated backup system for database protection. This system provides:

1. Scheduled daily backups
2. Manual backup creation
3. Backup restoration
4. Backup rotation (to limit disk space usage)
5. Optional SFTP upload for off-site storage

## Components

### 1. Backup Utilities (`utils/backup_utils.py`)

Core utilities that handle:
- Creating database backups
- Uploading backups to SFTP
- Rotating old backups
- Restoring from backups

The system supports both PostgreSQL and SQLite databases.

### 2. Celery Task (`utils/backup_task.py`)

A scheduled Celery task that:
- Creates a daily backup
- Uploads it to SFTP if enabled
- Rotates old backups based on retention settings

### 3. Management Commands

Two Django management commands:
- `create_backup`: For manually creating backups
- `restore_backup`: For listing and restoring from existing backups

## Configuration

The backup system is configured through environment variables:

```
# Backup Settings
BACKUP_RETENTION_COUNT=10        # Number of backups to keep
BACKUP_SFTP_ENABLED=False        # Enable/disable SFTP uploads
BACKUP_SFTP_HOST=sftp.example.com  # SFTP server address
BACKUP_SFTP_PORT=22              # SFTP port
BACKUP_SFTP_USER=sftp_user       # SFTP username
BACKUP_SFTP_PASSWORD=password    # SFTP password
BACKUP_SFTP_DIRECTORY=/backups   # SFTP directory for backups
```

## Usage

### Scheduled Backups

Backups are automatically created daily at 3:00 AM UTC. This is configured in the Celery beat schedule in `celery.py`.

### Manual Backups

To create a manual backup:

```bash
# Simple backup
python manage.py create_backup

# With a custom filename
python manage.py create_backup --filename custom_backup_name.sql

# Create and upload to SFTP
python manage.py create_backup --upload
```

### Listing Available Backups

```bash
python manage.py restore_backup --list
# or simply
python manage.py restore_backup
```

### Restoring from a Backup

```bash
python manage.py restore_backup your_backup_filename.sql
```

**Warning**: Restoring will replace all current data in the database. The command will ask for confirmation before proceeding.

## Backup Location

Backups are stored in the `backups` directory in the project root. This location can be customized by setting the `BACKUP_DIR` in your settings.

## Dependencies

The backup system requires:
- For PostgreSQL: `pg_dump` and `pg_restore` commands must be available
- For SFTP uploads: The `paramiko` Python package

## Troubleshooting

- Check the application logs for backup errors with the log prefix "Database backup"
- Ensure proper permissions for the backup directory
- For SFTP issues, verify connectivity to the SFTP server and credentials

## Recommendations

1. **Regular Testing**: Periodically test the restore process to ensure backups are valid
2. **Off-site Storage**: Enable SFTP uploads for off-site backup storage
3. **Monitoring**: Set up notifications for backup failures
4. **Backup Verification**: Consider implementing a verification step to validate backup integrity 