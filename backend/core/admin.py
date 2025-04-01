from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.translation import ngettext
from .models import Customer, Car, Service, ServiceItem, Invoice, Notification
from django import forms
from django.contrib.auth.models import User
from django.contrib.admin.widgets import AutocompleteSelect
from django.contrib.admin import site
from django.db import models
from django.utils.safestring import mark_safe
from django.urls import path
from django.http import HttpResponseRedirect
from django.utils import timezone
from django.contrib import messages
from django.shortcuts import render

# Unregister User if already registered (by another app like django.contrib.auth)
if admin.site.is_registered(User):
    admin.site.unregister(User)

# Register User for autocomplete with enhanced configuration
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    search_fields = ['username', 'first_name', 'last_name', 'email']
    list_display = ['username', 'first_name', 'last_name', 'email', 'is_staff']
    list_filter = ['is_staff', 'is_active']

class CustomerForm(forms.ModelForm):
    """Custom form for Customer that directly uses User model for name and email fields"""
    
    class Meta:
        model = Customer
        fields = ['user', 'phone', 'address']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Enhance the user field
        self.fields['user'].widget.attrs.update({
            'class': 'admin-autocomplete',
            'style': 'width: 100%;',
        })
        # Make sure the widget has the correct admin site reference
        self.fields['user'].widget.admin_site = site

class CarInline(admin.TabularInline):
    model = Car
    extra = 0

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    form = CustomerForm
    list_display = ('id', 'get_full_name', 'phone', 'get_email', 'created_at')
    search_fields = ('user__first_name', 'user__last_name', 'user__email', 'phone')
    list_filter = ('created_at',)
    inlines = [CarInline]
    autocomplete_fields = ['user']  # Use Django's built-in autocomplete
    
    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    get_full_name.short_description = _('Full Name')
    
    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = _('Email')
    
    def has_delete_permission(self, request, obj=None):
        """
        Only allow superusers to delete customers.
        Regular admins can't delete customers who have cars.
        """
        if not request.user.is_superuser and obj:
            # Check if customer has any cars
            if Car.objects.filter(customer=obj).exists():
                return False
        return super().has_delete_permission(request, obj)

class ServiceItemInline(admin.TabularInline):
    model = ServiceItem
    extra = 0
    fields = ('name', 'item_type', 'quantity', 'unit_price')
    # Limit the number of items to reduce serialization overhead
    max_num = 10

@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = ('id', 'license_plate', 'make', 'model', 'year', 'get_customer_name')
    list_filter = ('make', 'year', 'fuel_type')
    search_fields = ('license_plate', 'make', 'model', 'vin', 'customer__user__first_name', 'customer__user__last_name')
    autocomplete_fields = ['customer']  # Use autocomplete to prevent recursion
    
    def get_customer_name(self, obj):
        return f"{obj.customer.user.first_name} {obj.customer.user.last_name}"
    get_customer_name.short_description = _('Customer')
    
    def has_delete_permission(self, request, obj=None):
        """
        Only allow superusers to delete cars.
        Regular admins can't delete cars that have services.
        """
        if not request.user.is_superuser and obj:
            # Check if car has any services
            if Service.objects.filter(car=obj).exists():
                return False
        return super().has_delete_permission(request, obj)
    
    def get_form(self, request, obj=None, **kwargs):
        """
        Ensure that cars can be transferred between customers.
        Even non-superusers can change car ownership.
        """
        form = super().get_form(request, obj, **kwargs)
        if not request.user.is_superuser and obj:
            # Ensure the customer field is not disabled
            form.base_fields['customer'].disabled = False
        return form

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'get_car_info', 'status', 'scheduled_date', 'created_at')
    list_filter = ('status', 'scheduled_date', 'created_at')
    search_fields = ('title', 'description', 'car__license_plate', 'car__make', 'car__model')
    inlines = [ServiceItemInline]
    autocomplete_fields = ['car']  # Use autocomplete to prevent recursion
    
    def get_car_info(self, obj):
        return f"{obj.car.make} {obj.car.model} ({obj.car.license_plate})"
    get_car_info.short_description = _('Car')
    
    def has_delete_permission(self, request, obj=None):
        """
        Only allow superusers to delete services.
        Regular admins can't delete services that have service items or invoices.
        """
        if not request.user.is_superuser and obj:
            # Check if service has any service items or invoices
            if ServiceItem.objects.filter(service=obj).exists() or Invoice.objects.filter(service=obj).exists():
                return False
        return super().has_delete_permission(request, obj)

@admin.register(ServiceItem)
class ServiceItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'item_type', 'quantity', 'unit_price', 'total_price', 'get_service_title')
    list_filter = ('item_type',)
    search_fields = ('name', 'description', 'service__title')
    
    def get_service_title(self, obj):
        return obj.service.title
    get_service_title.short_description = _('Service')
    
    def has_delete_permission(self, request, obj=None):
        """
        Only allow superusers to delete service items.
        Regular admins cannot delete service items at all.
        """
        if not request.user.is_superuser:
            return False
        return super().has_delete_permission(request, obj)

class InvoiceForm(forms.ModelForm):
    """Form for Invoice with standard Django widgets"""
    
    class Meta:
        model = Invoice
        fields = ['service', 'due_date', 'status', 'notes']
        # explicitly exclude issued_date as it's non-editable
        exclude = ['issued_date']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        instance = kwargs.get('instance')
        
        # Enhance the service queryset to include car info and filter services without invoices
        services_without_invoice = Service.objects.filter(
            invoice__isnull=True
        ).select_related('car__customer__user').order_by('-created_at')
        
        # If editing an existing invoice, include the current service
        if instance and instance.pk and instance.service:
            self.fields['service'].queryset = Service.objects.filter(
                models.Q(pk=instance.service.pk) | models.Q(id__in=services_without_invoice)
            ).select_related('car__customer__user')
            self.fields['service'].initial = instance.service
            if not self.fields['service'].widget.attrs.get('disabled'):
                self.fields['service'].widget.attrs['disabled'] = 'disabled'
        else:
            self.fields['service'].queryset = services_without_invoice
        
        # Handle refund status
        if instance and instance.pk and instance.status == 'refunded':
            # If status is already refunded, disable changing it
            self.fields['status'].widget.attrs['disabled'] = 'disabled'
            
        if instance and instance.pk and instance.status == 'paid':
            # Allow only 'paid' or 'refunded' statuses for paid invoices
            self.fields['status'].choices = [
                ('paid', _('Paid')),
                ('refunded', _('Refunded'))
            ]
            
    def clean_service(self):
        service = self.cleaned_data.get('service')
        instance = getattr(self, 'instance', None)
        
        # If this is an existing invoice, return the original service
        if instance and instance.pk:
            return instance.service
            
        # For new invoices, check if the service already has an invoice
        if service and Invoice.objects.filter(service=service).exists():
            raise forms.ValidationError(_('This service already has an invoice'))
            
        return service
    
    def clean_status(self):
        """Handle status transitions and refund date"""
        status = self.cleaned_data.get('status')
        instance = getattr(self, 'instance', None)
        
        # If status is changing to refunded, ensure refund fields are set
        if instance and instance.pk and status == 'refunded' and instance.status != 'refunded':
            # Ensure refund_reason is provided
            refund_reason = self.cleaned_data.get('refund_reason')
            if not refund_reason:
                self.add_error('refund_reason', _('Please provide a reason for the refund'))
            
            # Set refund date if not already set
            if not instance.refund_date:
                instance.refund_date = timezone.now().date()
                
            # Set refund amount to total if not provided
            if not instance.refund_amount:
                instance.refund_amount = instance.total
        
        return status

# Instead of using an inline for service items that are linked to service (not invoice)
# we'll use a custom field set to display service items in the admin form
@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    form = InvoiceForm
    list_display = ('id', 'invoice_number', 'get_service_title', 'get_car_info', 'issued_date', 'due_date', 'status', 'total', 'refund_date')
    list_filter = ('status', 'issued_date', 'due_date', 'refund_date')
    search_fields = ('invoice_number', 'service__title', 'service__car__license_plate', 'refund_reason')
    readonly_fields = ('invoice_number', 'subtotal', 'total', 'get_service_items', 'issued_date')
    actions = ['refund_invoices']
    
    fieldsets = (
        (None, {
            'fields': ('service', 'invoice_number', 'issued_date', 'due_date', 'status', 'notes')
        }),
        (_('Financial Information'), {
            'fields': ('subtotal', 'total')
        }),
        (_('Service Items'), {
            'fields': ('get_service_items',),
        }),
        (_('Refund Information'), {
            'fields': ('refund_date', 'refund_amount', 'refund_reason'),
            'classes': ('collapse',),
            'description': _('Complete this section when processing a refund. Set status to "Refunded".')
        }),
    )
    
    def get_service_title(self, obj):
        return obj.service.title
    get_service_title.short_description = _('Service')
    
    def get_car_info(self, obj):
        car = obj.service.car
        return f"{car.make} {car.model} ({car.license_plate})"
    get_car_info.short_description = _('Car')
    
    def get_service_items(self, obj):
        """Display service items as read-only HTML table"""
        if not obj or not obj.service:
            return _('No service selected')
            
        # Get all service items for this service
        items = ServiceItem.objects.filter(service=obj.service)
        if not items:
            return _('No items found for this service')
            
        # Build HTML table to display items
        html = '<table style="width:100%; border-collapse:collapse;">'
        html += '<tr><th style="text-align:left; padding:8px; border-bottom:1px solid #ddd;">Name</th>'
        html += '<th style="text-align:left; padding:8px; border-bottom:1px solid #ddd;">Type</th>'
        html += '<th style="text-align:left; padding:8px; border-bottom:1px solid #ddd;">Quantity</th>'
        html += '<th style="text-align:left; padding:8px; border-bottom:1px solid #ddd;">Unit Price</th>'
        html += '<th style="text-align:left; padding:8px; border-bottom:1px solid #ddd;">Total Price</th></tr>'
        
        for item in items:
            html += f'<tr><td style="padding:8px; border-bottom:1px solid #ddd;">{item.name}</td>'
            html += f'<td style="padding:8px; border-bottom:1px solid #ddd;">{item.get_item_type_display()}</td>'
            html += f'<td style="padding:8px; border-bottom:1px solid #ddd;">{item.quantity}</td>'
            html += f'<td style="padding:8px; border-bottom:1px solid #ddd;">{item.unit_price}</td>'
            html += f'<td style="padding:8px; border-bottom:1px solid #ddd;">{item.total_price}</td></tr>'
            
        html += '</table>'
        return mark_safe(html)  # mark_safe needed to render HTML
    get_service_items.short_description = _('Service Items')
    
    def refund_invoices(self, request, queryset):
        """Action to process refunds for multiple invoices"""
        # Only allow refunding paid invoices
        valid_invoices = queryset.filter(status='paid')
        if not valid_invoices:
            self.message_user(request, _('No valid invoices selected. Only paid invoices can be refunded.'), messages.ERROR)
            return
        
        # Check if any of the selected invoices are already refunded
        refunded = queryset.filter(status='refunded')
        if refunded:
            invoice_numbers = ', '.join([inv.invoice_number for inv in refunded])
            self.message_user(
                request, 
                _('The following invoices are already refunded: %(numbers)s') % {'numbers': invoice_numbers},
                messages.ERROR
            )
            return
            
        # Process refunds
        refund_date = timezone.now().date()
        refund_count = 0
        
        for invoice in valid_invoices:
            invoice.status = 'refunded'
            invoice.refund_date = refund_date
            invoice.refund_amount = invoice.total  # Default to full refund
            invoice.refund_reason = _('Bulk refund processed via admin interface')
            invoice.save()
            refund_count += 1
            
        # Show success message
        self.message_user(
            request, 
            _('Successfully refunded %(count)d invoices.') % {'count': refund_count},
            messages.SUCCESS
        )
    refund_invoices.short_description = _('Process refund for selected invoices')
    
    def get_readonly_fields(self, request, obj=None):
        """Make refund fields read-only for refunded invoices"""
        readonly_fields = list(super().get_readonly_fields(request, obj))
        
        if obj and obj.status == 'refunded':
            # For already refunded invoices, make refund fields read-only
            if 'refund_amount' not in readonly_fields:
                readonly_fields.append('refund_amount')
            if 'refund_reason' not in readonly_fields:
                readonly_fields.append('refund_reason')
            if 'refund_date' not in readonly_fields:
                readonly_fields.append('refund_date')
                
        return readonly_fields
    
    def get_fieldsets(self, request, obj=None):
        """Adjust fieldsets based on invoice status"""
        fieldsets = super().get_fieldsets(request, obj)
        
        # For refunded invoices, don't collapse the refund section
        if obj and obj.status == 'refunded':
            fieldsets = list(fieldsets)
            refund_fieldset = list(fieldsets[3])  # Get the Refund Information fieldset
            refund_fieldset[1] = dict(fieldsets[3][1])  # Copy the original options
            refund_fieldset[1]['classes'] = ()  # Remove 'collapse' class
            fieldsets[3] = tuple(refund_fieldset)  # Put the modified fieldset back
            
        return fieldsets
    
    def save_model(self, request, obj, form, change):
        """Handle status changes and notifications on save"""
        is_new = not obj.pk
        is_refund = False
        
        if not is_new:
            # If changing status to refunded
            old_obj = Invoice.objects.get(pk=obj.pk)
            if old_obj.status != 'refunded' and obj.status == 'refunded':
                is_refund = True
                # Ensure refund date is set
                if not obj.refund_date:
                    obj.refund_date = timezone.now().date()
                # Ensure refund amount is set
                if not obj.refund_amount:
                    obj.refund_amount = obj.total
                    
                # Add a message about the refund
                self.message_user(
                    request,
                    _('Invoice %(number)s has been refunded.') % {'number': obj.invoice_number},
                    messages.SUCCESS
                )
                
        # Save the object
        super().save_model(request, obj, form, change)
        
        # Create refund notification if needed
        if is_refund:
            Notification.objects.create(
                customer=obj.service.car.customer,
                title=_('Invoice Refunded'),
                message=_('Your invoice #%(number)s has been refunded for %(amount)s.') % {
                    'number': obj.invoice_number,
                    'amount': obj.refund_amount or obj.total
                },
                notification_type='invoice'
            )

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'notification_type', 'get_customer_name', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('title', 'message', 'customer__user__first_name', 'customer__user__last_name')
    
    def get_customer_name(self, obj):
        return f"{obj.customer.user.first_name} {obj.customer.user.last_name}"
    get_customer_name.short_description = _('Customer')
