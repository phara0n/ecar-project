"""
Simplified serializers for Swagger documentation.
These serializers are used only for documentation purposes and avoid deep nesting.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from core.models import Customer, Car, Service, ServiceItem, Invoice, Notification, ServiceInterval, ServiceHistory, MileageUpdate

class UserDocsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
        ref_name = 'UserDocs'

class CustomerDocsSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = Customer
        fields = ('id', 'user', 'phone', 'address')
        ref_name = 'CustomerDocs'

class CarDocsSerializer(serializers.ModelSerializer):
    customer = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = Car
        fields = ('id', 'customer', 'make', 'model', 'year', 'license_plate', 
                 'vin', 'fuel_type', 'mileage')
        ref_name = 'CarDocs'

class ServiceItemDocsSerializer(serializers.ModelSerializer):
    service = serializers.PrimaryKeyRelatedField(read_only=True)
    total_price = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = ServiceItem
        fields = ('id', 'service', 'item_type', 'name', 'description', 'quantity', 'unit_price', 'total_price')
        ref_name = 'ServiceItemDocs'
        
    def get_total_price(self, obj):
        return obj.total_price

class ServiceIntervalDocsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceInterval
        fields = ('id', 'name', 'description', 'interval_type', 'mileage_interval', 
                 'time_interval_days', 'car_make', 'car_model', 'is_active')
        ref_name = 'ServiceIntervalDocs'

class ServiceDocsSerializer(serializers.ModelSerializer):
    car = serializers.PrimaryKeyRelatedField(read_only=True)
    service_type = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = Service
        fields = ('id', 'car', 'title', 'description', 'status', 
                 'scheduled_date', 'completed_date', 'technician_notes',
                 'service_mileage', 'service_type', 'is_routine_maintenance')
        ref_name = 'ServiceDocs'

class InvoiceDocsSerializer(serializers.ModelSerializer):
    service = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = Invoice
        fields = ('id', 'service', 'invoice_number', 'issued_date', 'due_date', 
                 'status', 'subtotal', 'total', 'final_amount', 'notes')
        ref_name = 'InvoiceDocs'

class NotificationDocsSerializer(serializers.ModelSerializer):
    customer = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = Notification
        fields = ('id', 'customer', 'title', 'message', 'notification_type', 'is_read')
        ref_name = 'NotificationDocs'

class MileageUpdateDocsSerializer(serializers.ModelSerializer):
    car = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = MileageUpdate
        fields = ('id', 'car', 'mileage', 'notes', 'reported_date')
        ref_name = 'MileageUpdateDocs'

class ServiceHistoryDocsSerializer(serializers.ModelSerializer):
    car = serializers.PrimaryKeyRelatedField(read_only=True)
    service = serializers.PrimaryKeyRelatedField(read_only=True)
    service_interval = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = ServiceHistory
        fields = ('id', 'car', 'service', 'service_interval',
                 'service_date', 'service_mileage')
        ref_name = 'ServiceHistoryDocs' 