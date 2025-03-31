import os
import datetime
import subprocess
import shutil
import logging
from django.conf import settings

# Configure logger
logger = logging.getLogger(__name__)

def ensure_backup_dir(backup_dir=None):
    """
    Ensure that the backup directory exists.
    
    Args:
        backup_dir (str, optional): The backup directory path. 
                                   If not provided, uses settings.BACKUP_DIR or creates 'backups' in BASE_DIR.
    
    Returns:
        str: The path to the backup directory
    """
    if not backup_dir:
        backup_dir = getattr(settings, 'BACKUP_DIR', os.path.join(settings.BASE_DIR, 'backups'))
    
    os.makedirs(backup_dir, exist_ok=True)
    return backup_dir

def create_database_backup(backup_dir=None, filename=None):
    """
    Create a PostgreSQL database backup.
    
    Args:
        backup_dir (str, optional): Directory to store backup
        filename (str, optional): Custom filename for the backup
    
    Returns:
        str: Path to the backup file
    
    Raises:
        Exception: If backup fails
    """
    # Ensure backup directory exists
    backup_dir = ensure_backup_dir(backup_dir)
    
    # Generate filename if not provided
    if not filename:
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'ecar_db_backup_{timestamp}.sql'
    
    backup_file = os.path.join(backup_dir, filename)
    
    # Get database settings
    db_settings = settings.DATABASES['default']
    db_engine = db_settings['ENGINE']
    
    if 'postgresql' in db_engine:
        # PostgreSQL backup
        cmd = [
            'pg_dump',
            f"--host={db_settings.get('HOST', 'localhost')}",
            f"--port={db_settings.get('PORT', '5432')}",
            f"--username={db_settings.get('USER', '')}",
            f"--dbname={db_settings.get('NAME', '')}",
            '--format=custom',
            f"--file={backup_file}"
        ]
        
        # Set PGPASSWORD environment variable
        env = os.environ.copy()
        env['PGPASSWORD'] = db_settings.get('PASSWORD', '')
        
        # Execute backup command
        try:
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            if result.returncode != 0:
                raise Exception(f"PostgreSQL backup failed: {result.stderr}")
        except Exception as e:
            logger.error(f"Database backup failed: {str(e)}")
            raise
            
    elif 'sqlite3' in db_engine:
        # SQLite backup (simple file copy)
        db_file = db_settings['NAME']
        try:
            shutil.copy2(db_file, backup_file)
        except Exception as e:
            logger.error(f"SQLite backup failed: {str(e)}")
            raise
    else:
        raise Exception(f"Unsupported database engine: {db_engine}")
    
    logger.info(f"Database backup created: {backup_file}")
    return backup_file

def upload_backup_to_sftp(local_file, remote_dir=None, hostname=None, port=None, username=None, password=None):
    """
    Upload a backup file to an SFTP server.
    
    Args:
        local_file (str): Path to the local file
        remote_dir (str, optional): Remote directory on SFTP server
        hostname (str, optional): SFTP hostname
        port (int, optional): SFTP port
        username (str, optional): SFTP username
        password (str, optional): SFTP password
    
    Returns:
        str: Path to the remote file
    
    Raises:
        Exception: If upload fails
    """
    try:
        import paramiko
    except ImportError:
        logger.error("Paramiko library not installed. Cannot upload to SFTP.")
        raise ImportError("Paramiko library required for SFTP uploads. Install with 'pip install paramiko'.")
    
    # Get settings from parameters or settings module
    hostname = hostname or getattr(settings, 'BACKUP_SFTP_HOST', None)
    port = port or getattr(settings, 'BACKUP_SFTP_PORT', 22)
    username = username or getattr(settings, 'BACKUP_SFTP_USER', None)
    password = password or getattr(settings, 'BACKUP_SFTP_PASSWORD', None)
    remote_dir = remote_dir or getattr(settings, 'BACKUP_SFTP_DIRECTORY', '/backups')
    
    if not all([hostname, username, password]):
        raise ValueError("Missing SFTP configuration. Check hostname, username, and password.")
    
    try:
        # Create SSH client
        transport = paramiko.Transport((hostname, port))
        transport.connect(username=username, password=password)
        
        # Create SFTP client
        sftp = paramiko.SFTPClient.from_transport(transport)
        
        # Create remote directory if it doesn't exist
        try:
            sftp.stat(remote_dir)
        except FileNotFoundError:
            sftp.mkdir(remote_dir)
        
        # Upload file
        remote_file = os.path.join(remote_dir, os.path.basename(local_file))
        sftp.put(local_file, remote_file)
        
        # Close connection
        sftp.close()
        transport.close()
        
        logger.info(f"File uploaded to SFTP: {remote_file}")
        return remote_file
        
    except Exception as e:
        logger.error(f"SFTP upload failed: {str(e)}")
        raise Exception(f"SFTP upload failed: {str(e)}")

def rotate_backups(backup_dir=None, max_backups=10):
    """
    Rotate backups by deleting the oldest ones if there are more than max_backups.
    
    Args:
        backup_dir (str, optional): Directory containing backups
        max_backups (int, optional): Maximum number of backups to keep
    
    Returns:
        list: List of files deleted
    """
    backup_dir = ensure_backup_dir(backup_dir)
    
    # Get all backup files
    backup_files = []
    for file in os.listdir(backup_dir):
        if file.startswith('ecar_db_backup_') and (file.endswith('.sql') or file.endswith('.dump')):
            file_path = os.path.join(backup_dir, file)
            backup_files.append((file_path, os.path.getmtime(file_path)))
    
    # Sort by modification time (oldest first)
    backup_files.sort(key=lambda x: x[1])
    
    # Delete oldest files if there are more than max_backups
    files_to_delete = backup_files[:-max_backups] if len(backup_files) > max_backups else []
    deleted_files = []
    
    for file_path, _ in files_to_delete:
        try:
            os.remove(file_path)
            deleted_files.append(file_path)
            logger.info(f"Deleted old backup: {file_path}")
        except Exception as e:
            logger.error(f"Failed to delete backup {file_path}: {str(e)}")
    
    return deleted_files

def restore_database_from_backup(backup_file):
    """
    Restore database from a backup file.
    
    Args:
        backup_file (str): Path to the backup file
    
    Returns:
        bool: True if restore was successful
    
    Raises:
        Exception: If restore fails
    """
    if not os.path.exists(backup_file):
        raise FileNotFoundError(f"Backup file not found: {backup_file}")
    
    # Get database settings
    db_settings = settings.DATABASES['default']
    db_engine = db_settings['ENGINE']
    
    if 'postgresql' in db_engine:
        # PostgreSQL restore
        cmd = [
            'pg_restore',
            f"--host={db_settings.get('HOST', 'localhost')}",
            f"--port={db_settings.get('PORT', '5432')}",
            f"--username={db_settings.get('USER', '')}",
            f"--dbname={db_settings.get('NAME', '')}",
            '--no-owner',
            '--clean',
            backup_file
        ]
        
        # Set PGPASSWORD environment variable
        env = os.environ.copy()
        env['PGPASSWORD'] = db_settings.get('PASSWORD', '')
        
        # Execute restore command
        try:
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            if result.returncode != 0 and "ERROR:" in result.stderr:
                # Filter out warnings from errors
                errors = [line for line in result.stderr.split('\n') if "ERROR:" in line]
                if errors:
                    raise Exception(f"PostgreSQL restore errors: {'; '.join(errors)}")
        except Exception as e:
            logger.error(f"Database restore failed: {str(e)}")
            raise
            
    elif 'sqlite3' in db_engine:
        # SQLite restore (simple file copy)
        db_file = db_settings['NAME']
        try:
            # Create a backup of the current database first
            timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
            bak_file = f"{db_file}.{timestamp}.bak"
            shutil.copy2(db_file, bak_file)
            
            # Restore from backup
            shutil.copy2(backup_file, db_file)
        except Exception as e:
            logger.error(f"SQLite restore failed: {str(e)}")
            raise
    else:
        raise Exception(f"Unsupported database engine: {db_engine}")
    
    logger.info(f"Database restored from: {backup_file}")
    return True
