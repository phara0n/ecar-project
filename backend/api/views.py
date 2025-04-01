from django.shortcuts import render
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.contrib.auth.models import User
from core.models import Customer, Car, Service, ServiceItem, Invoice, Notification
from .serializers import (
    UserSerializer, CustomerSerializer, CarSerializer, 
    ServiceSerializer, ServiceItemSerializer, InvoiceSerializer, 
    NotificationSerializer, UserRegistrationSerializer, ChangePasswordSerializer,
    CustomTokenObtainPairSerializer
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.signals import user_logged_in
from django.utils.translation import gettext_lazy as _
from django.shortcuts import get_object_or_404
from django_ratelimit.decorators import ratelimit
from django.http import HttpResponse
from auditlog.models import LogEntry
from auditlog.registry import auditlog
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_cookie
from django.conf import settings
from utils.sms_utils import send_sms
from django.db.models import Count, Sum, Avg, Q, F
from django.utils import timezone
import csv
from io import StringIO
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.signals import user_logged_in
import logging
from utils.ip import get_client_ip
from django.views.decorators.csrf import csrf_exempt

# Set up logger
logger = logging.getLogger(__name__)

# Register models with auditlog
auditlog.register(Invoice)
auditlog.register(Service)
auditlog.register(ServiceItem)

def ratelimited_error(request, exception):
    """
    View to handle rate limited requests
    """
    return HttpResponse(
        _('Too many requests. Please try again later.'),
        status=429
    )

class IsOwnerOrStaff(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or staff to view/edit it
    """
    def has_object_permission(self, request, view, obj):
        # Staff can do anything
        if request.user.is_staff:
            return True
            
        # For Customer: check if the user is the customer
        if isinstance(obj, Customer):
            return obj.user == request.user
            
        # For Car: check if the user is the car's customer
        if isinstance(obj, Car):
            return obj.customer.user == request.user
            
        # For Service: check if the user is the car's customer
        if isinstance(obj, Service):
            return obj.car.customer.user == request.user
            
        # For ServiceItem: check if the user is the service's car's customer
        if isinstance(obj, ServiceItem):
            return obj.service.car.customer.user == request.user
            
        # For Invoice: check if the user is the service's car's customer
        if isinstance(obj, Invoice):
            return obj.service.car.customer.user == request.user
            
        # For Notification: check if the user is the notification's customer
        if isinstance(obj, Notification):
            return obj.customer.user == request.user
            
        return False

class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user management
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

class CustomerViewSet(viewsets.ModelViewSet):
    """
    API endpoints for managing customers in the ECAR system.
    
    This viewset provides CRUD operations for Customer objects and additional endpoints
    for retrieving customer-specific data such as statistics, service history, and cars.
    Staff users can access all customers while regular users can only access their own profile.
    """
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaff]
    filterset_fields = ['user__email', 'phone', 'address']
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'phone']
    ordering_fields = ['user__last_name', 'user__email', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Filter customers based on user permissions and search parameters.
        Regular users only see their own profile, while staff can see all customers
        and perform searches.
        """
        queryset = Customer.objects.all()
        
        if not self.request.user.is_staff:
            return Customer.objects.filter(user=self.request.user)
            
        # Add search functionality for staff users
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search_query) | 
                Q(user__last_name__icontains=search_query) | 
                Q(user__email__icontains=search_query) | 
                Q(phone__icontains=search_query)
            )
            
        return queryset
    
    @method_decorator(cache_page(settings.CACHE_TTL))
    @method_decorator(vary_on_cookie)
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Retrieve the authenticated user's customer profile.
        
        Returns the complete customer profile for the currently authenticated user.
        This endpoint is cached for performance.
        
        Returns:
            200 OK: Customer profile data
            404 Not Found: If the user doesn't have a customer profile
        """
        try:
            customer = Customer.objects.get(user=request.user)
            serializer = self.get_serializer(customer)
            return Response(serializer.data)
        except Customer.DoesNotExist:
            return Response(
                {"detail": _("Customer profile not found")},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """
        Retrieve statistics for a specific customer.
        
        Returns aggregated statistics about a customer's service history, cars,
        and invoice payment status.
        
        Parameters:
            pk (int): Customer ID
            
        Returns:
            200 OK: Dictionary with the following statistics:
                - total_cars: Number of cars owned by the customer
                - total_services: Total number of services for the customer's cars
                - completed_services: Number of completed services
                - total_amount_spent: Total amount spent on services
                - paid_invoices: Number of paid invoices
                - pending_invoices: Number of pending invoices
                - last_service_date: Date of the most recent service
        """
        customer = self.get_object()
        
        # Calculate statistics
        total_cars = Car.objects.filter(customer=customer).count()
        total_services = Service.objects.filter(car__customer=customer).count()
        completed_services = Service.objects.filter(
            car__customer=customer, 
            status='completed'
        ).count()
        
        # Get invoice data
        invoices = Invoice.objects.filter(service__car__customer=customer)
        total_amount_spent = sum(invoice.total for invoice in invoices)
        paid_invoices = invoices.filter(status='paid').count()
        
        # Calculate last service date
        last_service = Service.objects.filter(
            car__customer=customer
        ).order_by('-scheduled_date').first()
        
        last_service_date = last_service.scheduled_date if last_service else None
        
        statistics = {
            'total_cars': total_cars,
            'total_services': total_services,
            'completed_services': completed_services,
            'total_amount_spent': float(total_amount_spent),
            'paid_invoices': paid_invoices,
            'pending_invoices': invoices.filter(status='pending').count(),
            'last_service_date': last_service_date
        }
        
        return Response(statistics)
    
    @action(detail=True, methods=['get'])
    def service_history(self, request, pk=None):
        """
        Retrieve the complete service history for a customer.
        
        Returns a list of all services performed on all cars owned by the customer,
        ordered by scheduled date (newest first).
        
        Parameters:
            pk (int): Customer ID
            
        Returns:
            200 OK: List of service objects with related data
        """
        customer = self.get_object()
        services = Service.objects.filter(car__customer=customer).order_by('-scheduled_date')
        serializer = ServiceSerializer(services, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def update_address(self, request, pk=None):
        """
        Update a customer's address.
        
        Allows partial update of just the address field without affecting other
        customer data.
        
        Parameters:
            pk (int): Customer ID
            
        Request Body:
            address (string): New address for the customer
            
        Returns:
            200 OK: Updated customer data
            400 Bad Request: If address is missing from the request
        """
        customer = self.get_object()
        address = request.data.get('address', None)
        
        if address is None:
            return Response(
                {"detail": _("Address is required")},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        customer.address = address
        customer.save()
        
        serializer = self.get_serializer(customer)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def cars(self, request, pk=None):
        """
        Get all cars for a customer
        """
        customer = self.get_object()
        cars = Car.objects.filter(customer=customer)
        serializer = CarSerializer(cars, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def bulk_create(self, request):
        """
        Create multiple customers from a CSV file
        Only available to staff users
        """
        if not request.user.is_staff:
            return Response(
                {"detail": _("You do not have permission to perform this action.")},
                status=status.HTTP_403_FORBIDDEN
            )
            
        csv_file = request.FILES.get('file', None)
        if not csv_file:
            return Response(
                {"detail": _("CSV file is required")},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # Process CSV file
            csv_data = csv_file.read().decode('utf-8')
            csv_reader = csv.DictReader(StringIO(csv_data))
            
            created_customers = []
            errors = []
            
            for row in csv_reader:
                try:
                    # Create user
                    username = row.get('email', '')
                    email = row.get('email', '')
                    first_name = row.get('first_name', '')
                    last_name = row.get('last_name', '')
                    phone = row.get('phone', '')
                    address = row.get('address', '')
                    
                    # Skip if username or email is missing
                    if not username or not email:
                        errors.append(f"Missing username or email for row: {row}")
                        continue
                        
                    # Check if user already exists
                    if User.objects.filter(username=username).exists():
                        errors.append(f"User with username {username} already exists")
                        continue
                        
                    # Create user with random password
                    user = User.objects.create_user(
                        username=username,
                        email=email,
                        first_name=first_name,
                        last_name=last_name,
                        password=User.objects.make_random_password()
                    )
                    
                    # Create customer
                    customer = Customer.objects.create(
                        user=user,
                        phone=phone,
                        address=address
                    )
                    
                    created_customers.append(customer)
                    
                except Exception as e:
                    errors.append(f"Error creating customer from row {row}: {str(e)}")
            
            return Response({
                "created_customers": len(created_customers),
                "errors": errors
            })
            
        except Exception as e:
            return Response(
                {"detail": _("Error processing CSV file: {}").format(str(e))},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """
        Export all customers as CSV
        Only available to staff users
        """
        if not request.user.is_staff:
            return Response(
                {"detail": _("You do not have permission to perform this action.")},
                status=status.HTTP_403_FORBIDDEN
            )
            
        customers = Customer.objects.all().select_related('user')
        
        # Create CSV file
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="customers.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['ID', 'Username', 'Email', 'First Name', 'Last Name', 'Phone', 'Address', 'Created At'])
        
        for customer in customers:
            writer.writerow([
                customer.id,
                customer.user.username,
                customer.user.email,
                customer.user.first_name,
                customer.user.last_name,
                customer.phone,
                customer.address,
                customer.created_at
            ])
            
        return response

class CarViewSet(viewsets.ModelViewSet):
    """
    API endpoint for car management
    """
    queryset = Car.objects.all()
    serializer_class = CarSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaff]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return Car.objects.all()
        
        try:
            customer = Customer.objects.get(user=self.request.user)
            return Car.objects.filter(customer=customer)
        except Customer.DoesNotExist:
            return Car.objects.none()
    
    @method_decorator(cache_page(settings.CACHE_TTL))
    @method_decorator(vary_on_cookie)
    @action(detail=True, methods=['get'])
    def services(self, request, pk=None):
        car = self.get_object()
        services = Service.objects.filter(car=car)
        serializer = ServiceSerializer(services, many=True)
        return Response(serializer.data)

class ServiceViewSet(viewsets.ModelViewSet):
    """
    API endpoint for service management
    """
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaff]
    
    def get_queryset(self):
        queryset = Service.objects.all()
        
        if not self.request.user.is_staff:
            try:
                customer = Customer.objects.get(user=self.request.user)
                queryset = queryset.filter(car__customer=customer)
            except Customer.DoesNotExist:
                return Service.objects.none()
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by car
        car_filter = self.request.query_params.get('car', None)
        if car_filter:
            queryset = queryset.filter(car_id=car_filter)
            
        # Filter by date range
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        
        if date_from:
            queryset = queryset.filter(scheduled_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(scheduled_date__lte=date_to)
            
        # Search by title or description
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) | 
                Q(description__icontains=search_query)
            )
            
        # Order by date (newest first by default)
        order_by = self.request.query_params.get('order_by', '-scheduled_date')
        queryset = queryset.order_by(order_by)
            
        return queryset
    
    @method_decorator(cache_page(settings.CACHE_TTL))
    @method_decorator(vary_on_cookie)
    @action(detail=True, methods=['get'])
    def items(self, request, pk=None):
        service = self.get_object()
        items = ServiceItem.objects.filter(service=service)
        serializer = ServiceItemSerializer(items, many=True)
        return Response(serializer.data)
    
    @method_decorator(cache_page(settings.CACHE_TTL))
    @method_decorator(vary_on_cookie)
    @action(detail=True, methods=['get'])
    def invoice(self, request, pk=None):
        service = self.get_object()
        try:
            invoice = Invoice.objects.get(service=service)
            serializer = InvoiceSerializer(invoice)
            return Response(serializer.data)
        except Invoice.DoesNotExist:
            return Response(
                {"detail": _("Invoice not found for this service")},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def send_sms_notification(self, request, pk=None):
        service = self.get_object()
        
        # Only staff can trigger manual SMS notifications
        if not request.user.is_staff:
            return Response(
                {"detail": _("You do not have permission to perform this action.")},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from utils.sms_utils import send_service_completed_sms
        result = send_service_completed_sms(service)
        
        if result.get('status') == 'success':
            return Response({
                "detail": _("SMS notification sent successfully")
            })
        elif result.get('status') == 'skipped':
            return Response({
                "detail": _("SMS notification skipped: {}").format(result.get('message'))
            }, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({
                "detail": _("Failed to send SMS notification: {}").format(result.get('message'))
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Mark a service as completed
        """
        service = self.get_object()
        
        if service.status == 'completed':
            return Response(
                {"detail": _("Service is already marked as completed")},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get notes from request data
        technician_notes = request.data.get('technician_notes', None)
        if technician_notes:
            service.technician_notes = technician_notes
        
        # Update status and completed date
        service.status = 'completed'
        from django.utils import timezone
        service.completed_date = timezone.now()
        service.save()
        
        serializer = self.get_serializer(service)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel a service
        """
        service = self.get_object()
        
        if service.status == 'cancelled':
            return Response(
                {"detail": _("Service is already cancelled")},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if service.status == 'completed':
            return Response(
                {"detail": _("Cannot cancel a completed service")},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get cancellation reason from request data
        reason = request.data.get('reason', None)
        if reason:
            service.technician_notes = f"Cancelled: {reason}"
        
        # Update status
        service.status = 'cancelled'
        service.save()
        
        serializer = self.get_serializer(service)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        """
        Reschedule a service
        """
        service = self.get_object()
        
        # Cannot reschedule completed or cancelled services
        if service.status in ['completed', 'cancelled']:
            return Response(
                {"detail": _("Cannot reschedule a {} service").format(service.status)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get new scheduled date from request data
        new_date = request.data.get('scheduled_date', None)
        if not new_date:
            return Response(
                {"detail": _("New scheduled date is required")},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update scheduled date
        service.scheduled_date = new_date
        service.save()
        
        # Add a note about the reschedule
        old_notes = service.technician_notes or ""
        from django.utils import timezone
        reschedule_note = f"\n[{timezone.now().strftime('%Y-%m-%d %H:%M')}] Service rescheduled to {new_date}."
        service.technician_notes = old_notes + reschedule_note
        service.save()
        
        serializer = self.get_serializer(service)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """
        Get upcoming services (scheduled for the future)
        """
        from django.utils import timezone
        now = timezone.now()
        
        # Start with the base queryset
        queryset = self.get_queryset().filter(
            scheduled_date__gte=now,
            status='scheduled'
        ).order_by('scheduled_date')
        
        # Paginate the response
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def in_progress(self, request):
        """
        Get services that are currently in progress
        """
        queryset = self.get_queryset().filter(status='in_progress').order_by('scheduled_date')
        
        # Paginate the response
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def completed(self, request):
        """
        Get completed services
        """
        queryset = self.get_queryset().filter(status='completed').order_by('-completed_date')
        
        # Paginate the response
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get service statistics
        """
        # Filter queryset based on user permissions
        queryset = self.get_queryset()
        
        # Get counts by status
        scheduled_count = queryset.filter(status='scheduled').count()
        in_progress_count = queryset.filter(status='in_progress').count()
        completed_count = queryset.filter(status='completed').count()
        cancelled_count = queryset.filter(status='cancelled').count()
        
        # Get counts by date ranges
        from django.utils import timezone
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_services = queryset.filter(
            scheduled_date__gte=today_start,
            scheduled_date__lt=today_start + timezone.timedelta(days=1)
        ).count()
        
        this_week_start = today_start - timezone.timedelta(days=now.weekday())
        this_week_services = queryset.filter(
            scheduled_date__gte=this_week_start,
            scheduled_date__lt=this_week_start + timezone.timedelta(days=7)
        ).count()
        
        this_month_start = today_start.replace(day=1)
        this_month_services = queryset.filter(
            scheduled_date__gte=this_month_start,
            scheduled_date__lt=this_month_start + timezone.timedelta(days=31)
        ).count()
        
        statistics = {
            'by_status': {
                'scheduled': scheduled_count,
                'in_progress': in_progress_count,
                'completed': completed_count,
                'cancelled': cancelled_count,
                'total': queryset.count()
            },
            'by_date_range': {
                'today': today_services,
                'this_week': this_week_services,
                'this_month': this_month_services
            }
        }
        
        return Response(statistics)
    
    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def bulk_update(self, request):
        """
        Bulk update services status (admin only)
        """
        if not request.user.is_staff:
            return Response(
                {"detail": _("You do not have permission to perform this action.")},
                status=status.HTTP_403_FORBIDDEN
            )
            
        csv_file = request.FILES.get('file', None)
        if not csv_file:
            return Response(
                {"detail": _("CSV file is required")},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # Process CSV file
            csv_data = csv_file.read().decode('utf-8')
            csv_reader = csv.DictReader(StringIO(csv_data))
            
            updated_services = []
            errors = []
            
            for row in csv_reader:
                try:
                    service_id = row.get('id', None)
                    new_status = row.get('status', None)
                    
                    if not service_id or not new_status:
                        errors.append(f"Missing service ID or status for row: {row}")
                        continue
                    
                    # Check if the service exists
                    try:
                        service = Service.objects.get(id=service_id)
                    except Service.DoesNotExist:
                        errors.append(f"Service with ID {service_id} not found")
                        continue
                    
                    # Validate the status
                    if new_status not in [choice[0] for choice in Service.STATUS_CHOICES]:
                        errors.append(f"Invalid status '{new_status}' for service {service_id}")
                        continue
                    
                    # Update the service
                    service.status = new_status
                    
                    # If status is completed and no completed date, set it
                    if new_status == 'completed' and not service.completed_date:
                        service.completed_date = timezone.now()
                    
                    # Check for notes
                    notes = row.get('technician_notes', None)
                    if notes:
                        service.technician_notes = notes
                    
                    service.save()
                    updated_services.append(service)
                
                except Exception as e:
                    errors.append(f"Error updating service from row {row}: {str(e)}")
            
            return Response({
                "updated_services": len(updated_services),
                "errors": errors
            })
            
        except Exception as e:
            return Response(
                {"detail": _("Error processing CSV file: {}").format(str(e))},
                status=status.HTTP_400_BAD_REQUEST
            )

class ServiceItemViewSet(viewsets.ModelViewSet):
    """
    API endpoint for service item management
    """
    queryset = ServiceItem.objects.all()
    serializer_class = ServiceItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaff]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return ServiceItem.objects.all()
        
        try:
            customer = Customer.objects.get(user=self.request.user)
            return ServiceItem.objects.filter(service__car__customer=customer)
        except Customer.DoesNotExist:
            return ServiceItem.objects.none()

class InvoiceViewSet(viewsets.ModelViewSet):
    """
    API endpoint for invoice management
    """
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaff]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        queryset = Invoice.objects.all()
        
        if not self.request.user.is_staff:
            try:
                customer = Customer.objects.get(user=self.request.user)
                queryset = queryset.filter(service__car__customer=customer)
            except Customer.DoesNotExist:
                return Invoice.objects.none()
                
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        # Filter by date range (issued_date)
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        
        if date_from:
            queryset = queryset.filter(issued_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(issued_date__lte=date_to)
            
        # Filter by service
        service_filter = self.request.query_params.get('service', None)
        if service_filter:
            queryset = queryset.filter(service_id=service_filter)
            
        # Filter by customer (admin only)
        if self.request.user.is_staff:
            customer_filter = self.request.query_params.get('customer', None)
            if customer_filter:
                queryset = queryset.filter(service__car__customer_id=customer_filter)
                
        # Search by invoice number
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(invoice_number__icontains=search_query) | 
                Q(notes__icontains=search_query)
            )
            
        # Order by date (newest first by default)
        order_by = self.request.query_params.get('order_by', '-issued_date')
        queryset = queryset.order_by(order_by)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """
        Create invoice with uploaded PDF
        """
        # Check for PDF file
        pdf_file = request.FILES.get('pdf_file', None)
        
        # Continue with normal creation if we have all required data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Save the PDF file if provided
        if pdf_file and serializer.instance:
            invoice = serializer.instance
            invoice.pdf_file = pdf_file
            invoice.save()
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        """
        Update invoice with optional PDF upload
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Get PDF file if provided
        pdf_file = request.FILES.get('pdf_file', None)
        
        # Update invoice data
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Update PDF file if provided
        if pdf_file:
            instance.pdf_file = pdf_file
            instance.save()
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Download invoice PDF
        """
        invoice = self.get_object()
        
        if invoice.pdf_file:
            from django.http import FileResponse
            return FileResponse(invoice.pdf_file.open('rb'), as_attachment=True, filename=f"invoice_{invoice.invoice_number}.pdf")
        else:
            return Response(
                {"detail": _("PDF not found for this invoice")},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def upload_pdf(self, request, pk=None):
        """
        Upload PDF for an existing invoice
        """
        invoice = self.get_object()
        
        pdf_file = request.FILES.get('pdf_file', None)
        if not pdf_file:
            return Response(
                {"detail": _("PDF file is required")},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Save the PDF file
        invoice.pdf_file = pdf_file
        invoice.save()
        
        serializer = self.get_serializer(invoice)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_paid(self, request, pk=None):
        """
        Mark invoice as paid
        """
        invoice = self.get_object()
        
        if invoice.status == 'paid':
            return Response(
                {"detail": _("Invoice is already marked as paid")},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update status to paid
        invoice.status = 'paid'
        
        # Get payment notes if provided
        payment_notes = request.data.get('payment_notes', None)
        if payment_notes:
            existing_notes = invoice.notes or ""
            invoice.notes = f"{existing_notes}\n\nPayment: {payment_notes}" if existing_notes else f"Payment: {payment_notes}"
        
        invoice.save()
        
        serializer = self.get_serializer(invoice)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def unpaid(self, request):
        """
        Get unpaid invoices (status is pending)
        """
        queryset = self.get_queryset().filter(status='pending')
        
        # Paginate the response
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def paid(self, request):
        """
        Get paid invoices
        """
        queryset = self.get_queryset().filter(status='paid')
        
        # Paginate the response
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get invoice statistics
        """
        # Filter queryset based on user permissions
        queryset = self.get_queryset()
        
        # Get counts by status
        draft_count = queryset.filter(status='draft').count()
        pending_count = queryset.filter(status='pending').count()
        paid_count = queryset.filter(status='paid').count()
        cancelled_count = queryset.filter(status='cancelled').count()
        
        # Calculate total amounts
        from django.db.models import Sum, F
        
        # Note: We're using the calculated property 'total', so we need to handle this in Python
        # This isn't optimal for large datasets but works for our purpose
        total_amount = sum(invoice.total for invoice in queryset)
        total_paid = sum(invoice.total for invoice in queryset.filter(status='paid'))
        total_pending = sum(invoice.total for invoice in queryset.filter(status='pending'))
        
        # Get counts by date ranges
        from django.utils import timezone
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Filter by issued_date for date ranges
        today_invoices = queryset.filter(
            issued_date=today_start.date()
        ).count()
        
        # Get this month's invoices
        this_month_start = today_start.replace(day=1)
        this_month_invoices = queryset.filter(
            issued_date__gte=this_month_start.date(),
            issued_date__lte=now.date()
        ).count()
        
        statistics = {
            'by_status': {
                'draft': draft_count,
                'pending': pending_count,
                'paid': paid_count,
                'cancelled': cancelled_count,
                'total': queryset.count()
            },
            'financials': {
                'total_amount': float(total_amount),
                'total_paid': float(total_paid),
                'total_pending': float(total_pending),
                'average_invoice': float(total_amount / queryset.count()) if queryset.count() > 0 else 0
            },
            'by_date_range': {
                'today': today_invoices,
                'this_month': this_month_invoices
            }
        }
        
        return Response(statistics)
    
    @action(detail=True, methods=['post'])
    def send_sms_notification(self, request, pk=None):
        invoice = self.get_object()
        
        # Only staff can trigger manual SMS notifications
        if not request.user.is_staff:
            return Response(
                {"detail": _("You do not have permission to perform this action.")},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from utils.sms_utils import send_invoice_sms
        result = send_invoice_sms(invoice)
        
        if result.get('status') == 'success':
            return Response({
                "detail": _("SMS notification sent successfully")
            })
        elif result.get('status') == 'skipped':
            return Response({
                "detail": _("SMS notification skipped: {}").format(result.get('message'))
            }, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({
                "detail": _("Failed to send SMS notification: {}").format(result.get('message'))
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def bulk_upload(self, request):
        """
        Upload multiple invoices with PDFs in one request (admin only)
        """
        if not request.user.is_staff:
            return Response(
                {"detail": _("You do not have permission to perform this action.")},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Check for metadata file (CSV with invoice details)
        metadata_file = request.FILES.get('metadata', None)
        if not metadata_file:
            return Response(
                {"detail": _("Metadata CSV file is required")},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for PDFs
        pdf_files = request.FILES.getlist('pdf_files', [])
        if not pdf_files:
            return Response(
                {"detail": _("At least one PDF file is required")},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Process metadata CSV file
            csv_data = metadata_file.read().decode('utf-8')
            csv_reader = csv.DictReader(StringIO(csv_data))
            
            created_invoices = []
            errors = []
            
            for row in csv_reader:
                try:
                    # Extract required fields
                    service_id = row.get('service_id', None)
                    invoice_number = row.get('invoice_number', None)
                    issued_date = row.get('issued_date', None)
                    due_date = row.get('due_date', None)
                    status = row.get('status', 'draft')
                    notes = row.get('notes', '')
                    tax_rate = row.get('tax_rate', 19.00)
                    pdf_filename = row.get('pdf_filename', None)
                    
                    # Validate required fields
                    if not service_id or not invoice_number:
                        errors.append(f"Missing service_id or invoice_number for row: {row}")
                        continue
                    
                    # Validate dates
                    if not issued_date or not due_date:
                        errors.append(f"Missing issued_date or due_date for row: {row}")
                        continue
                    
                    # Find service
                    try:
                        service = Service.objects.get(id=service_id)
                    except Service.DoesNotExist:
                        errors.append(f"Service with ID {service_id} not found")
                        continue
                    
                    # Check if invoice already exists for this service
                    if Invoice.objects.filter(service=service).exists():
                        errors.append(f"Invoice already exists for service ID {service_id}")
                        continue
                    
                    # Create invoice
                    invoice = Invoice.objects.create(
                        service=service,
                        invoice_number=invoice_number,
                        issued_date=issued_date,
                        due_date=due_date,
                        status=status,
                        notes=notes,
                        tax_rate=tax_rate
                    )
                    
                    # Find and attach PDF file if filename is provided
                    if pdf_filename:
                        pdf_found = False
                        for pdf_file in pdf_files:
                            if pdf_file.name == pdf_filename:
                                invoice.pdf_file = pdf_file
                                invoice.save()
                                pdf_found = True
                                break
                        
                        if not pdf_found:
                            errors.append(f"PDF file {pdf_filename} not found for invoice {invoice_number}")
                    
                    created_invoices.append(invoice)
                    
                except Exception as e:
                    errors.append(f"Error creating invoice from row {row}: {str(e)}")
            
            return Response({
                "created_invoices": len(created_invoices),
                "errors": errors
            })
            
        except Exception as e:
            return Response(
                {"detail": _("Error processing CSV file: {}").format(str(e))},
                status=status.HTTP_400_BAD_REQUEST
            )

class NotificationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for notification management
    """
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaff]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return Notification.objects.all()
        
        try:
            customer = Customer.objects.get(user=self.request.user)
            return Notification.objects.filter(customer=customer)
        except Customer.DoesNotExist:
            return Notification.objects.none()
    
    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({"status": "notification marked as read"})
    
    @action(detail=False, methods=['patch'])
    def mark_all_read(self, request):
        notifications = self.get_queryset().filter(is_read=False)
        notifications.update(is_read=True)
        return Response({"status": "all notifications marked as read"})

class RegisterView(generics.CreateAPIView):
    """
    API endpoint for user registration
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    @ratelimit(key='ip', rate='5/h', method='POST', block=True)
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Create customer profile for the new user
        if not hasattr(user, 'customer'):
            customer_data = {
                'user': {
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name
                },
                'phone': request.data.get('phone', ''),
                'address': request.data.get('address', '')
            }
            customer_serializer = CustomerSerializer(data=customer_data)
            if customer_serializer.is_valid():
                customer_serializer.save()
        
        return Response(
            {"detail": _("User registered successfully")},
            status=status.HTTP_201_CREATED
        )

class ChangePasswordView(generics.UpdateAPIView):
    """
    API endpoint for changing password
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @ratelimit(key='user', rate='3/h', method='PUT', block=True)
    @ratelimit(key='user', rate='3/h', method='PATCH', block=True)
    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        if not user.check_password(serializer.data.get('old_password')):
            return Response(
                {"old_password": _("Wrong password")},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(serializer.data.get('new_password'))
        user.save()
        return Response(
            {"detail": _("Password updated successfully")},
            status=status.HTTP_200_OK
        )

# Fix the AttributeError in RateLimitedTokenObtainPairView
class RateLimitedTokenObtainPairView(TokenObtainPairView):
    """
    Custom token view with rate limiting to prevent brute force attacks.
    This view extends the standard JWT token endpoint with rate limiting.
    """
    # Keep the original serializer_class
    serializer_class = CustomTokenObtainPairSerializer
    
    # Add method attribute required by ratelimit
    method = 'POST'  # Required by ratelimit decorator
    
    # Apply rate limiting correctly using method_decorator
    @method_decorator(ratelimit(key='ip', rate='5/m', method='POST'))
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
        
    # Preserve the original post method logic
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        # If login was successful, trigger user_logged_in signal
        if response.status_code == status.HTTP_200_OK and hasattr(self, 'user'):
            user_logged_in.send(sender=self.user.__class__, request=request, user=self.user)
            
            # Log successful login
            logger.info(f"User {self.user.username} successfully logged in from IP {get_client_ip(request)}")
        
        return response

class TokenRefreshEndpoint(TokenRefreshView):
    """
    Custom token refresh endpoint with additional validation and logging.
    Takes a refresh type JSON web token and returns an access type JSON web
    token if the refresh token is valid.
    """
    def post(self, request, *args, **kwargs):
        # Call the parent post method to handle the token refresh
        response = super().post(request, *args, **kwargs)
        
        # If refresh was successful, we can add additional logic here
        if response.status_code == status.HTTP_200_OK:
            # Add user info or custom claims to the response if available
            # This could include permissions, role, etc.
            if hasattr(request, 'user') and request.user.is_authenticated:
                response.data['user_id'] = request.user.id
                response.data['username'] = request.user.username
            
            # Log successful token refresh
            logger.info(f"Token refreshed successfully from IP {get_client_ip(request)}")
        
        return response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def blacklist_token(request):
    """
    Blacklist the refresh token to logout a user
    """
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        token = RefreshToken(refresh_token)
        token.blacklist()
        
        # Log successful logout
        logger.info(f"User {request.user.username} successfully logged out from IP {get_client_ip(request)}")
        
        return Response({"detail": "Successfully logged out"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_token(request):
    """
    Test endpoint to verify that a token is valid and working.
    """
    user = request.user
    data = {
        'message': 'Token is valid',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        }
    }
    
    # Add groups if the user belongs to any
    if user.groups.exists():
        data['user']['groups'] = list(user.groups.values_list('name', flat=True))
    
    return Response(data)

@api_view(['GET'])
@csrf_exempt
def get_user_data(request, user_id):
    """
    Simple endpoint to get user data for admin forms.
    This is designed to be called from the admin interface.
    """
    # Special permission handling - either the user is staff or they're in the admin interface
    if not request.user.is_staff and '/admin/' not in request.META.get('HTTP_REFERER', ''):
        return Response({"detail": "You do not have permission to perform this action."}, 
                      status=status.HTTP_403_FORBIDDEN)
    
    user = get_object_or_404(User, pk=user_id)
    return Response({
        'id': user.id,
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
    })
