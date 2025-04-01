"""
Simplified serializers for Swagger documentation.
These serializers are used only for documentation purposes and avoid deep nesting.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from core.models import Customer, Car, Service, ServiceItem, Invoice, Notification

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ('id', 'phone', 'address', 'created_at', 'updated_at')

class CarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Car
        fields = ('id', 'make', 'model', 'year', 'license_plate', 'vin', 'fuel_type', 'mileage')

class ServiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceItem
        fields = ('id', 'item_type', 'name', 'description', 'quantity', 'unit_price', 'total_price')

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ('id', 'title', 'description', 'status', 'scheduled_date', 'completed_date', 'technician_notes')

class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ('id', 'invoice_number', 'issued_date', 'due_date', 'status', 'notes', 'tax_rate')

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'title', 'message', 'notification_type', 'is_read', 'created_at') 