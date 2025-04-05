from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.management import call_command
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Run scheduled tasks for the ECAR Garage Management System'

    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed information about tasks being run',
        )

    def handle(self, *args, **options):
        verbose = options.get('verbose', False)
        self.stdout.write(f"Running scheduled tasks at {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # List of tasks to run
        tasks = [
            {
                'name': 'check_service_history',
                'description': 'Check for services without service history records and create them',
                'args': [],
                'kwargs': {'verbosity': 2 if verbose else 1}
            },
            {
                'name': 'update_service_predictions',
                'description': 'Update service predictions for all cars',
                'args': [],
                'kwargs': {'verbosity': 2 if verbose else 1}
            }
        ]
        
        # Run each task
        for task in tasks:
            self.stdout.write(f"Running task: {task['name']} - {task['description']}")
            
            try:
                # Call the command
                call_command(task['name'], *task['args'], **task['kwargs'])
                self.stdout.write(self.style.SUCCESS(f"Successfully completed task: {task['name']}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error running task {task['name']}: {str(e)}"))
                logger.error(f"Error running scheduled task {task['name']}: {str(e)}")
                
        self.stdout.write(self.style.SUCCESS(f"All scheduled tasks completed at {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}")) 