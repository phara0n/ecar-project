from rest_framework import serializers
from django.contrib.auth.models import User
from core.models import Customer, Car, Service, ServiceItem, Invoice, Notification
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from drf_yasg.utils import swagger_serializer_method

# Standard serializers
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']

class CustomerSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    
    class Meta:
        model = Customer
        fields = ['id', 'user', 'phone', 'address', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user = User.objects.create(**user_data)
        customer = Customer.objects.create(user=user, **validated_data)
        return customer
    
    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            user_serializer = UserSerializer(instance.user, data=user_data, partial=True)
            if user_serializer.is_valid():
                user_serializer.save()
        
        instance.phone = validated_data.get('phone', instance.phone)
        instance.address = validated_data.get('address', instance.address)
        instance.save()
        return instance

class CarSerializer(serializers.ModelSerializer):
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(),
        source='customer',
        write_only=True
    )
    customer = CustomerSerializer(read_only=True)
    
    class Meta:
        model = Car
        fields = ['id', 'customer', 'customer_id', 'make', 'model', 'year', 'license_plate', 'vin', 'fuel_type', 'mileage', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class ServiceItemSerializer(serializers.ModelSerializer):
    service = serializers.PrimaryKeyRelatedField(queryset=Service.objects.all())
    
    class Meta:
        model = ServiceItem
        fields = ['id', 'service', 'item_type', 'name', 'description', 'quantity', 'unit_price', 'total_price']
        read_only_fields = ['id', 'total_price']

# Simplified serializers for Swagger documentation
class ServiceItemSwaggerSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceItem
        fields = ('id', 'item_type', 'name', 'description', 'quantity', 
                 'unit_price', 'total_price')
        read_only_fields = ('id', 'total_price')

class CarSwaggerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Car
        fields = ('id', 'make', 'model', 'year', 'license_plate')

# Standard serializers with methods to handle nested serializers for Swagger
class ServiceSerializer(serializers.ModelSerializer):
    car_id = serializers.PrimaryKeyRelatedField(
        queryset=Car.objects.all(),
        source='car',
        write_only=True
    )
    car = CarSerializer(read_only=True)
    service_items = ServiceItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Service
        fields = ['id', 'car', 'car_id', 'title', 'description', 'status', 
                 'scheduled_date', 'completed_date', 'technician_notes', 
                 'service_items', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class InvoiceSerializer(serializers.ModelSerializer):
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        source='service',
        write_only=True
    )
    service = ServiceSerializer(read_only=True)
    
    class Meta:
        model = Invoice
        fields = ['id', 'service', 'service_id', 'invoice_number', 'issued_date', 
                 'due_date', 'status', 'subtotal', 
                 'total', 'notes', 'pdf_file', 'created_at', 'updated_at']
        read_only_fields = ['id', 'invoice_number', 'subtotal', 
                          'total', 'created_at', 'updated_at']

class NotificationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='user',
        write_only=True
    )
    
    class Meta:
        model = Notification
        fields = ['id', 'user', 'user_id', 'title', 'message', 'notification_type', 
                 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']

# Registration and authentication serializers
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    phone = serializers.CharField(required=False, write_only=True)
    address = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'password_confirm', 'email', 'first_name', 'last_name', 'phone', 'address')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        phone = validated_data.pop('phone', '')
        address = validated_data.pop('address', '')
        
        user = User.objects.create_user(**validated_data)
        
        # Create customer profile
        Customer.objects.create(user=user, phone=phone, address=address)
        
        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    confirm_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        token['is_staff'] = user.is_staff
        
        return token 