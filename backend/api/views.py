from django.shortcuts import render, get_object_or_404, redirect
from rest_framework import viewsets, permissions, status, generics, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.contrib.auth.models import User
from django.db.models import Q, Sum, F, DecimalField, Case, When
from django.db.models.functions import Coalesce
from core.models import Customer, Car, Service, ServiceItem, Invoice, Notification, ServiceInterval, MileageUpdate, ServiceHistory
from .serializers import (
    UserSerializer, CustomerSerializer, CarSerializer, 
    ServiceSerializer, ServiceItemSerializer, InvoiceSerializer, 
    NotificationSerializer, UserRegistrationSerializer, ChangePasswordSerializer,
    CustomTokenObtainPairSerializer, RefundRequestSerializer, MileageUpdateSerializer,
    ServiceIntervalSerializer, ServicePredictionSerializer, ServiceHistorySerializer
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_cookie
from django.views.decorators.http import require_GET, require_http_methods
from django.contrib.auth import authenticate, login, logout
from django.http import HttpResponseRedirect, HttpResponse
from django.urls import reverse
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
import logging
import csv
import datetime
from io import StringIO
from drf_yasg.utils import swagger_auto_schema, no_body
from drf_yasg import openapi
from auditlog.registry import auditlog

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
    API endpoint that allows users to be viewed or edited.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_serializer_class(self):
        if getattr(self, 'swagger_fake_view', False):
            from .swagger_schemas import UserDocsSerializer
            return UserDocsSerializer
        return self.serializer_class
    
    @swagger_auto_schema(tags=['users'])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
        
    @swagger_auto_schema(tags=['users'])
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
        
    @swagger_auto_schema(tags=['users'])
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
        
    @swagger_auto_schema(tags=['users'])
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
        
    @swagger_auto_schema(tags=['users'])
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
        
    @swagger_auto_schema(tags=['users'])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

class CustomerViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows customers to be viewed or edited.
    Users can only view and edit their own customer profile.
    """
    serializer_class = CustomerSerializer  
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if getattr(self, 'swagger_fake_view', False):
            from .swagger_schemas import CustomerDocsSerializer
            return CustomerDocsSerializer
        return self.serializer_class
    
    queryset = Customer.objects.all()
    filterset_fields = ['user__email', 'phone', 'address']
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'phone']
    ordering_fields = ['user__last_name', 'user__email', 'created_at']
    ordering = ['-created_at']
    
    @swagger_auto_schema(tags=['customers'])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
        
    @swagger_auto_schema(tags=['customers'])
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
        
    @swagger_auto_schema(tags=['customers'])
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
        
    @swagger_auto_schema(tags=['customers'])
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
        
    @swagger_auto_schema(tags=['customers'])
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
        
    @swagger_auto_schema(tags=['customers'])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    
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
    @swagger_auto_schema(
        operation_summary="Get current customer profile",
        operation_description="Retrieve the authenticated user's customer profile",
        tags=['customers']
    )
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
    @swagger_auto_schema(
        operation_summary="Get customer statistics",
        operation_description="Retrieve aggregated statistics about a customer's service history, cars, and invoices",
        tags=['customers']
    )
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
        customer = self.get_object()
        cars = Car.objects.filter(customer=customer)
        serializer = CarSerializer(cars, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
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
    API endpoint that allows cars to be viewed or edited.
    Users can only view and edit their own cars.
    """
    serializer_class = CarSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['make', 'model', 'year', 'license_plate', 'fuel_type']
    search_fields = ['make', 'model', 'year', 'license_plate', 'vin']
    ordering_fields = ['make', 'model', 'year', 'license_plate']
    
    def get_serializer_class(self):
        if getattr(self, 'swagger_fake_view', False):
            from .swagger_schemas import CarDocsSerializer
            return CarDocsSerializer
        return self.serializer_class
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return Car.objects.all()
        
        try:
            customer = Customer.objects.get(user=self.request.user)
            return Car.objects.filter(customer=customer)
        except Customer.DoesNotExist:
            return Car.objects.none()
    
    @action(detail=True, methods=['get'])
    def services(self, request, pk=None):
        car = self.get_object()
        services = Service.objects.filter(car=car)
        serializer = ServiceSerializer(services, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    @swagger_auto_schema(
        request_body=MileageUpdateSerializer,
        operation_summary="Report current mileage",
        operation_description="Car owners can report their current mileage",
        tags=['vehicles']
    )
    def report_mileage(self, request, pk=None):
        """
        Allow car owners to report their current mileage.
        Updates the car's mileage record and recalculates next service date.
        """
        car = self.get_object()
        serializer = MileageUpdateSerializer(data=request.data, context={'car': car})
        
        if serializer.is_valid():
            mileage_update = serializer.save(car=car)
            
            # Return the updated car with service predictions
            car_serializer = self.get_serializer(car)
            return Response(car_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    @swagger_auto_schema(
        operation_summary="Get next service prediction",
        operation_description="Get estimated next service date and mileage",
        responses={200: ServicePredictionSerializer},
        tags=['vehicles']
    )
    def next_service_prediction(self, request, pk=None):
        """
        Get prediction for when the next service will be due based on 
        mileage history and service intervals.
        """
        car = self.get_object()
        # Recalculate predictions
        next_service_date, next_service_mileage = car.calculate_next_service_date()
        
        # If we can't calculate a prediction due to insufficient data
        if not next_service_date or not next_service_mileage:
            return Response(ServicePredictionSerializer({
                "has_prediction": False,
                "next_service_date": None,
                "next_service_mileage": None,
                "days_until_service": None,
                "mileage_until_service": None,
                "average_daily_mileage": car.average_daily_mileage,
                "service_type": None,
                "service_description": None
            }).data)
        
        # Find applicable service intervals for this car
        service_intervals = ServiceInterval.objects.filter(
            Q(car_make=car.make, car_model=car.model) | 
            Q(car_make=car.make, car_model__isnull=True) |
            Q(car_make__isnull=True, car_model__isnull=True),
            is_active=True
        ).order_by('-car_make', '-car_model')
        
        service_interval = service_intervals.first() if service_intervals.exists() else None
        
        days_until_service = (next_service_date - timezone.now().date()).days
        mileage_until_service = next_service_mileage - car.mileage
        
        return Response(ServicePredictionSerializer({
            "has_prediction": True,
            "next_service_date": next_service_date,
            "next_service_mileage": next_service_mileage,
            "days_until_service": days_until_service,
            "mileage_until_service": mileage_until_service,
            "average_daily_mileage": car.average_daily_mileage,
            "service_type": service_interval.name if service_interval else _("Regular Maintenance"),
            "service_description": service_interval.description if service_interval else ""
        }).data)
        
    @action(detail=True, methods=['get'])
    @swagger_auto_schema(
        operation_summary="Get mileage history",
        operation_description="Get the car's mileage update history",
        tags=['vehicles']
    )
    def mileage_history(self, request, pk=None):
        """Get the history of mileage updates for this car"""
        car = self.get_object()
        mileage_updates = MileageUpdate.objects.filter(car=car).order_by('-reported_date')
        
        # Use pagination if available
        page = self.paginate_queryset(mileage_updates)
        if page is not None:
            serializer = MileageUpdateSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = MileageUpdateSerializer(mileage_updates, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    @swagger_auto_schema(
        operation_summary="Get service history",
        operation_description="Get the car's maintenance service history",
        tags=['vehicles']
    )
    def service_history(self, request, pk=None):
        """Get the service history for this car"""
        car = self.get_object()
        
        service_history = ServiceHistory.objects.filter(car=car).order_by('-service_date')
        
        # Use pagination if available
        page = self.paginate_queryset(service_history)
        if page is not None:
            serializer = ServiceHistorySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = ServiceHistorySerializer(service_history, many=True)
        return Response(serializer.data)

class ServiceViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows services to be viewed or edited.
    Users can only view and edit services for their own cars.
    """
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'scheduled_date', 'completed_date', 'is_routine_maintenance']
    search_fields = ['title', 'description', 'technician_notes', 'car__license_plate']
    ordering_fields = ['scheduled_date', 'completed_date', 'status']
    
    def get_serializer_class(self):
        if getattr(self, 'swagger_fake_view', False):
            from .swagger_schemas import ServiceDocsSerializer
            return ServiceDocsSerializer
        return self.serializer_class
    
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    
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
    @swagger_auto_schema(
        operation_summary="Complete service",
        operation_description="Mark a service as completed and record completion details",
        tags=['services'],
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'technician_notes': openapi.Schema(type=openapi.TYPE_STRING, description='Notes about the completed service')
            }
        ),
        responses={
            200: "Service marked as completed successfully",
            400: "Service is already completed",
            404: "Service not found"
        }
    )
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
    @swagger_auto_schema(
        operation_summary="Cancel service",
        operation_description="Cancel a scheduled or in-progress service",
        tags=['services'],
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'reason': openapi.Schema(type=openapi.TYPE_STRING, description='Reason for cancellation')
            }
        ),
        responses={
            200: "Service cancelled successfully",
            400: "Service is already cancelled or cannot be cancelled",
            404: "Service not found"
        }
    )
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
    @swagger_auto_schema(
        operation_summary="Reschedule service",
        operation_description="Reschedule a service to a new date",
        tags=['services'],
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['scheduled_date'],
            properties={
                'scheduled_date': openapi.Schema(type=openapi.TYPE_STRING, format='date-time', description='New scheduled date for the service')
            }
        ),
        responses={
            200: "Service rescheduled successfully",
            400: "Cannot reschedule or missing scheduled_date",
            404: "Service not found"
        }
    )
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
    
    @action(detail=False, methods=['post'])
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
    API endpoint that allows service items to be viewed or edited.
    Users can only view and edit service items for their own services.
    """
    serializer_class = ServiceItemSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'unit_price', 'quantity']
    
    def get_serializer_class(self):
        if getattr(self, 'swagger_fake_view', False):
            from .swagger_schemas import ServiceItemDocsSerializer
            return ServiceItemDocsSerializer
        return self.serializer_class
    
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
    API endpoint that allows invoices to be viewed or edited.
    Users can only view invoices for their own services.
    Only admins can create, update, or delete invoices.
    """
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'due_date', 'issued_date']
    search_fields = ['invoice_number', 'notes', 'service__car__license_plate']
    ordering_fields = ['issued_date', 'due_date', 'status', 'total']
    
    def get_serializer_class(self):
        if getattr(self, 'swagger_fake_view', False):
            from .swagger_schemas import InvoiceDocsSerializer
            return InvoiceDocsSerializer
        return self.serializer_class
    
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
    @swagger_auto_schema(
        operation_summary="Download invoice PDF",
        operation_description="Download the PDF file for an invoice",
        tags=['invoices'],
        responses={
            200: "Invoice PDF file",
            404: "Invoice or PDF not found"
        }
    )
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
    
    @action(detail=True, methods=['post'])
    @swagger_auto_schema(
        operation_summary="Process refund for invoice",
        operation_description="Refund a paid invoice and record refund details",
        tags=['invoices'],
        request_body=RefundRequestSerializer,
        responses={
            200: InvoiceSerializer,
            400: "Bad request - invoice cannot be refunded",
            404: "Invoice not found"
        }
    )
    def refund(self, request, pk=None):
        """
        Process refund for a paid invoice
        """
        invoice = self.get_object()
        
        # Check if invoice can be refunded (must be in paid status)
        if invoice.status != 'paid':
            return Response(
                {"detail": _("Only paid invoices can be refunded")},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get refund amount (defaults to full amount)
        refund_amount = request.data.get('refund_amount', invoice.total)
        
        # Refund reason is required
        refund_reason = request.data.get('refund_reason')
        if not refund_reason:
            return Response(
                {"detail": _("Refund reason is required")},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process the refund
        invoice.status = 'refunded'
        invoice.refund_date = timezone.now().date()
        invoice.refund_amount = refund_amount
        invoice.refund_reason = refund_reason
        invoice.save()
        
        # Create notification for customer
        Notification.objects.create(
            customer=invoice.service.car.customer,
            title=_('Invoice Refunded'),
            message=_('Your invoice #%(number)s has been refunded for %(amount)s.') % {
                'number': invoice.invoice_number,
                'amount': invoice.refund_amount
            },
            notification_type='invoice'
        )
        
        serializer = self.get_serializer(invoice)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    @swagger_auto_schema(
        operation_summary="Get unpaid invoices",
        operation_description="Returns a list of all unpaid invoices (status is pending) the user has access to view",
        tags=['invoices'],
        responses={200: InvoiceSerializer(many=True)}
    )
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
    @swagger_auto_schema(
        operation_summary="Get paid invoices",
        operation_description="Returns a list of all paid invoices the user has access to view",
        tags=['invoices'],
        responses={200: InvoiceSerializer(many=True)}
    )
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
    @swagger_auto_schema(
        operation_summary="Get refunded invoices",
        operation_description="Returns a list of all refunded invoices the user has access to view",
        tags=['invoices'],
        responses={200: InvoiceSerializer(many=True)}
    )
    def refunded(self, request):
        """
        Get refunded invoices
        """
        queryset = self.get_queryset().filter(status='refunded')
        
        # Paginate the response
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    @swagger_auto_schema(
        operation_summary="Get invoice statistics",
        operation_description="Returns aggregated statistics about invoices including counts by status and financial metrics",
        tags=['invoices'],
        responses={
            200: openapi.Response('Statistics', schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'count_by_status': openapi.Schema(type=openapi.TYPE_OBJECT, description='Number of invoices by status'),
                    'financial': openapi.Schema(type=openapi.TYPE_OBJECT, description='Financial metrics'),
                    'trends': openapi.Schema(type=openapi.TYPE_OBJECT, description='Recent trends')
                }
            ))
        }
    )
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
        refunded_count = queryset.filter(status='refunded').count()
        
        # Calculate total amounts
        from django.db.models import Sum, F, DecimalField
        from django.db.models.functions import Coalesce
        
        # Get total invoice amount
        total_invoice_amount = queryset.filter(status__in=['paid', 'refunded']).aggregate(
            total=Coalesce(Sum('total'), 0, output_field=DecimalField())
        )['total'] or 0
        
        # Get total refunded amount
        total_refunded_amount = queryset.filter(status='refunded').aggregate(
            total=Coalesce(Sum('refund_amount'), 0, output_field=DecimalField())
        )['total'] or 0
        
        # Net revenue (total paid minus refunds)
        net_revenue = total_invoice_amount - total_refunded_amount
        
        # Calculate recent trends
        current_month = timezone.now().month
        current_year = timezone.now().year
        
        # This month's invoices
        month_invoices = queryset.filter(
            issued_date__month=current_month,
            issued_date__year=current_year
        )
        
        month_invoice_count = month_invoices.count()
        month_paid_count = month_invoices.filter(status='paid').count()
        month_refunded_count = month_invoices.filter(status='refunded').count()
        
        # This month's revenue
        month_revenue = month_invoices.filter(status__in=['paid', 'refunded']).aggregate(
            total=Coalesce(Sum('total'), 0, output_field=DecimalField())
        )['total'] or 0
        
        # This month's refunds
        month_refunds = month_invoices.filter(status='refunded').aggregate(
            total=Coalesce(Sum('refund_amount'), 0, output_field=DecimalField())
        )['total'] or 0
        
        # Net revenue for the month
        month_net_revenue = month_revenue - month_refunds
        
        # Return statistics as a response
        stats = {
            'total_count': queryset.count(),
            'status_counts': {
                'draft': draft_count,
                'pending': pending_count,
                'paid': paid_count,
                'cancelled': cancelled_count,
                'refunded': refunded_count
            },
            'financial': {
                'total_invoice_amount': total_invoice_amount,
                'total_refunded_amount': total_refunded_amount,
                'net_revenue': net_revenue
            },
            'monthly': {
                'invoice_count': month_invoice_count,
                'paid_count': month_paid_count,
                'refunded_count': month_refunded_count,
                'revenue': month_revenue,
                'refunds': month_refunds,
                'net_revenue': month_net_revenue
            }
        }
        
        return Response(stats)
    
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
            
    @action(detail=False, methods=['post'])
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
                        notes=notes
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
    API endpoint that allows notifications to be viewed or edited.
    Users can only view their own notifications.
    Only admins can create, update, or delete notifications.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_read', 'notification_type']
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'is_read']
    
    def get_serializer_class(self):
        if getattr(self, 'swagger_fake_view', False):
            from .swagger_schemas import NotificationDocsSerializer
            return NotificationDocsSerializer
        return self.serializer_class
    
    def get_queryset(self):
        """
        Get all notifications for the current user
        """
        # Check if this is a swagger schema generation request
        if getattr(self, 'swagger_fake_view', False):
            # Return empty queryset for swagger schema generation
            return Notification.objects.none()
            
        customer = Customer.objects.get(user=self.request.user)
        return Notification.objects.filter(customer=customer)
    
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

@swagger_auto_schema(
    method='post',
    operation_summary="Register user",
    operation_description="Register a new user with username, email, and password",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['username', 'email', 'password', 'password2'],
        properties={
            'username': openapi.Schema(type=openapi.TYPE_STRING, description='Username'),
            'email': openapi.Schema(type=openapi.TYPE_STRING, description='Email address'),
            'password': openapi.Schema(type=openapi.TYPE_STRING, description='Password'),
            'password2': openapi.Schema(type=openapi.TYPE_STRING, description='Confirm password'),
            'first_name': openapi.Schema(type=openapi.TYPE_STRING, description='First name'),
            'last_name': openapi.Schema(type=openapi.TYPE_STRING, description='Last name'),
        }
    ),
    responses={
        201: openapi.Response('User created successfully', schema=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'user': openapi.Schema(type=openapi.TYPE_OBJECT, description='User data'),
                'message': openapi.Schema(type=openapi.TYPE_STRING, description='Success message')
            }
        )),
        400: 'Invalid registration data'
    },
    tags=['Authentication']
)
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'user': UserSerializer(user).data,
            'message': 'User registered successfully',
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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

class RateLimitedTokenObtainPairView(TokenObtainPairView):
    """
    Takes a set of user credentials and returns an access and refresh JSON web
    token pair to prove the authentication of those credentials.
    
    Rate limited to prevent brute force attacks.
    """
    serializer_class = CustomTokenObtainPairSerializer
    method = "POST"
    
    @method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True))
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

class RateLimitedTokenRefreshView(TokenRefreshView):
    """
    Takes a refresh type JSON web token and returns an access type JSON web
    token if the refresh token is valid.
    
    Rate limited to prevent brute force attacks.
    """
    method = "POST"
    
    @method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True))
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

@csrf_exempt
@swagger_auto_schema(
    method='get',
    operation_summary="Get user data",
    operation_description="Search for users by username, email, first name, or last name. Used in admin forms.",
    manual_parameters=[
        openapi.Parameter('search', openapi.IN_QUERY, description="Search term", type=openapi.TYPE_STRING)
    ],
    responses={
        200: openapi.Response('List of matching users', schema=openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'id': openapi.Schema(type=openapi.TYPE_INTEGER, description='User ID'),
                    'text': openapi.Schema(type=openapi.TYPE_STRING, description='Display text'),
                    'first_name': openapi.Schema(type=openapi.TYPE_STRING, description='First name'),
                    'last_name': openapi.Schema(type=openapi.TYPE_STRING, description='Last name'),
                    'email': openapi.Schema(type=openapi.TYPE_STRING, description='Email address'),
                    'username': openapi.Schema(type=openapi.TYPE_STRING, description='Username')
                }
            )
        )),
        401: 'Unauthorized'
    },
    tags=['Admin']
)
@api_view(['GET'])
@permission_classes([permissions.AllowAny])  # Allow any access for admin interface
def get_user_data(request):
    """Get user data for admin form"""
    search_term = request.GET.get('search', '')
    
    # Special permission handling for admin usage
    if not request.user.is_authenticated:
        if not request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

    # Search for users matching the search term
    users = User.objects.filter(
        Q(username__icontains=search_term) | 
        Q(email__icontains=search_term) |
        Q(first_name__icontains=search_term) |
        Q(last_name__icontains=search_term)
    )[:10]  # Limit to 10 results for performance

    # Format the response
    results = []
    for user in users:
        results.append({
            'id': user.id,
            'text': f"{user.first_name} {user.last_name} ({user.username})",
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'username': user.username
        })

    return Response(results)

@swagger_auto_schema(
    method='post',
    operation_summary="Admin login",
    operation_description="Special login endpoint for admin users. Returns a JWT token upon successful authentication.",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['username', 'password'],
        properties={
            'username': openapi.Schema(type=openapi.TYPE_STRING, description='Admin username'),
            'password': openapi.Schema(type=openapi.TYPE_STRING, description='Admin password'),
        }
    ),
    responses={
        200: openapi.Response('Successful authentication', schema=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'success': openapi.Schema(type=openapi.TYPE_STRING, description='Success message'),
                'username': openapi.Schema(type=openapi.TYPE_STRING, description='Username'),
                'is_staff': openapi.Schema(type=openapi.TYPE_BOOLEAN, description='Staff status'),
                'is_superuser': openapi.Schema(type=openapi.TYPE_BOOLEAN, description='Superuser status')
            }
        )),
        400: 'Invalid credentials',
        401: 'Authentication failed',
        403: 'Permission denied'
    },
    tags=['Authentication']
)
@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def admin_login(request):
    """
    Special login endpoint for admin users having issues with the standard login
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    print(f"Login attempt for user: {username}")
    
    if not username or not password:
        return Response(
            {"error": "Please provide both username and password"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(request, username=username, password=password)
    
    if user is not None:
        print(f"User authenticated: {user.username}, is_staff: {user.is_staff}")
        login(request, user)
        return Response({
            "success": "Login successful",
            "username": user.username,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser
        })
    else:
        print(f"Authentication failed for user: {username}")
        return Response(
            {"error": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED
        )

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Takes a set of user credentials and returns an access and refresh JSON web
    token pair to prove the authentication of those credentials.
    
    Rate limited to prevent brute force attacks.
    """
    serializer_class = CustomTokenObtainPairSerializer
    
    @swagger_auto_schema(
        operation_summary="Obtain JWT token pair",
        operation_description="Authenticates with username and password to obtain a JWT token pair (access and refresh tokens)",
        tags=['authentication'],
        responses={
            200: openapi.Response(
                description="Successful authentication",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'access': openapi.Schema(type=openapi.TYPE_STRING, description="JWT access token"),
                        'refresh': openapi.Schema(type=openapi.TYPE_STRING, description="JWT refresh token"),
                        'user': openapi.Schema(type=openapi.TYPE_OBJECT, description="User information")
                    }
                ),
                examples={
                    'application/json': {
                        'access': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
                        'refresh': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
                        'user': {
                            'id': 1,
                            'username': 'johndoe',
                            'email': 'john@example.com',
                            'is_staff': False
                        }
                    }
                }
            ),
            401: "Invalid credentials"
        }
    )
    @method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True))
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

class UserRegistrationView(generics.CreateAPIView):
    """
    API endpoint for user registration
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    @swagger_auto_schema(
        operation_summary="Register new user",
        operation_description="Register a new user account with username, email, password, and optional profile information",
        tags=['authentication'],
        responses={
            201: openapi.Response(
                description="Successfully registered",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'user': openapi.Schema(type=openapi.TYPE_OBJECT, description="User data"),
                        'token': openapi.Schema(type=openapi.TYPE_STRING, description="Access token"),
                        'message': openapi.Schema(type=openapi.TYPE_STRING, description="Success message")
                    }
                ),
                examples={
                    'application/json': {
                        'user': {
                            'username': 'johndoe',
                            'email': 'john@example.com',
                            'first_name': 'John',
                            'last_name': 'Doe'
                        },
                        'token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
                        'message': 'User registered successfully'
                    }
                }
            ),
            400: "Invalid data provided"
        }
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate token for the user
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'token': str(refresh.access_token),
            'message': _('User registered successfully')
        }, status=status.HTTP_201_CREATED)

@csrf_exempt
@require_http_methods(["GET", "POST"])
def custom_logout(request):
    """Custom logout view that properly handles the 'next' parameter."""
    next_url = request.GET.get('next', '/admin/login/')
    logout(request)
    return redirect(next_url)

class MileageUpdateViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows mileage updates to be viewed or added.
    Users can only view and add mileage updates for their own cars.
    """
    serializer_class = MileageUpdateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['car']
    ordering_fields = ['reported_date', 'mileage']
    
    def get_serializer_class(self):
        if getattr(self, 'swagger_fake_view', False):
            from .swagger_schemas import MileageUpdateDocsSerializer
            return MileageUpdateDocsSerializer
        return self.serializer_class
    
    @swagger_auto_schema(
        operation_summary="List mileage updates",
        operation_description="List mileage updates for the authenticated user's vehicles",
        tags=['vehicles']
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_summary="Create mileage update",
        operation_description="Report a new mileage reading for a vehicle",
        request_body=MileageUpdateSerializer,
        tags=['vehicles']
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_summary="Retrieve mileage update",
        operation_description="Get details of a specific mileage update",
        tags=['vehicles']
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_summary="Update mileage update",
        operation_description="Update a mileage reading (admin only)",
        request_body=MileageUpdateSerializer,
        tags=['vehicles']
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_summary="Partially update mileage update",
        operation_description="Partially update a mileage reading (admin only)",
        request_body=MileageUpdateSerializer,
        tags=['vehicles']
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_summary="Delete mileage update",
        operation_description="Delete a mileage reading (admin only)",
        tags=['vehicles']
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    
    def get_queryset(self):
        """
        Return empty queryset for swagger schema generation to avoid AnonymousUser errors
        """
        if getattr(self, 'swagger_fake_view', False):
            return MileageUpdate.objects.none()
        
        # Regular users can only see their own mileage updates
        if not self.request.user.is_staff:
            return MileageUpdate.objects.filter(car__owner__user=self.request.user)
        
        # Staff can see all mileage updates
        return MileageUpdate.objects.all()
    
    def perform_create(self, serializer):
        """Add the car from the URL if provided"""
        car_id = self.request.data.get('car_id')
        if car_id:
            car = get_object_or_404(Car, pk=car_id)
            # Check permissions
            if not self.request.user.is_staff and car.customer.user != self.request.user:
                raise permissions.PermissionDenied(_("You don't have permission to update this car's mileage."))
            serializer.save(car=car)
        else:
            serializer.save()

# @swagger_auto_schema(auto_schema=None)
class ServiceIntervalViewSet(viewsets.ModelViewSet):
    """
    API endpoint for service intervals.
    
    Service intervals define when a car is due for maintenance based on time, mileage, or both.
    They can be global or specific to a car make and model.
    """
    queryset = ServiceInterval.objects.all()
    serializer_class = ServiceIntervalSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['interval_type', 'car_make', 'car_model', 'is_active']
    search_fields = ['name', 'description', 'car_make', 'car_model']
    ordering_fields = ['name', 'mileage_interval', 'time_interval_days', 'car_make', 'car_model']
    swagger_schema_fields = {
        'manual_parameters': [],
        'operation_id': 'serviceIntervals'
    }
    
    def get_serializer_class(self):
        """
        Return a simplified serializer for Swagger schema generation
        to avoid circular references
        """
        if getattr(self, 'swagger_fake_view', False):
            from .swagger_schemas import ServiceIntervalDocsSerializer
            return ServiceIntervalDocsSerializer
        return self.serializer_class
    
    @swagger_auto_schema(
        operation_summary="List service intervals",
        operation_description="List all service intervals",
        tags=['vehicles']
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_summary="Create service interval",
        operation_description="Create a new service interval (admin only)",
        request_body=ServiceIntervalSerializer,
        tags=['vehicles']
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_summary="Retrieve service interval",
        operation_description="Get details of a specific service interval",
        tags=['vehicles']
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_summary="Update service interval",
        operation_description="Update a service interval (admin only)",
        request_body=ServiceIntervalSerializer,
        tags=['vehicles']
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_summary="Partially update service interval",
        operation_description="Partially update a service interval (admin only)",
        request_body=ServiceIntervalSerializer,
        tags=['vehicles']
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_summary="Delete service interval",
        operation_description="Delete a service interval (admin only)",
        tags=['vehicles']
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    
    def get_queryset(self):
        """
        Return empty queryset for swagger schema generation to avoid AnonymousUser errors
        """
        if getattr(self, 'swagger_fake_view', False):
            return ServiceInterval.objects.none()
        return super().get_queryset()
    
    @swagger_auto_schema(
        operation_description="Get service intervals applicable to a specific car make and model",
        operation_summary="Get vehicle-specific service intervals",
        manual_parameters=[
            openapi.Parameter('make', openapi.IN_QUERY, description="Car make", type=openapi.TYPE_STRING),
            openapi.Parameter('model', openapi.IN_QUERY, description="Car model", type=openapi.TYPE_STRING),
        ],
        responses={
            200: ServiceIntervalSerializer(many=True),
            400: "Bad request"
        }
    )
    @action(detail=False, methods=['get'], url_path='for_vehicle')
    def for_vehicle(self, request):
        """
        Get service intervals applicable to a specific vehicle make and model
        
        Ordered from most specific (make + model) to most general (global intervals)
        """
        make = request.query_params.get('make')
        model = request.query_params.get('model')
        
        if not make:
            return Response({"error": "Car make is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        intervals = ServiceInterval.objects.filter(
            (Q(car_make=make) & Q(car_model=model)) |
            (Q(car_make=make) & Q(car_model__isnull=True)) |
            (Q(car_make__isnull=True) & Q(car_model__isnull=True)),
            is_active=True
        ).order_by(
            Case(
                When(car_make=make, car_model=model, then=0),
                When(car_make=make, car_model__isnull=True, then=1),
                When(car_make__isnull=True, car_model__isnull=True, then=2),
                default=3
            )
        )
        
        serializer = self.get_serializer(intervals, many=True)
        return Response(serializer.data)

# @swagger_auto_schema(auto_schema=None)
class ServiceHistoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint for vehicle service history.
    
    Tracks maintenance services performed on vehicles and their relationship
    to service intervals for prediction purposes.
    """
    serializer_class = ServiceHistorySerializer
    permission_classes = [IsAuthenticated]
    swagger_schema_fields = {
        'manual_parameters': [],
        'operation_id': 'serviceHistory'
    }
    
    def get_serializer_class(self):
        """
        Return a simplified serializer for Swagger schema generation
        to avoid circular references
        """
        if getattr(self, 'swagger_fake_view', False):
            from .swagger_schemas import ServiceHistoryDocsSerializer
            return ServiceHistoryDocsSerializer
        return self.serializer_class
    
    @swagger_auto_schema(
        operation_summary="List service history",
        operation_description="List service history records for the authenticated user's vehicles",
        tags=['vehicles']
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_summary="Create service history",
        operation_description="Create a new service history record",
        request_body=ServiceHistorySerializer,
        tags=['vehicles']
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_summary="Retrieve service history",
        operation_description="Get details of a specific service history record",
        tags=['vehicles']
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_summary="Update service history",
        operation_description="Update a service history record (admin only)",
        request_body=ServiceHistorySerializer,
        tags=['vehicles']
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_summary="Partially update service history",
        operation_description="Partially update a service history record (admin only)",
        request_body=ServiceHistorySerializer,
        tags=['vehicles']
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_summary="Delete service history",
        operation_description="Delete a service history record (admin only)",
        tags=['vehicles']
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    
    def get_queryset(self):
        """
        Return empty queryset for swagger schema generation to avoid AnonymousUser errors
        """
        if getattr(self, 'swagger_fake_view', False):
            return ServiceHistory.objects.none()
        
        # Regular users can only see their own service history
        if not self.request.user.is_staff:
            return ServiceHistory.objects.filter(car__customer__user=self.request.user)
        
        # Staff can see all service history
        return ServiceHistory.objects.all()
    
    def perform_create(self, serializer):
        """Verify appropriate permissions and update service predictions"""
        car_id = serializer.validated_data.get('car').id
        car = get_object_or_404(Car, pk=car_id)
        
        # Check permissions
        if not self.request.user.is_staff and car.customer.user != self.request.user:
            raise permissions.PermissionDenied(_("You don't have permission to add service history for this car."))
        
        # Save the service history
        service_history = serializer.save()
        
        # Update car's service predictions
        car.update_service_predictions()
        
        return service_history
