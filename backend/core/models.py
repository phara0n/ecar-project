from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
import uuid

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
    license_plate = models.CharField(_('License Plate'), max_length=20, unique=True)
    vin = models.CharField(_('VIN'), max_length=17, blank=True, null=True)
    fuel_type = models.CharField(_('Fuel Type'), max_length=10, choices=FUEL_CHOICES, default='gasoline')
    mileage = models.PositiveIntegerField(_('Mileage'), default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.make} {self.model} ({self.license_plate})"

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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Check if status is being changed to 'completed'
        is_now_completed = False
        if self.pk:
            old_status = Service.objects.get(pk=self.pk).status
            if old_status != 'completed' and self.status == 'completed':
                is_now_completed = True
                # Set completed date if not set
                if not self.completed_date:
                    from django.utils import timezone
                    self.completed_date = timezone.now()
        
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
        ('cancelled', _('Cancelled')),
    ]

    service = models.OneToOneField(Service, on_delete=models.CASCADE, related_name='invoice')
    invoice_number = models.CharField(_('Invoice Number'), max_length=20, unique=True, editable=False)
    issued_date = models.DateField(_('Issued Date'), auto_now_add=True)
    due_date = models.DateField(_('Due Date'))
    status = models.CharField(_('Status'), max_length=10, choices=STATUS_CHOICES, default='draft')
    notes = models.TextField(_('Notes'), blank=True, null=True)
    tax_rate = models.DecimalField(_('Tax Rate'), max_digits=5, decimal_places=2, default=19.00)  # Tunisia standard VAT rate
    pdf_file = models.FileField(_('PDF File'), upload_to='invoices/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def subtotal(self):
        return sum(item.total_price for item in self.service.items.all())

    @property
    def tax_amount(self):
        return (self.subtotal * self.tax_rate) / 100

    @property
    def total(self):
        return self.subtotal + self.tax_amount

    def save(self, *args, **kwargs):
        # Check if this is a new invoice or status is changing to non-draft
        is_new = not self.pk
        status_changed = False
        
        if not is_new:
            old_status = Invoice.objects.get(pk=self.pk).status
            if old_status != self.status:
                status_changed = True
        
        if not self.invoice_number:
            self.invoice_number = f"INV-{uuid.uuid4().hex[:8].upper()}"
        
        # Save the invoice first so it has an ID
        super().save(*args, **kwargs)
        
        # Generate PDF if status is not draft or if PDF doesn't exist
        if self.status != 'draft' or not self.pdf_file:
            from utils.pdf_utils import generate_invoice_pdf
            generate_invoice_pdf(self)
            
        # If status changed to paid or completed, create a notification
        if self.status == 'paid' and not hasattr(self, '_status_was_paid'):
            self._create_invoice_notification()
            self._status_was_paid = True
            
        # Send email notification for new invoices or status changes
        if is_new or status_changed:
            from utils.email_utils import send_invoice_notification
            send_invoice_notification(self)
            
            # Send SMS notification for new invoices
            if is_new:
                from utils.sms_utils import send_invoice_sms
                send_invoice_sms(self)

    def _create_invoice_notification(self):
        """Create a notification when an invoice is paid"""
        Notification.objects.create(
            customer=self.service.car.customer,
            title=_('Invoice Paid'),
            message=_('Your invoice #{} has been marked as paid. Thank you for your business!').format(self.invoice_number),
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
