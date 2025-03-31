import os
from celery import Celery
from celery.schedules import crontab
from django.conf import settings

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecar_backend.settings')

app = Celery('ecar_backend')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')

# Configure the Celery beat schedule
app.conf.beat_schedule = {
    'daily-database-backup': {
        'task': 'utils.backup_task.backup_database_task',
        'schedule': crontab(hour=3, minute=0),  # Run daily at 3:00 AM
        'options': {'expires': 3600}  # Task expires after 1 hour
    },
}

# Optional: set timezone for scheduled tasks
app.conf.timezone = 'UTC' 