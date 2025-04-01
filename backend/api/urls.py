from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserViewSet, CustomerViewSet, CarViewSet, ServiceViewSet,
    ServiceItemViewSet, InvoiceViewSet, NotificationViewSet,
    register_user, ChangePasswordView, get_user_data,
    RateLimitedTokenObtainPairView, RateLimitedTokenRefreshView,
    admin_login, CustomTokenObtainPairView, UserRegistrationView
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

# Apply tags to viewsets for Swagger documentation
UserViewSet.swagger_tags = ['users']
CustomerViewSet.swagger_tags = ['customers']
CarViewSet.swagger_tags = ['vehicles']
ServiceViewSet.swagger_tags = ['services']
ServiceItemViewSet.swagger_tags = ['services']
InvoiceViewSet.swagger_tags = ['invoices']
NotificationViewSet.swagger_tags = ['notifications']

# Authentication endpoints
auth_patterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
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
] 