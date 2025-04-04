"""
URL configuration for ecar_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions
from django.views.generic import TemplateView, RedirectView
from api.views import custom_logout

# API information for Swagger documentation
schema_view = get_schema_view(
    openapi.Info(
        title="ECAR API",
        default_version='v1',
        description="ECAR Garage Management System API",
        terms_of_service="https://www.ecar.tn/terms/",
        contact=openapi.Contact(email="support@ecar.tn"),
        license=openapi.License(name="Proprietary"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
    url=settings.DEBUG and "http://localhost:8000/" or "https://ecar.tn/",
)

urlpatterns = [
    # Add a root URL handler that redirects to the API documentation
    path('', RedirectView.as_view(url='/api/docs/', permanent=False), name='home'),
    path('admin/logout/', custom_logout, name='admin_logout'),  # Custom logout view
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api-auth/', include('rest_framework.urls')),
    
    # Admin login fix page
    path('admin-login-fix/', TemplateView.as_view(
        template_name='admin_login_fix.html',
        content_type='text/html'
    ), name='admin_login_fix'),
    
    # Swagger/OpenAPI documentation URLs
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('api/swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('api/swagger.yaml', schema_view.without_ui(cache_timeout=0), name='schema-yaml'),
]

# Add debug toolbar URLs in development
if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns

# Serve static and media files in development
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
