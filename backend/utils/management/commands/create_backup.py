import os
import argparse
from django.core.management.base import BaseCommand, CommandError
from utils.backup_utils import create_database_backup, upload_backup_to_sftp, ensure_backup_dir

class Command(BaseCommand):
    help = 'Create a manual database backup'

    def add_arguments(self, parser):
        parser.add_argument(
            '--filename',
            type=str,
            help='Custom filename for the backup'
        )
        
        parser.add_argument(
            '--upload',
            action='store_true',
            help='Upload the backup to SFTP server (if configured)'
        )
        
    def handle(self, *args, **options):
        try:
            # Create the backup
            self.stdout.write("Creating database backup...")
            backup_file = create_database_backup(filename=options.get('filename'))
            
            self.stdout.write(self.style.SUCCESS(f"Backup created successfully: {backup_file}"))
            
            # Upload to SFTP if requested
            if options['upload']:
                try:
                    self.stdout.write("Uploading backup to SFTP server...")
                    remote_file = upload_backup_to_sftp(backup_file)
                    self.stdout.write(self.style.SUCCESS(f"Backup uploaded to: {remote_file}"))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error uploading backup to SFTP: {str(e)}"))
                    self.stdout.write(self.style.WARNING("Local backup was created successfully."))
            
        except Exception as e:
            raise CommandError(f"Error creating backup: {str(e)}") 