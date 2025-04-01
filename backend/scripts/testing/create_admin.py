#!/usr/bin/env python
"""
Create Admin User Script
-----------------------
Uses Django's management commands to create a superuser directly
"""

import os
import sys
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecar_backend.settings')
django.setup()

from django.contrib.auth.models import User

def create_superuser():
    # Check if superuser exists
    if User.objects.filter(username='admin').exists():
        print("Admin user already exists")
        return
    
    # Create superuser
    User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='admin123'
    )
    print("Created admin user successfully")

if __name__ == "__main__":
    create_superuser()
    
    # List all users for verification
    print("\nAll users in the system:")
    for user in User.objects.all():
        print(f"- {user.username} (staff: {user.is_staff}, active: {user.is_active})") 