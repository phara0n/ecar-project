import os
import argparse
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from utils.backup_utils import restore_database_from_backup, ensure_backup_dir

class Command(BaseCommand):
    help = 'Restore database from a backup file'

    def add_arguments(self, parser):
        parser.add_argument(
            'backup_file',
            nargs='?',
            type=str,
            help='Path to the backup file to restore from. If not provided, lists available backups.'
        )
        
        parser.add_argument(
            '--list',
            action='store_true',
            help='List available backup files'
        )
        
    def handle(self, *args, **options):
        # Get the backup directory
        backup_dir = ensure_backup_dir()
        
        # List mode
        if options['list'] or not options['backup_file']:
            self.list_backups(backup_dir)
            return
            
        # Get the backup file
        backup_file = options['backup_file']
        
        # If the backup file doesn't include a full path, assume it's in the backup directory
        if not os.path.isabs(backup_file):
            backup_file = os.path.join(backup_dir, backup_file)
            
        # Check if the file exists
        if not os.path.exists(backup_file):
            raise CommandError(f"Backup file not found: {backup_file}")
            
        # Confirm restore
        self.stdout.write(self.style.WARNING(
            f"Warning: This will replace the current database with the backup from {backup_file}."
        ))
        self.stdout.write(self.style.WARNING(
            "All current data will be lost. This operation cannot be undone."
        ))
        
        confirm = input("Are you sure you want to continue? [y/N] ")
        if confirm.lower() not in ['y', 'yes']:
            self.stdout.write(self.style.SUCCESS("Operation cancelled."))
            return
            
        try:
            # Perform the restore
            self.stdout.write("Restoring database... This may take a while.")
            restore_database_from_backup(backup_file)
            self.stdout.write(self.style.SUCCESS(f"Database successfully restored from {backup_file}"))
        except Exception as e:
            raise CommandError(f"Error restoring database: {str(e)}")
    
    def list_backups(self, backup_dir):
        """List all available backup files"""
        self.stdout.write(self.style.SUCCESS(f"Available backups in {backup_dir}:"))
        
        # Get all backup files
        backup_files = []
        if os.path.exists(backup_dir):
            for file in os.listdir(backup_dir):
                if file.startswith('ecar_db_backup_') and (file.endswith('.sql') or file.endswith('.dump')):
                    file_path = os.path.join(backup_dir, file)
                    backup_files.append((file, os.path.getmtime(file_path)))
        
        # Sort by modification time (newest first)
        backup_files.sort(key=lambda x: x[1], reverse=True)
        
        if not backup_files:
            self.stdout.write("  No backup files found.")
            return
            
        # Print the files
        for i, (file, timestamp) in enumerate(backup_files):
            file_size = os.path.getsize(os.path.join(backup_dir, file)) / (1024 * 1024)  # Size in MB
            date_str = os.path.getctime(os.path.join(backup_dir, file))
            self.stdout.write(f"  {i+1}. {file} ({file_size:.2f} MB) - {date_str}")
            
        self.stdout.write("\nTo restore a backup, run:")
        self.stdout.write(self.style.SUCCESS("  python manage.py restore_backup <backup_file>")) 