#!/usr/bin/env python
import os
import django
from django.contrib.auth.models import User

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecar_backend.settings')
django.setup()

# Check if admin user exists, create if not
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print("Created admin user")
else:
    print("Admin user already exists")

# List all users
print("All users:")
for user in User.objects.all():
    print(f"- {user.username} (staff: {user.is_staff}, active: {user.is_active})")
