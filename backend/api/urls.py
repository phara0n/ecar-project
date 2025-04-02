from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.conf import settings
from rest_framework import permissions
from .swagger_wrapper import FixedSchemaGenerator
from .views import (
    UserViewSet, CustomerViewSet, CarViewSet, ServiceViewSet,
    ServiceItemViewSet, InvoiceViewSet, NotificationViewSet,
    ChangePasswordView, get_user_data,
    RateLimitedTokenObtainPairView, RateLimitedTokenRefreshView,
    admin_login, UserRegistrationView, MileageUpdateViewSet, 
    ServiceIntervalViewSet, ServiceHistoryViewSet
)

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'cars', CarViewSet, basename='car')
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'service-items', ServiceItemViewSet, basename='service-item')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'mileage-updates', MileageUpdateViewSet, basename='mileage-update')
router.register(r'service-intervals', ServiceIntervalViewSet, basename='service-interval')
router.register(r'service-history', ServiceHistoryViewSet, basename='service-history')

# Configure the Swagger schema view with better compatibility
schema_view = get_schema_view(
    openapi.Info(
        title="ECAR API",
        default_version='v1',
        description="API for the ECAR Garage Management System",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="phara0ntn@gmail.com"),
        license=openapi.License(name="Proprietary"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
    generator_class=FixedSchemaGenerator,
    url='http://localhost:8000/api/',
    validators=['flex'],
)

# Apply tags to viewsets for Swagger documentation
UserViewSet.swagger_tags = ['users']
CustomerViewSet.swagger_tags = ['customers']
CarViewSet.swagger_tags = ['vehicles']
ServiceViewSet.swagger_tags = ['services']
ServiceItemViewSet.swagger_tags = ['services']
InvoiceViewSet.swagger_tags = ['invoices']
NotificationViewSet.swagger_tags = ['notifications']
MileageUpdateViewSet.swagger_tags = ['vehicles']
ServiceIntervalViewSet.swagger_tags = ['vehicles']
ServiceHistoryViewSet.swagger_tags = ['vehicles']

# Authentication endpoints
auth_patterns = [
    path('token/', RateLimitedTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', RateLimitedTokenRefreshView.as_view(), name='token_refresh'),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
]

urlpatterns = [
    # Router URLs
    path('', include(router.urls)),
    
    # Authentication URLs
    path('auth/', include(auth_patterns)),
    
    # Admin Helper API
    path('get-user-data/', get_user_data, name='get_user_data'),
    
    # Admin Login API
    path('admin-login/', admin_login, name='admin_login'),
    
    # Swagger documentation
    path('docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
] 