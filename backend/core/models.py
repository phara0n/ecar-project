from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
import uuid
from django.db import transaction
import time
import re
import datetime
from django.core.exceptions import ValidationError
from django.db.models import Q
from django.utils import timezone


def validate_license_plate(value):
    """
    Validate license plate format.
    Valid formats:
    - xxxTUxxxx: 3 digits + TU + 1-4 digits
    - RSxxxxx: RS + 1-6 digits
    """
    # Pattern for TU format: 3 digits + TU + 1-4 digits
    tu_pattern = r'^\d{3}TU\d{1,4}$'
    
    # Pattern for RS format: RS + 1-6 digits
    rs_pattern = r'^RS\d{1,6}$'
    
    if not (re.match(tu_pattern, value) or re.match(rs_pattern, value)):
        raise ValidationError(
            _('Invalid license plate format. Must be either xxxTUxxxx (where x are digits) or RSxxxxx (where x are digits).')
        )


class Customer(models.Model):
    """
    Customer model representing garage clients
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer')
    phone = models.CharField(_('Phone Number'), max_length=20)
    address = models.TextField(_('Address'), blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name}"

    class Meta:
        verbose_name = _('Customer')
        verbose_name_plural = _('Customers')
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['phone']),
            models.Index(fields=['created_at']),
        ]


class Car(models.Model):
    """
    Car model representing customer vehicles
    """
    FUEL_CHOICES = [
        ('gasoline', _('Gasoline')),
        ('diesel', _('Diesel')),
        ('electric', _('Electric')),
        ('hybrid', _('Hybrid')),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='cars')
    make = models.CharField(_('Make'), max_length=50)
    model = models.CharField(_('Model'), max_length=50)
    year = models.PositiveIntegerField(_('Year'))
    license_plate = models.CharField(_('License Plate'), max_length=20, unique=True, validators=[validate_license_plate])
    vin = models.CharField(_('VIN'), max_length=17, blank=True, null=True)
    fuel_type = models.CharField(_('Fuel Type'), max_length=10, choices=FUEL_CHOICES, default='gasoline')
    mileage = models.PositiveIntegerField(_('Mileage'), default=0)
    # New fields for service prediction
    average_daily_mileage = models.FloatField(_('Average Daily Mileage (km)'), blank=True, null=True)
    last_service_date = models.DateField(_('Last Service Date'), blank=True, null=True)
    last_service_mileage = models.PositiveIntegerField(_('Last Service Mileage'), blank=True, null=True)
    next_service_date = models.DateField(_('Estimated Next Service Date'), blank=True, null=True)
    next_service_mileage = models.PositiveIntegerField(_('Estimated Next Service Mileage'), blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.make} {self.model} ({self.license_plate})"

    def calculate_next_service_date(self):
        """
        Calculate when the next service is due based on mileage updates, service history and service intervals.
        Returns tuple of (next_service_date, next_service_mileage).
        """
        # Find applicable service intervals for this car
        service_intervals = ServiceInterval.objects.filter(
            Q(car_make=self.make, car_model=self.model) | 
            Q(car_make=self.make, car_model__isnull=True) |
            Q(car_make__isnull=True, car_model__isnull=True),
            is_active=True
        ).order_by('-car_make', '-car_model')
        
        if not service_intervals.exists():
            return None, None
            
        # Use the most specific applicable interval
        service_interval = service_intervals.first()
        
        # Get recent mileage updates to calculate average usage
        mileage_updates = list(MileageUpdate.objects.filter(car=self).order_by('-reported_date')[:10])
        
        if len(mileage_updates) < 2:
            # Not enough data for prediction based on mileage updates
            # Check if we have service history to use instead
            service_history = list(ServiceHistory.objects.filter(car=self).order_by('-service_date')[:5])
            if len(service_history) < 2:
                # Not enough service history either
                return None, None
                
            # Calculate daily mileage rate from service history
            oldest_service = service_history[-1]
            newest_service = service_history[0]
            days_difference = (newest_service.service_date - oldest_service.service_date).days
            if days_difference < 1:
                days_difference = 1  # Avoid division by zero
                
            mileage_difference = newest_service.service_mileage - oldest_service.service_mileage
            daily_mileage_rate = mileage_difference / days_difference
        else:
            # Calculate daily mileage rate from mileage updates
            oldest_update = mileage_updates[-1]
            newest_update = mileage_updates[0]
            days_difference = (newest_update.reported_date - oldest_update.reported_date).days
            
            if days_difference < 1:
                days_difference = 1  # Avoid division by zero
                
            mileage_difference = newest_update.mileage - oldest_update.mileage
            daily_mileage_rate = mileage_difference / days_difference
        
        # Update car's average daily mileage
        self.average_daily_mileage = daily_mileage_rate
        
        # Check if we have service history for this specific interval type
        matching_service_history = ServiceHistory.objects.filter(
            car=self,
            service_interval=service_interval
        ).order_by('-service_date').first()
        
        next_service_date = None
        next_service_mileage = None
        
        # Calculate next service based on the most recent matching service
        if matching_service_history:
            if service_interval.mileage_interval:
                next_service_mileage = matching_service_history.service_mileage + service_interval.mileage_interval
                
            if service_interval.time_interval_days:
                time_based_date = matching_service_history.service_date + datetime.timedelta(days=service_interval.time_interval_days)
                next_service_date = time_based_date
        else:
            # Fall back to last_service data or current data
            # Calculate next service based on mileage interval
            if service_interval.mileage_interval:
                # If car has service history, use last service as base
                if self.last_service_mileage:
                    next_service_mileage = self.last_service_mileage + service_interval.mileage_interval
                else:
                    # Otherwise use current mileage as base
                    next_service_mileage = self.mileage + service_interval.mileage_interval
                    
            # Calculate next service based on time interval
            if service_interval.time_interval_days:
                if self.last_service_date:
                    time_based_date = self.last_service_date + datetime.timedelta(days=service_interval.time_interval_days)
                else:
                    time_based_date = timezone.now().date() + datetime.timedelta(days=service_interval.time_interval_days)
                    
                next_service_date = time_based_date
        
        # For combined interval types, make the calculation work as expected
        if service_interval.interval_type == 'both' and service_interval.mileage_interval and service_interval.time_interval_days:
            # Calculate mileage-based date if we have a next_service_mileage but no next_service_date
            if next_service_mileage and not next_service_date:
                mileage_remaining = next_service_mileage - self.mileage
                days_until_service = mileage_remaining / daily_mileage_rate if daily_mileage_rate > 0 else 365
                mileage_based_date = timezone.now().date() + datetime.timedelta(days=days_until_service)
                next_service_date = mileage_based_date
                
            # Calculate time-based mileage if we have a next_service_date but no next_service_mileage
            elif next_service_date and not next_service_mileage:
                days_until_time_service = (next_service_date - timezone.now().date()).days
                next_service_mileage = self.mileage + (daily_mileage_rate * max(days_until_time_service, 0))
                
            # If we have both, determine which comes first (time or mileage)
            elif next_service_date and next_service_mileage:
                # Calculate when the car will reach the mileage threshold
                mileage_remaining = next_service_mileage - self.mileage
                days_until_mileage_service = mileage_remaining / daily_mileage_rate if daily_mileage_rate > 0 else 365
                mileage_based_date = timezone.now().date() + datetime.timedelta(days=days_until_mileage_service)
                
                # Use the earlier of the two dates
                if mileage_based_date < next_service_date:
                    next_service_date = mileage_based_date
                else:
                    # If time-based service comes first, recalculate the expected mileage
                    days_until_time_service = (next_service_date - timezone.now().date()).days
                    next_service_mileage = self.mileage + (daily_mileage_rate * max(days_until_time_service, 0))
        elif service_interval.interval_type == 'mileage' and next_service_mileage:
            # For mileage-only intervals, calculate the expected date
            mileage_remaining = next_service_mileage - self.mileage
            days_until_service = mileage_remaining / daily_mileage_rate if daily_mileage_rate > 0 else 365
            next_service_date = timezone.now().date() + datetime.timedelta(days=days_until_service)
        elif service_interval.interval_type == 'time' and next_service_date:
            # For time-only intervals, calculate the expected mileage
            days_until_service = (next_service_date - timezone.now().date()).days
            next_service_mileage = self.mileage + (daily_mileage_rate * max(days_until_service, 0))
        
        if next_service_mileage:
            next_service_mileage = int(next_service_mileage)
            
        return next_service_date, next_service_mileage

    def update_service_predictions(self):
        """Update the service predictions for this car and save them to the model"""
        next_date, next_mileage = self.calculate_next_service_date()
        if next_date and next_mileage:
            self.next_service_date = next_date
            self.next_service_mileage = next_mileage
            self.save(update_fields=['next_service_date', 'next_service_mileage', 'average_daily_mileage'])
            return True
        return False

    class Meta:
        verbose_name = _('Car')
        verbose_name_plural = _('Cars')
        indexes = [
            models.Index(fields=['customer']),
            models.Index(fields=['license_plate']),
            models.Index(fields=['vin']),
            models.Index(fields=['make', 'model']),
            models.Index(fields=['year']),
        ]


class ServiceInterval(models.Model):
    """
    Define service intervals for maintenance scheduling based on mileage or time
    """
    INTERVAL_TYPES = [
        ('mileage', _('Mileage Based')),
        ('time', _('Time Based')),
        ('both', _('Mileage and Time Based')),
    ]
    
    name = models.CharField(_('Service Type'), max_length=100)
    description = models.TextField(_('Description'))
    interval_type = models.CharField(_('Interval Type'), max_length=10, choices=INTERVAL_TYPES)
    mileage_interval = models.PositiveIntegerField(_('Mileage Interval (km)'), blank=True, null=True, 
                                                help_text=_('Distance in kilometers between services'))
    time_interval_days = models.PositiveIntegerField(_('Time Interval (days)'), blank=True, null=True,
                                                 help_text=_('Days between services'))
    car_make = models.CharField(_('Car Make'), max_length=50, blank=True, null=True, 
                             help_text=_('Specific car make or leave blank for all makes'))
    car_model = models.CharField(_('Car Model'), max_length=50, blank=True, null=True,
                              help_text=_('Specific car model or leave blank for all models of the make'))
    is_active = models.BooleanField(_('Active'), default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def clean(self):
        """Validate that at least one interval type is provided based on the interval_type"""
        super().clean()
        
        if self.interval_type == 'mileage' and not self.mileage_interval:
            raise ValidationError({
                'mileage_interval': _('Mileage interval is required for mileage-based service intervals')
            })
            
        if self.interval_type == 'time' and not self.time_interval_days:
            raise ValidationError({
                'time_interval_days': _('Time interval is required for time-based service intervals')
            })
            
        if self.interval_type == 'both' and not (self.mileage_interval and self.time_interval_days):
            raise ValidationError({
                'interval_type': _('Both mileage and time intervals must be provided for this interval type')
            })
            
        # If car_model is specified, car_make must also be specified
        if self.car_model and not self.car_make:
            raise ValidationError({
                'car_model': _('You must specify a car make when specifying a car model')
            })
    
    def __str__(self):
        if self.car_make and self.car_model:
            return f"{self.name} - {self.car_make} {self.car_model}"
        elif self.car_make:
            return f"{self.name} - {self.car_make} (All Models)"
        else:
            return f"{self.name} - All Cars"
            
    class Meta:
        verbose_name = _('Service Interval')
        verbose_name_plural = _('Service Intervals')
        indexes = [
            models.Index(fields=['car_make', 'car_model']),
            models.Index(fields=['interval_type']),
            models.Index(fields=['is_active']),
        ]
        ordering = ['name', 'car_make', 'car_model']


class MileageUpdate(models.Model):
    """
    Track periodic mileage updates from car owners
    """
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='mileage_updates')
    mileage = models.PositiveIntegerField(_('Current Mileage'))
    reported_date = models.DateTimeField(_('Reported Date'), auto_now_add=True)
    notes = models.TextField(_('Notes'), blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def clean(self):
        """Ensure mileage is increasing"""
        super().clean()
        
        if self.mileage < self.car.mileage:
            raise ValidationError({
                'mileage': _('Reported mileage ({}) cannot be less than the car\'s current mileage ({})').format(
                    self.mileage, self.car.mileage
                )
            })
        
        previous_update = MileageUpdate.objects.filter(
            car=self.car
        ).exclude(pk=self.pk if self.pk else None).order_by('-reported_date').first()
        
        if previous_update and self.mileage < previous_update.mileage:
            raise ValidationError({
                'mileage': _('Reported mileage ({}) cannot be less than the previous update ({}) from {}').format(
                    self.mileage,
                    previous_update.mileage,
                    previous_update.reported_date.strftime('%Y-%m-%d')
                )
            })
    
    def save(self, *args, **kwargs):
        self.full_clean()
        
        # Update the car's mileage if this update has a higher value
        update_car = False
        if self.mileage > self.car.mileage:
            self.car.mileage = self.mileage
            update_car = True
            
        # Save this mileage update
        super().save(*args, **kwargs)
        
        # After saving, try to update the car's service predictions
        if update_car:
            self.car.save(update_fields=['mileage'])
            # Try to update service predictions
            self.car.update_service_predictions()
            
    def __str__(self):
        return f"{self.car.license_plate} - {self.mileage} km ({self.reported_date.strftime('%Y-%m-%d')})"
        
    class Meta:
        verbose_name = _('Mileage Update')
        verbose_name_plural = _('Mileage Updates')
        indexes = [
            models.Index(fields=['car']),
            models.Index(fields=['reported_date']),
        ]
        ordering = ['-reported_date']


class Service(models.Model):
    """
    Service model representing repairs or maintenance on cars
    """
    STATUS_CHOICES = [
        ('scheduled', _('Scheduled')),
        ('in_progress', _('In Progress')),
        ('completed', _('Completed')),
        ('cancelled', _('Cancelled')),
    ]

    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='services')
    title = models.CharField(_('Service Title'), max_length=100)
    description = models.TextField(_('Description'))
    status = models.CharField(_('Status'), max_length=15, choices=STATUS_CHOICES, default='scheduled')
    scheduled_date = models.DateTimeField(_('Scheduled Date'))
    completed_date = models.DateTimeField(_('Completed Date'), blank=True, null=True)
    technician_notes = models.TextField(_('Technician Notes'), blank=True, null=True)
    service_mileage = models.PositiveIntegerField(_('Service Mileage'), blank=True, null=True, 
                                               help_text=_('The car\'s mileage at the time of service. '
                                                           'Cannot be less than the car\'s registered mileage.'))
    service_type = models.ForeignKey(ServiceInterval, on_delete=models.SET_NULL, 
                                   related_name='services', null=True, blank=True,
                                   help_text=_('The type of service performed, used for future service predictions.'))
    is_routine_maintenance = models.BooleanField(_('Routine Maintenance'), default=False, 
                                              help_text=_('Whether this service should reset the maintenance interval for prediction purposes.'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        """
        Validate that service_mileage is not less than the car's current mileage.
        Also verify that mileage is not less than previous service mileages for the same car.
        """
        super().clean()
        
        if self.service_mileage is not None and self.car:
            # 1. Check service_mileage is not less than car's current mileage
            if self.service_mileage < self.car.mileage:
                raise ValidationError({
                    'service_mileage': _('Service mileage cannot be less than the car\'s current registered mileage ({}).').format(self.car.mileage)
                })
            
            # 2. If this is an update, check for previous services for chronological ordering
            if self.pk:
                # Get the latest service before this one (by scheduled_date)
                previous_service = Service.objects.filter(
                    car=self.car,
                    scheduled_date__lt=self.scheduled_date,
                    service_mileage__isnull=False
                ).exclude(pk=self.pk).order_by('-scheduled_date').first()
                
                if previous_service and previous_service.service_mileage > self.service_mileage:
                    raise ValidationError({
                        'service_mileage': _('Service mileage cannot be less than the previous service mileage ({}) from {}.').format(
                            previous_service.service_mileage,
                            previous_service.scheduled_date.strftime('%Y-%m-%d')
                        )
                    })
                
                # Get the next service after this one (by scheduled_date)
                next_service = Service.objects.filter(
                    car=self.car,
                    scheduled_date__gt=self.scheduled_date,
                    service_mileage__isnull=False
                ).exclude(pk=self.pk).order_by('scheduled_date').first()
                
                if next_service and next_service.service_mileage < self.service_mileage:
                    raise ValidationError({
                        'service_mileage': _('Service mileage cannot be greater than the next service mileage ({}) from {}.').format(
                            next_service.service_mileage,
                            next_service.scheduled_date.strftime('%Y-%m-%d')
                        )
                    })

    def save(self, *args, **kwargs):
        # Call the clean method to validate
        self.full_clean()
        
        # Check if status is being changed to 'completed'
        is_now_completed = False
        status_changed = False
        old_status = None
        
        if self.pk:
            try:
                old_service = Service.objects.get(pk=self.pk)
                old_status = old_service.status
                if old_status != self.status:
                    status_changed = True
            except Service.DoesNotExist:
                pass
                
            if old_status != 'completed' and self.status == 'completed':
                is_now_completed = True
                # Set completed date if not set
                if not self.completed_date:
                    self.completed_date = timezone.now()
                    
                # Update car's mileage if service_mileage is higher
                if self.service_mileage and self.service_mileage > self.car.mileage:
                    self.car.mileage = self.service_mileage
                    self.car.save(update_fields=['mileage'])
                    
                # Only update service history for routine maintenance services
                if self.is_routine_maintenance:
                    # Update the car's last service info
                    self.car.last_service_date = self.completed_date.date()
                    self.car.last_service_mileage = self.service_mileage
                    
                    # If there's a service type, store the interval for future reference
                    if self.service_type:
                        # Log service interval for this service
                        from .models import ServiceHistory
                        ServiceHistory.objects.create(
                            car=self.car,
                            service=self,
                            service_interval=self.service_type,
                            service_date=self.completed_date.date(),
                            service_mileage=self.service_mileage
                        )
                    
                    self.car.save(update_fields=['last_service_date', 'last_service_mileage'])
                    
                    # After completion, recalculate next service prediction
                    self.car.update_service_predictions()
        
        super().save(*args, **kwargs)
        
        # Send notification if service was just completed
        if is_now_completed:
            self._create_completion_notification()
            # Send email notification
            from .utils import send_service_completed_notification
            send_service_completed_notification(self)
            # Send SMS notification
            from utils.sms_utils import send_service_completed_sms
            send_service_completed_sms(self)

    def _create_completion_notification(self):
        """Create a notification when a service is completed"""
        Notification.objects.create(
            customer=self.car.customer,
            title=_('Service Completed'),
            message=_('Your service "{}" has been completed.').format(self.title),
            notification_type='service_update'
        )

    def __str__(self):
        return f"{self.title} - {self.car}"

    class Meta:
        verbose_name = _('Service')
        verbose_name_plural = _('Services')
        indexes = [
            models.Index(fields=['car']),
            models.Index(fields=['status']),
            models.Index(fields=['scheduled_date']),
            models.Index(fields=['completed_date']),
            models.Index(fields=['created_at']),
        ]


class ServiceItem(models.Model):
    """
    Service item model representing individual parts or labor for a service
    """
    TYPE_CHOICES = [
        ('part', _('Part')),
        ('labor', _('Labor')),
    ]

    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='items')
    item_type = models.CharField(_('Type'), max_length=5, choices=TYPE_CHOICES)
    name = models.CharField(_('Name'), max_length=100)
    description = models.TextField(_('Description'), blank=True, null=True)
    quantity = models.PositiveIntegerField(_('Quantity'), default=1)
    unit_price = models.DecimalField(_('Unit Price'), max_digits=10, decimal_places=2)
    
    @property
    def total_price(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return f"{self.name} ({self.get_item_type_display()})"

    class Meta:
        verbose_name = _('Service Item')
        verbose_name_plural = _('Service Items')
        indexes = [
            models.Index(fields=['service']),
            models.Index(fields=['item_type']),
        ]


class Invoice(models.Model):
    """
    Invoice model for tracking payments
    """
    STATUS_CHOICES = [
        ('draft', _('Draft')),
        ('pending', _('Pending')),
        ('paid', _('Paid')),
        ('refunded', _('Refunded')),
        ('cancelled', _('Cancelled')),
    ]

    service = models.OneToOneField(Service, on_delete=models.CASCADE, related_name='invoice')
    invoice_number = models.CharField(_('Invoice Number'), max_length=20, unique=True, editable=False)
    issued_date = models.DateField(_('Issued Date'), auto_now_add=True)
    due_date = models.DateField(_('Due Date'))
    status = models.CharField(_('Status'), max_length=10, choices=STATUS_CHOICES, default='draft')
    notes = models.TextField(_('Notes'), blank=True, null=True)
    pdf_file = models.FileField(_('PDF File'), upload_to='invoices/', blank=True, null=True)
    final_amount = models.DecimalField(_('Final Amount'), max_digits=10, decimal_places=3, blank=True, null=True, 
                                     help_text=_('Custom final amount to be displayed to the customer.'))
    refund_date = models.DateField(_('Refund Date'), blank=True, null=True)
    refund_amount = models.DecimalField(_('Refund Amount'), max_digits=10, decimal_places=2, blank=True, null=True)
    refund_reason = models.TextField(_('Refund Reason'), blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def subtotal(self):
        return sum(item.total_price for item in self.service.items.all())

    @property
    def total(self):
        return self.subtotal

    def save(self, *args, **kwargs):
        # Check if this is a new invoice or status is changing to non-draft
        is_new = not self.pk
        status_changed = False
        old_status = None
        
        if not is_new:
            try:
                old_obj = Invoice.objects.get(pk=self.pk)
                old_status = old_obj.status
                if old_status != self.status:
                    status_changed = True
            except Invoice.DoesNotExist:
                pass
        
        if not self.invoice_number:
            self.invoice_number = f"INV-{uuid.uuid4().hex[:8].upper()}"
        
        # Handle refund status changes
        if status_changed and self.status == 'refunded' and old_status == 'paid':
            # Set refund date if not set
            if not self.refund_date:
                self.refund_date = timezone.now().date()
            
            # Set refund amount if not set (default to full amount)
            if not self.refund_amount:
                self.refund_amount = self.total
        
        # Save the invoice first so it has an ID
        super().save(*args, **kwargs)
        
        # Avoid immediate recursive calls by checking flags
        
        # Use transaction to avoid database inconsistencies
        with transaction.atomic():
            # Removed automatic PDF generation
            
            # If status changed to paid, create a notification
            if self.status == 'paid' and not getattr(self, '_notification_in_progress', False) and status_changed and old_status != 'refunded':
                self._notification_in_progress = True
                try:
                    self._create_invoice_paid_notification()
                finally:
                    self._notification_in_progress = False
            
            # If status changed to refunded, create a refund notification
            if self.status == 'refunded' and not getattr(self, '_refund_notification_in_progress', False) and status_changed:
                self._refund_notification_in_progress = True
                try:
                    self._create_refund_notification()
                finally:
                    self._refund_notification_in_progress = False
            
            # Send email notification for new invoices or status changes
            if (is_new or status_changed) and not getattr(self, '_notifications_in_progress', False):
                self._notifications_in_progress = True
                try:
                    from utils.email_utils import send_invoice_notification
                    send_invoice_notification(self)
                    
                    # Send SMS notification for new invoices
                    if is_new:
                        from utils.sms_utils import send_invoice_sms
                        send_invoice_sms(self)
                except Exception as e:
                    print(f"Error sending notifications: {e}")
                finally:
                    self._notifications_in_progress = False

    def _create_invoice_paid_notification(self):
        """Create a notification when an invoice is paid"""
        Notification.objects.create(
            customer=self.service.car.customer,
            title=_('Invoice Paid'),
            message=_('Your invoice #{} has been marked as paid. Thank you for your business!').format(self.invoice_number),
            notification_type='invoice'
        )
        
    def _create_refund_notification(self):
        """Create a notification when an invoice is refunded"""
        Notification.objects.create(
            customer=self.service.car.customer,
            title=_('Invoice Refunded'),
            message=_('Your invoice #{} has been refunded for {}. If you have any questions, please contact us.').format(
                self.invoice_number, self.refund_amount or self.total
            ),
            notification_type='invoice'
        )

    def __str__(self):
        return self.invoice_number

    class Meta:
        verbose_name = _('Invoice')
        verbose_name_plural = _('Invoices')
        indexes = [
            models.Index(fields=['service']),
            models.Index(fields=['invoice_number']),
            models.Index(fields=['issued_date']),
            models.Index(fields=['due_date']),
            models.Index(fields=['status']),
        ]


class Notification(models.Model):
    """
    Notification model for customer alerts
    """
    TYPE_CHOICES = [
        ('service_reminder', _('Service Reminder')),
        ('service_update', _('Service Update')),
        ('invoice', _('Invoice')),
        ('general', _('General')),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(_('Title'), max_length=100)
    message = models.TextField(_('Message'))
    notification_type = models.CharField(_('Type'), max_length=20, choices=TYPE_CHOICES)
    is_read = models.BooleanField(_('Read'), default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.customer}"

    class Meta:
        verbose_name = _('Notification')
        verbose_name_plural = _('Notifications')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['is_read']),
            models.Index(fields=['created_at']),
        ]


class ServiceHistory(models.Model):
    """
    Model for tracking service history as it relates to service intervals and predictions.
    This helps maintain a clear record of maintenance for prediction purposes.
    """
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='service_history')
    service = models.OneToOneField(Service, on_delete=models.CASCADE, related_name='service_history_record')
    service_interval = models.ForeignKey(ServiceInterval, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='service_history')
    service_date = models.DateField(_('Service Date'))
    service_mileage = models.PositiveIntegerField(_('Service Mileage'))
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        interval_name = self.service_interval.name if self.service_interval else "Unspecified"
        return f"{interval_name} - {self.car} - {self.service_date}"
    
    class Meta:
        verbose_name = _('Service History')
        verbose_name_plural = _('Service History')
        indexes = [
            models.Index(fields=['car']),
            models.Index(fields=['service_date']),
            models.Index(fields=['service_mileage']),
        ]
        ordering = ['-service_date']
