import logging
from celery import shared_task
from django.conf import settings
from .backup_utils import create_database_backup, upload_backup_to_sftp, rotate_backups

logger = logging.getLogger(__name__)

@shared_task
def backup_database_task():
    """
    Celery task to create database backup, upload to SFTP (if configured),
    and rotate old backups.
    
    Returns:
        dict: Status and information about the backup process
    """
    try:
        # Create database backup
        backup_file = create_database_backup()
        
        # Upload to SFTP if configured
        sftp_enabled = getattr(settings, 'BACKUP_SFTP_ENABLED', False)
        sftp_result = None
        
        if sftp_enabled:
            try:
                sftp_result = upload_backup_to_sftp(backup_file)
            except Exception as e:
                logger.error(f"SFTP upload failed, but local backup was created: {str(e)}")
        
        # Rotate old backups
        max_backups = getattr(settings, 'BACKUP_RETENTION_COUNT', 10)
        deleted_files = rotate_backups(max_backups=max_backups)
        
        return {
            'status': 'success',
            'backup_file': backup_file,
            'sftp_result': sftp_result,
            'deleted_files': deleted_files
        }
        
    except Exception as e:
        logger.error(f"Database backup task failed: {str(e)}")
        return {
            'status': 'failed',
            'error': str(e)
        } 