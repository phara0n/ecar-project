from rest_framework import serializers
from django.contrib.auth.models import User
from core.models import Customer, Car, Service, ServiceItem, Invoice, Notification
from django.utils.translation import gettext_lazy as _
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
        read_only_fields = ('id', 'username')

class CustomerSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    
    class Meta:
        model = Customer
        fields = ('id', 'user', 'phone', 'address', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user = User.objects.create_user(
            username=user_data.get('email'),
            email=user_data.get('email'),
            first_name=user_data.get('first_name', ''),
            last_name=user_data.get('last_name', ''),
            password=User.objects.make_random_password()  # Generate a random password
        )
        customer = Customer.objects.create(user=user, **validated_data)
        return customer
    
    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            user = instance.user
            user.email = user_data.get('email', user.email)
            user.first_name = user_data.get('first_name', user.first_name)
            user.last_name = user_data.get('last_name', user.last_name)
            user.save()
        
        instance.phone = validated_data.get('phone', instance.phone)
        instance.address = validated_data.get('address', instance.address)
        instance.save()
        return instance

class CarSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Car
        fields = ('id', 'customer', 'customer_name', 'make', 'model', 'year', 'license_plate', 
                 'vin', 'fuel_type', 'mileage', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_customer_name(self, obj):
        return f"{obj.customer.user.first_name} {obj.customer.user.last_name}"

class ServiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceItem
        fields = ('id', 'service', 'item_type', 'name', 'description', 'quantity', 
                 'unit_price', 'total_price')
        read_only_fields = ('id', 'total_price')

class ServiceSerializer(serializers.ModelSerializer):
    car_details = CarSerializer(source='car', read_only=True)
    items = ServiceItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Service
        fields = ('id', 'car', 'car_details', 'title', 'description', 'status', 
                 'scheduled_date', 'completed_date', 'technician_notes', 
                 'created_at', 'updated_at', 'items')
        read_only_fields = ('id', 'created_at', 'updated_at')

class InvoiceSerializer(serializers.ModelSerializer):
    service_details = ServiceSerializer(source='service', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    tax_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Invoice
        fields = ('id', 'service', 'service_details', 'invoice_number', 'issued_date', 
                 'due_date', 'status', 'notes', 'tax_rate', 'pdf_file', 
                 'created_at', 'updated_at', 'subtotal', 'tax_amount', 'total')
        read_only_fields = ('id', 'invoice_number', 'created_at', 'updated_at', 
                           'subtotal', 'tax_amount', 'total')

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'customer', 'title', 'message', 'notification_type', 
                 'is_read', 'created_at')
        read_only_fields = ('id', 'created_at')

# Registration and authentication serializers
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'first_name', 'last_name')
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError(_("Passwords don't match."))
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError(_("New passwords don't match."))
        return data

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom token serializer to include additional user data in the token response
    """
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims to the token
        token['name'] = f"{user.first_name} {user.last_name}"
        token['username'] = user.username
        token['email'] = user.email
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser
        
        # Add any other custom claims that might be useful
        if hasattr(user, 'customer'):
            token['customer_id'] = user.customer.id
        
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add more data to the response
        user = self.user
        
        # Add user information to the response
        data['user'] = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        }
        
        # Add groups if the user belongs to any
        if user.groups.exists():
            data['user']['groups'] = list(user.groups.values_list('name', flat=True))
        
        return data 