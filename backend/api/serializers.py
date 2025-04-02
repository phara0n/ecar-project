from rest_framework import serializers
from django.contrib.auth.models import User
from core.models import Customer, Car, Service, ServiceItem, Invoice, Notification, ServiceInterval, MileageUpdate, ServiceHistory
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from drf_yasg.utils import swagger_serializer_method
from django.utils.translation import gettext_lazy as _

# Standard serializers
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']
        ref_name = 'UserFull'

class CustomerSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    
    class Meta:
        model = Customer
        fields = ['id', 'user', 'phone', 'address', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
        ref_name = 'CustomerFull'
    
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
        fields = ['id', 'customer', 'customer_id', 'make', 'model', 'year', 'license_plate', 
                 'vin', 'fuel_type', 'mileage', 'average_daily_mileage', 'last_service_date', 
                 'last_service_mileage', 'next_service_date', 'next_service_mileage', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'average_daily_mileage', 
                           'next_service_date', 'next_service_mileage']
        ref_name = 'CarFull'
        extra_kwargs = {
            'license_plate': {
                'error_messages': {
                    'invalid': _('Invalid license plate format. Must be either xxxTUxxxx (where x are digits) or RSxxxxx (where x are 1-6 digits).'),
                }
            }
        }
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request', None)
        
        # If this is an update operation (instance exists) and user is not a superuser
        if self.instance and request and not request.user.is_superuser:
            # Make mileage read-only
            self.fields['mileage'].read_only = True

class ServiceItemSerializer(serializers.ModelSerializer):
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        source='service',
        write_only=True
    )
    total_price = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = ServiceItem
        fields = ['id', 'service', 'service_id', 'item_type', 'name', 'description', 'quantity', 'unit_price', 
                 'total_price']
        read_only_fields = ['id', 'total_price']
        ref_name = 'ServiceItemFull'
    
    def get_total_price(self, obj):
        return obj.total_price
        
    def validate(self, data):
        # No need to modify data here, total_price is calculated by the model property
        return data

class ServiceIntervalSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceInterval
        fields = ['id', 'name', 'description', 'interval_type', 'mileage_interval', 
                 'time_interval_days', 'car_make', 'car_model', 'is_active', 
                 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
        ref_name = 'ServiceIntervalFull'
        
    def validate(self, data):
        """Validate interval configuration based on interval_type"""
        interval_type = data.get('interval_type')
        mileage_interval = data.get('mileage_interval')
        time_interval_days = data.get('time_interval_days')
        car_make = data.get('car_make')
        car_model = data.get('car_model')
        
        # Validate interval type requirements
        if interval_type == 'mileage' and not mileage_interval:
            raise serializers.ValidationError({
                'mileage_interval': _('Mileage interval is required for mileage-based service intervals')
            })
            
        if interval_type == 'time' and not time_interval_days:
            raise serializers.ValidationError({
                'time_interval_days': _('Time interval is required for time-based service intervals')
            })
            
        if interval_type == 'both' and not (mileage_interval and time_interval_days):
            raise serializers.ValidationError({
                'interval_type': _('Both mileage and time intervals must be provided for this interval type')
            })
            
        # If car_model is specified, car_make must also be specified
        if car_model and not car_make:
            raise serializers.ValidationError({
                'car_model': _('You must specify a car make when specifying a car model')
            })
            
        return data

class ServiceSerializer(serializers.ModelSerializer):
    car_id = serializers.PrimaryKeyRelatedField(
        queryset=Car.objects.all(),
        source='car',
        write_only=True
    )
    car = CarSerializer(read_only=True)
    service_items = ServiceItemSerializer(many=True, read_only=True, source='items')
    service_type_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceInterval.objects.all(),
        source='service_type',
        write_only=True,
        required=False
    )
    service_type = ServiceIntervalSerializer(read_only=True)
    
    class Meta:
        model = Service
        fields = ['id', 'car', 'car_id', 'title', 'description', 'status', 
                 'scheduled_date', 'completed_date', 'technician_notes', 
                 'service_mileage', 'service_type', 'service_type_id', 'is_routine_maintenance',
                 'service_items', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
        ref_name = 'ServiceFull'

    def validate_service_mileage(self, value):
        """
        Validate that service_mileage follows the rules:
        1. Can't be less than the car's current mileage
        2. Must respect chronological order with other services
        """
        if not value:  # If value is None or 0, skip validation
            return value
            
        car = self.context.get('car') or (self.instance.car if self.instance else None)
        if not car and 'car' in self.initial_data:
            # For creation, get the car from the input data
            car_id = self.initial_data.get('car_id')
            if car_id:
                try:
                    from core.models import Car
                    car = Car.objects.get(pk=car_id)
                except (Car.DoesNotExist, ValueError):
                    pass
                    
        if car and value < car.mileage:
            raise serializers.ValidationError(
                _('Service mileage cannot be less than the car\'s current registered mileage ({}).').format(car.mileage)
            )
            
        return value
        
    def create(self, validated_data):
        """
        Auto-populate service_mileage from car's mileage when creating a new service if not already set.
        """
        # If service_mileage is not provided but we have a car, use the car's mileage
        if 'service_mileage' not in validated_data and 'car' in validated_data:
            car = validated_data['car']
            validated_data['service_mileage'] = car.mileage
            
        return super().create(validated_data)
        
    def update(self, instance, validated_data):
        """
        When updating a service to 'completed' status, update the car's mileage if needed
        and create service history record if it's routine maintenance.
        """
        old_status = instance.status
        new_status = validated_data.get('status', old_status)
        
        # If changing to 'completed' status
        if old_status != 'completed' and new_status == 'completed':
            service_mileage = validated_data.get('service_mileage', instance.service_mileage)
            
            # If service mileage is set and is greater than the car's mileage, update the car
            if service_mileage and service_mileage > instance.car.mileage:
                instance.car.mileage = service_mileage
                instance.car.save(update_fields=['mileage'])
                
        # Call parent implementation
        service = super().update(instance, validated_data)
        
        # If service is now completed and routine maintenance is enabled,
        # make sure service history and predictions are updated
        if service.status == 'completed' and service.is_routine_maintenance:
            # Service history will be created in the model's save method
            if service.service_type and not hasattr(service, 'service_history_record'):
                from core.models import ServiceHistory
                try:
                    service_history = ServiceHistory.objects.create(
                        car=service.car,
                        service=service,
                        service_interval=service.service_type,
                        service_date=service.completed_date.date(),
                        service_mileage=service.service_mileage
                    )
                except Exception as e:
                    # Log error but don't fail the update
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error creating service history: {str(e)}")
            
            # Update service predictions for the car
            service.car.update_service_predictions()
                
        return service

class InvoiceSerializer(serializers.ModelSerializer):
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        source='service',
        write_only=True
    )
    # Use a simpler representation of service to avoid circular references
    service = serializers.SerializerMethodField(read_only=True)
    
    def get_service(self, invoice):
        service = invoice.service
        return {
            'id': service.id,
            'title': service.title,
            'description': service.description,
            'status': service.status,
            'car': {
                'id': service.car.id,
                'make': service.car.make,
                'model': service.car.model,
                'license_plate': service.car.license_plate
            }
        }
    
    class Meta:
        model = Invoice
        fields = ['id', 'service', 'service_id', 'invoice_number', 'issued_date', 
                 'due_date', 'status', 'subtotal', 'total', 'final_amount', 'notes', 'pdf_file', 
                 'refund_date', 'refund_amount', 'refund_reason',
                 'created_at', 'updated_at']
        read_only_fields = ['id', 'invoice_number', 'subtotal', 'total', 
                           'created_at', 'updated_at']
        ref_name = 'InvoiceFull'

class RefundRequestSerializer(serializers.Serializer):
    refund_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False,
                                           help_text="Amount to be refunded (defaults to full invoice amount if not specified)")
    refund_reason = serializers.CharField(required=True, 
                                        help_text="Reason for the refund")
    class Meta:
        ref_name = 'RefundRequestForm'

class NotificationSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(),
        source='customer',
        write_only=True
    )
    
    class Meta:
        model = Notification
        fields = ['id', 'customer', 'customer_id', 'title', 'message', 'notification_type', 
                 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']
        ref_name = 'NotificationFull'

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
        ref_name = 'UserRegistration'

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

    class Meta:
        ref_name = 'ChangePassword'

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

    class Meta:
        ref_name = 'TokenObtainPair'

class MileageUpdateSerializer(serializers.ModelSerializer):
    car_id = serializers.PrimaryKeyRelatedField(
        queryset=Car.objects.all(),
        source='car',
        write_only=True,
        required=False
    )
    car = CarSerializer(read_only=True)
    
    class Meta:
        model = MileageUpdate
        fields = ['id', 'car', 'car_id', 'mileage', 'notes', 'reported_date', 'created_at']
        read_only_fields = ['id', 'reported_date', 'created_at']
        ref_name = 'MileageUpdateFull'
        
    def validate_mileage(self, value):
        """
        Validate that mileage follows the rules:
        1. Can't be less than the car's current mileage
        2. Can't be less than the previous mileage update
        """
        car = self.context.get('car')
        if not car:
            car = self.instance.car if self.instance else None
            
        if car and value < car.mileage:
            raise serializers.ValidationError(
                _('Reported mileage ({}) cannot be less than the car\'s current mileage ({})').format(
                    value, car.mileage
                )
            )
            
        # Check for previous updates
        if car:
            previous_update = MileageUpdate.objects.filter(
                car=car
            ).order_by('-reported_date').first()
            
            if previous_update and value < previous_update.mileage:
                raise serializers.ValidationError(
                    _('Reported mileage ({}) cannot be less than the previous update ({}) from {}').format(
                        value,
                        previous_update.mileage,
                        previous_update.reported_date.strftime('%Y-%m-%d')
                    )
                )
                
        return value
        
    def create(self, validated_data):
        """Create a mileage update and recalculate service predictions"""
        mileage_update = super().create(validated_data)
        
        # Update car predictions if mileage changed
        car = mileage_update.car
        if car.mileage == mileage_update.mileage:
            car.update_service_predictions()
            
        return mileage_update

class ServicePredictionSerializer(serializers.Serializer):
    """Serializer for service prediction results"""
    has_prediction = serializers.BooleanField()
    next_service_date = serializers.DateField(required=False, allow_null=True)
    next_service_mileage = serializers.IntegerField(required=False, allow_null=True)
    days_until_service = serializers.IntegerField(required=False, allow_null=True)
    mileage_until_service = serializers.IntegerField(required=False, allow_null=True)
    average_daily_mileage = serializers.FloatField(required=False, allow_null=True)
    service_type = serializers.CharField(required=False, allow_null=True)
    service_description = serializers.CharField(required=False, allow_null=True)
    
    class Meta:
        ref_name = 'ServicePredictionResult'

class ServiceHistorySerializer(serializers.ModelSerializer):
    car = CarSerializer(read_only=True)
    car_id = serializers.PrimaryKeyRelatedField(
        queryset=Car.objects.all(),
        source='car',
        write_only=True
    )
    service = ServiceSerializer(read_only=True)
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        source='service',
        write_only=True
    )
    service_interval = ServiceIntervalSerializer(read_only=True)
    service_interval_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceInterval.objects.all(),
        source='service_interval',
        write_only=True,
        required=False
    )
    
    class Meta:
        model = ServiceHistory
        fields = ['id', 'car', 'car_id', 'service', 'service_id', 'service_interval', 
                 'service_interval_id', 'service_date', 'service_mileage', 'created_at']
        read_only_fields = ['id', 'created_at']
        ref_name = 'ServiceHistoryFull' 