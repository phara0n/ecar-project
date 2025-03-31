from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Customer, Car, Service, ServiceItem, Invoice, Notification

class CarInline(admin.TabularInline):
    model = Car
    extra = 0

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_full_name', 'phone', 'get_email', 'created_at')
    search_fields = ('user__first_name', 'user__last_name', 'user__email', 'phone')
    list_filter = ('created_at',)
    inlines = [CarInline]
    
    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    get_full_name.short_description = _('Full Name')
    
    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = _('Email')

class ServiceItemInline(admin.TabularInline):
    model = ServiceItem
    extra = 0

@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = ('id', 'license_plate', 'make', 'model', 'year', 'get_customer_name')
    list_filter = ('make', 'year', 'fuel_type')
    search_fields = ('license_plate', 'make', 'model', 'vin', 'customer__user__first_name', 'customer__user__last_name')
    
    def get_customer_name(self, obj):
        return f"{obj.customer.user.first_name} {obj.customer.user.last_name}"
    get_customer_name.short_description = _('Customer')

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'get_car_info', 'status', 'scheduled_date', 'created_at')
    list_filter = ('status', 'scheduled_date', 'created_at')
    search_fields = ('title', 'description', 'car__license_plate', 'car__make', 'car__model')
    inlines = [ServiceItemInline]
    
    def get_car_info(self, obj):
        return f"{obj.car.make} {obj.car.model} ({obj.car.license_plate})"
    get_car_info.short_description = _('Car')

@admin.register(ServiceItem)
class ServiceItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'item_type', 'quantity', 'unit_price', 'total_price', 'get_service_title')
    list_filter = ('item_type',)
    search_fields = ('name', 'description', 'service__title')
    
    def get_service_title(self, obj):
        return obj.service.title
    get_service_title.short_description = _('Service')

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'invoice_number', 'get_service_title', 'issued_date', 'due_date', 'status', 'total')
    list_filter = ('status', 'issued_date', 'due_date')
    search_fields = ('invoice_number', 'service__title', 'service__car__license_plate')
    readonly_fields = ('invoice_number', 'subtotal', 'tax_amount', 'total')
    
    def get_service_title(self, obj):
        return obj.service.title
    get_service_title.short_description = _('Service')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'notification_type', 'get_customer_name', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('title', 'message', 'customer__user__first_name', 'customer__user__last_name')
    
    def get_customer_name(self, obj):
        return f"{obj.customer.user.first_name} {obj.customer.user.last_name}"
    get_customer_name.short_description = _('Customer')
