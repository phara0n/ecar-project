from django.shortcuts import render
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from core.models import Customer, Car, Service, ServiceItem, Invoice, Notification
from .serializers import (
    UserSerializer, CustomerSerializer, CarSerializer, 
    ServiceSerializer, ServiceItemSerializer, InvoiceSerializer, 
    NotificationSerializer, UserRegistrationSerializer, ChangePasswordSerializer
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.utils.translation import gettext_lazy as _
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from django_ratelimit.decorators import ratelimit
from django.http import HttpResponse
from auditlog.models import LogEntry
from auditlog.registry import auditlog
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_cookie
from django.conf import settings
from utils.sms_utils import send_sms

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
    API endpoint for customer management
    """
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaff]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return Customer.objects.all()
        return Customer.objects.filter(user=self.request.user)
    
    @method_decorator(cache_page(settings.CACHE_TTL))
    @method_decorator(vary_on_cookie)
    @action(detail=False, methods=['get'])
    def me(self, request):
        try:
            customer = Customer.objects.get(user=request.user)
            serializer = self.get_serializer(customer)
            return Response(serializer.data)
        except Customer.DoesNotExist:
            return Response(
                {"detail": _("Customer profile not found")},
                status=status.HTTP_404_NOT_FOUND
            )

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
        if self.request.user.is_staff:
            return Service.objects.all()
        
        try:
            customer = Customer.objects.get(user=self.request.user)
            return Service.objects.filter(car__customer=customer)
        except Customer.DoesNotExist:
            return Service.objects.none()
    
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
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return Invoice.objects.all()
        
        try:
            customer = Customer.objects.get(user=self.request.user)
            return Invoice.objects.filter(service__car__customer=customer)
        except Customer.DoesNotExist:
            return Invoice.objects.none()
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        invoice = self.get_object()
        
        if invoice.pdf_file:
            from django.http import FileResponse
            return FileResponse(invoice.pdf_file.open('rb'), as_attachment=True)
        else:
            return Response(
                {"detail": _("PDF not generated for this invoice yet")},
                status=status.HTTP_404_NOT_FOUND
            )
    
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

# Apply rate limiting to token views
class RateLimitedTokenObtainPairView(TokenObtainPairView):
    """Rate-limited token view to prevent brute force attacks"""
    
    @ratelimit(key='ip', rate='5/m', method='POST', block=True)
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

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
            # Example: add user info or custom claims to the response
            # This could include permissions, role, etc.
            if hasattr(request, 'user') and request.user.is_authenticated:
                response.data['user_id'] = request.user.id
                response.data['username'] = request.user.username
        
        return response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_token(request):
    """
    Test endpoint to verify that a token is valid and working.
    """
    return Response({
        'message': 'Token is valid',
        'user_id': request.user.id,
        'username': request.user.username
    })
