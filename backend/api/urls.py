from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserViewSet, CustomerViewSet, CarViewSet, ServiceViewSet,
    ServiceItemViewSet, InvoiceViewSet, NotificationViewSet,
    RegisterView, ChangePasswordView, RateLimitedTokenObtainPairView,
    TokenRefreshEndpoint, test_token, blacklist_token, get_user_data
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'cars', CarViewSet)
router.register(r'services', ServiceViewSet)
router.register(r'service-items', ServiceItemViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'notifications', NotificationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # Authentication endpoints
    path('token/', RateLimitedTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshEndpoint.as_view(), name='token_refresh'),
    path('token/blacklist/', blacklist_token, name='token_blacklist'),
    path('token/test/', test_token, name='token_test'),
    path('register/', RegisterView.as_view(), name='register'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    
    # Admin helper endpoints
    path('get-user-data/<int:user_id>/', get_user_data, name='get_user_data'),
] 