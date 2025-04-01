# Swagger API Documentation Implementation

## Overview
This document outlines the implementation of Swagger API documentation for the ECAR project. The implementation uses `drf-yasg` (Yet Another Swagger Generator) to automatically generate interactive API documentation from our Django REST Framework views.

## Changes Made

### 1. Schema Structure
- Created separate serializers in `swagger_schemas.py` specifically for documentation
- Used simplified serializer structures to avoid deep nesting and circular references
- Maintained semantic naming by importing documentation serializers with `as` syntax:
  ```python
  from .swagger_schemas import (
      UserSerializer as UserSerializerDocs,
      CustomerSerializer as CustomerSerializerDocs,
      # ... other serializers
  )
  ```

### 2. URL Configuration
- Added Swagger UI endpoints to the main `urls.py`:
  ```python
  path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
  path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
  path('api/swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
  path('api/swagger.yaml', schema_view.without_ui(cache_timeout=0), name='schema-yaml'),
  ```
- Set up the schema view with proper metadata about the API
- Configured it to work with JWT authentication

### 3. View Annotations
- Added `@swagger_auto_schema` decorators to all API views
- Specified proper response schemas, request bodies, and operation descriptions
- Example:
  ```python
  @swagger_auto_schema(
      operation_summary='List all services',
      operation_description='Returns a list of all services based on user permissions and filters',
      responses={200: ServiceSerializerDocs(many=True)}
  )
  def list(self, request, *args, **kwargs):
      # View implementation
  ```

### 4. Serializer Improvements
- Used simplified serializers for documentation only to prevent nesting issues
- Removed complex nested relations from documentation serializers
- Configured swagger with explicit field inspectors in settings.py

## Automated Validation of Serializers

To prevent Swagger documentation errors and inconsistencies between serializers and models, we've implemented an automated validation script.

### Using the Validation Script

The script is located at `scripts/validate_serializers.py` and can be run using:

```bash
# From the project root
python backend/scripts/validate_serializers.py

# Or in Docker
docker-compose exec backend bash -c "cd /app && python scripts/validate_serializers.py"
```

The script will:
1. Check all serializers against their corresponding models
2. Validate that field names in serializers match field names or properties in models
3. Identify relationship fields that might need explicit declaration
4. Return exit code 0 if no issues found, 1 if issues detected (for CI/CD integration)

### Integrating with CI/CD

The validation script can be added to your GitHub Actions workflow to catch serializer issues before deployment:

```yaml
# .github/workflows/validate-serializers.yml
name: Validate Serializers

on:
  push:
    paths:
      - 'backend/api/serializers.py'
      - 'backend/core/models.py'
  pull_request:
    paths:
      - 'backend/api/serializers.py'
      - 'backend/core/models.py'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.12'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      - name: Run serializer validation
        run: |
          cd backend
          python scripts/validate_serializers.py
```

### Output Example

```
ECAR Serializer Validation
==============================
✓ UserSerializer - No issues
✓ CustomerSerializer - No issues
✓ CarSerializer - No issues
✓ ServiceSerializer - No issues

Issues in ServiceItemSerializer:
  - Warning: Relationship field 'service' may need explicit declaration
✓ InvoiceSerializer - No issues
✓ NotificationSerializer - No issues
```

## Troubleshooting
If you encounter issues with Swagger documentation:

1. **Nested Serializer Errors**
   - Error: `SwaggerGenerationError: cannot instantiate nested serializer as Parameter`
   - Fix: Simplify the serializers used for documentation by removing nested relationships

2. **CSRF Token Issues**
   - Error: Unauthorized access when testing API endpoints from Swagger UI
   - Fix: Use JWT authentication with Bearer token in the Swagger UI Authorize dialog

3. **JWT Authentication**
   - To authenticate in Swagger UI:
     1. Click the "Authorize" button at the top right
     2. Enter your JWT token with format: `Bearer YOUR_TOKEN`
     3. All subsequent requests will include this token

4. **Swagger UI Not Loading**
   - Check if static files are being served correctly
   - Run `python manage.py collectstatic` to ensure all Swagger UI assets are available
   - Check if the URLs are correctly configured in the main `urls.py` file

## Accessing the Documentation
- Swagger UI: `/api/docs/`
- ReDoc UI: `/api/redoc/`
- Raw schema JSON: `/api/swagger.json`

## Future Improvements
- Add more detailed descriptions for each model field
- Include example requests/responses for complex endpoints
- Add authentication flow examples in the documentation
- Tag endpoints into logical groups for better organization

## API Documentation Enhancement

### 1. Operation Tags for Logical Grouping

Operation tags help organize API endpoints into logical groups in the Swagger UI, making the documentation more navigable and user-friendly.

#### Implementation:

1. **Configure Tags in Schema View**:
   ```python
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
       tags=[
           {'name': 'authentication', 'description': 'User authentication and token management'},
           {'name': 'customers', 'description': 'Customer management endpoints'},
           {'name': 'vehicles', 'description': 'Vehicle management endpoints'},
           {'name': 'services', 'description': 'Service booking and management'},
           {'name': 'invoices', 'description': 'Invoice generation and payment tracking'},
           {'name': 'notifications', 'description': 'User notification endpoints'},
       ],
   )
   ```

2. **Apply Tags to ViewSets and Views**:
   ```python
   @swagger_auto_schema(
       operation_summary='List all customers',
       operation_description='Returns a list of all customers with optional filtering',
       tags=['customers'],
       responses={200: CustomerSerializerDocs(many=True)}
   )
   def list(self, request, *args, **kwargs):
       # View implementation
   ```

3. **Group ViewSet Operations**:
   Apply the same tag to all methods in a ViewSet to group them together:
   ```python
   @method_decorator(name='list', decorator=swagger_auto_schema(tags=['customers']))
   @method_decorator(name='retrieve', decorator=swagger_auto_schema(tags=['customers']))
   @method_decorator(name='create', decorator=swagger_auto_schema(tags=['customers']))
   @method_decorator(name='update', decorator=swagger_auto_schema(tags=['customers']))
   @method_decorator(name='partial_update', decorator=swagger_auto_schema(tags=['customers']))
   @method_decorator(name='destroy', decorator=swagger_auto_schema(tags=['customers']))
   class CustomerViewSet(viewsets.ModelViewSet):
       # ViewSet implementation
   ```

### 2. Better Endpoint Descriptions

Detailed descriptions help API consumers understand endpoint functionality, required parameters, and expected responses.

#### Implementation:

1. **Operation Summary and Description**:
   ```python
   @swagger_auto_schema(
       operation_summary='Create new service',
       operation_description="""
       Creates a new service record for a vehicle.
       
       The service will be initially set to 'scheduled' status.
       Required fields: car_id, title, description, scheduled_date
       Optional fields: technician_notes
       """,
       request_body=ServiceCreateSerializer,
       responses={
           201: ServiceSerializer,
           400: 'Bad request - invalid data',
           403: 'Permission denied'
       }
   )
   def create(self, request, *args, **kwargs):
       # Implementation
   ```

2. **Parameter Descriptions**:
   ```python
   @swagger_auto_schema(
       operation_summary='Get vehicle services',
       operation_description='Retrieve service history for a specific vehicle',
       manual_parameters=[
           openapi.Parameter(
               'car_id',
               openapi.IN_QUERY,
               description='Filter services by car ID',
               type=openapi.TYPE_INTEGER
           ),
           openapi.Parameter(
               'status',
               openapi.IN_QUERY,
               description='Filter by service status (scheduled, in_progress, completed, cancelled)',
               type=openapi.TYPE_STRING,
               enum=['scheduled', 'in_progress', 'completed', 'cancelled']
           ),
       ],
       responses={200: ServiceSerializerDocs(many=True)}
   )
   def list(self, request, *args, **kwargs):
       # Implementation
   ```

### 3. Example Request/Response Data

Adding examples helps developers understand the expected format of requests and responses.

#### Implementation:

1. **Using Examples in Schema**:
   ```python
   @swagger_auto_schema(
       operation_summary='Create invoice',
       request_body=openapi.Schema(
           type=openapi.TYPE_OBJECT,
           required=['service_id', 'due_date'],
           properties={
               'service_id': openapi.Schema(type=openapi.TYPE_INTEGER, description='Service ID'),
               'due_date': openapi.Schema(type=openapi.TYPE_STRING, format='date', description='Due date (YYYY-MM-DD)'),
               'notes': openapi.Schema(type=openapi.TYPE_STRING, description='Invoice notes'),
               'tax_rate': openapi.Schema(type=openapi.TYPE_NUMBER, description='Tax rate (default: 19.0)')
           },
           example={
               "service_id": 123,
               "due_date": "2025-05-01",
               "notes": "Payment due within 30 days",
               "tax_rate": 19.0
           }
       ),
       responses={
           201: InvoiceSerializerDocs,
           400: 'Bad request - invalid data',
           404: 'Service not found'
       }
   )
   def create(self, request, *args, **kwargs):
       # Implementation
   ```

2. **Response Examples**:
   ```python
   @swagger_auto_schema(
       operation_summary='Get invoice details',
       responses={
           200: openapi.Response(
               description='Invoice details retrieved successfully',
               schema=InvoiceSerializerDocs,
               examples={
                   'application/json': {
                       'id': 123,
                       'invoice_number': 'INV-A1B2C3D4',
                       'service': {
                           'id': 456,
                           'title': 'Oil Change',
                           'car': {
                               'id': 789,
                               'make': 'Toyota',
                               'model': 'Corolla',
                               'license_plate': 'TN-123-456'
                           }
                       },
                       'issued_date': '2025-04-01',
                       'due_date': '2025-05-01',
                       'status': 'pending',
                       'subtotal': 150.00,
                       'tax_amount': 28.50,
                       'total': 178.50,
                       'notes': 'Payment due within 30 days',
                       'tax_rate': 19.0
                   }
               }
           ),
           404: 'Invoice not found'
       }
   )
   def retrieve(self, request, *args, **kwargs):
       # Implementation
   ```

### 4. Authentication Flow Documentation

Document how authentication works to help developers integrate with the API.

#### Implementation:

1. **Authentication Section in API Documentation**:
   ```python
   schema_view = get_schema_view(
       openapi.Info(
           title="ECAR API",
           default_version='v1',
           description="""
           # ECAR Garage Management System API
           
           ## Authentication
           
           This API uses JWT (JSON Web Token) for authentication.
           
           1. **Obtain Token**:
              ```
              POST /api/token/
              {
                  "username": "your_username",
                  "password": "your_password"
              }
              ```
              
           2. **Use Token in Requests**:
              Add an Authorization header with the value `Bearer <token>` to your requests.
              
           3. **Refresh Token**:
              ```
              POST /api/token/refresh/
              {
                  "refresh": "your_refresh_token"
              }
              ```
              
           4. **Token Lifetime**:
              - Access tokens are valid for 30 minutes
              - Refresh tokens are valid for 7 days
           """,
           # ... other fields
       ),
       # ... other parameters
   )
   ```

2. **Auth Endpoints Documentation**:
   ```python
   @swagger_auto_schema(
       operation_summary='Obtain JWT token',
       operation_description="""
       Exchange username and password for a JWT token pair (access token and refresh token).
       The access token is used for API authentication and expires after 30 minutes.
       The refresh token can be used to obtain a new access token and expires after 7 days.
       """,
       request_body=openapi.Schema(
           type=openapi.TYPE_OBJECT,
           required=['username', 'password'],
           properties={
               'username': openapi.Schema(type=openapi.TYPE_STRING),
               'password': openapi.Schema(type=openapi.TYPE_STRING, format='password')
           }
       ),
       responses={
           200: openapi.Response(
               description='Token pair obtained successfully',
               schema=openapi.Schema(
                   type=openapi.TYPE_OBJECT,
                   properties={
                       'access': openapi.Schema(type=openapi.TYPE_STRING),
                       'refresh': openapi.Schema(type=openapi.TYPE_STRING),
                   }
               ),
               examples={
                   'application/json': {
                       'access': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
                       'refresh': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'
                   }
               }
           ),
           401: 'Invalid credentials'
       },
       tags=['authentication']
   )
   class TokenObtainPairView(TokenObtainPairView):
       pass
   ```

## Implementation Steps

To implement these enhancements:

1. **Update ViewSets with Tags and Better Descriptions**:
   - Apply tags to all ViewSets using `@method_decorator`
   - Improve operation summaries and descriptions
   - Add detailed parameter descriptions

2. **Add Examples**:
   - Create example requests and responses for complex endpoints
   - Use the `examples` parameter in `openapi.Response`

3. **Document Authentication Flow**:
   - Update schema view description to include auth flow
   - Enhance token endpoint documentation

4. **Test Documentation**:
   - Verify that tags appear correctly in Swagger UI
   - Check that endpoints are grouped logically
   - Ensure examples are displayed correctly

## Benefits

These enhancements will provide several benefits:

1. **Improved Developer Experience**: Logical organization and detailed descriptions make the API easier to understand and use
2. **Faster Integration**: Examples help developers see exactly what data to send and what to expect in response
3. **Reduced Support Burden**: Comprehensive documentation reduces the need for developers to ask questions
4. **Better API Design**: Documenting the API often reveals inconsistencies or areas for improvement

## Common Swagger Documentation Issues

### Field Name Mismatches

One common issue with Swagger documentation is mismatches between serializer field names and model property names. This occurs because drf-yasg inspects both serializers and models to build the schema.

**Example Error:**
```
django.core.exceptions.ImproperlyConfigured: Field name `total_amount` is not valid for model `Invoice` in `api.serializers.InvoiceSerializer`.
```

**Solution:**
Ensure that serializer field names exactly match the model property names they represent. For example:

```python
# In models.py
class Invoice(models.Model):
    # ... other fields ...
    
    @property
    def total(self):
        return self.subtotal + self.tax_amount

# In serializers.py - INCORRECT
class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = [..., 'total_amount', ...]  # Will cause errors in Swagger

# In serializers.py - CORRECT
class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = [..., 'total', ...]  # Matches model property name
```

### Missing or Non-existent Fields

Another common issue is including fields in the serializer that don't exist in the model. This can happen when:
- Fields are added to serializers but not to models
- Fields are renamed in models but not updated in serializers
- Properties are removed from models but still referenced in serializers

**Example Error:**
```
django.core.exceptions.ImproperlyConfigured: Field name `created_at` is not valid for model `ServiceItem` in `api.serializers.ServiceItemSerializer`.
```

**Solution:**
1. Check that all fields in serializer.Meta.fields correspond to actual model fields or properties
2. Remove non-existent fields from serializers
3. For fields that aren't in the model but needed in the API, use explicit field declarations

### Relationship Fields Without Explicit Declarations

When using relationship fields (ForeignKey, OneToOneField, etc.), sometimes you need to declare them explicitly for Swagger to process them correctly.

**Example Warning from Our Validation Script:**
```
Warning: Relationship field 'service' may need explicit declaration
```

**Solution:**
Explicitly declare relationship fields in the serializer:

```python
# BEFORE
class ServiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceItem
        fields = ['id', 'service', 'item_type', 'name']  # 'service' is a ForeignKey

# AFTER
class ServiceItemSerializer(serializers.ModelSerializer):
    service = serializers.PrimaryKeyRelatedField(queryset=Service.objects.all())
    
    class Meta:
        model = ServiceItem
        fields = ['id', 'service', 'item_type', 'name']
```

### Issues We Fixed in ECAR Project

In our project, we encountered and fixed several serializer-related issues:

1. **InvoiceSerializer**: Fixed field name mismatch between `total_amount` (serializer) and `total` (model property)
2. **ServiceItemSerializer**: Removed non-existent `created_at` and `updated_at` fields and added explicit declaration for `service` relationship
3. **NotificationSerializer**: Removed non-existent `related_object_id` and `updated_at` fields

### Other Common Issues

- Missing `rest_framework` or `drf-yasg` in `INSTALLED_APPS`
- Incorrect URL configuration for Swagger views
- Complex nested serializers that Swagger can't interpret
- Circular import dependencies in serializers

When troubleshooting Swagger issues, check the backend logs for detailed error messages which will usually point directly to the problem.

## Automated Validation with Our Custom Script

### The Validation Script

Our custom validation script (`scripts/validate_serializers.py`) automates the process of checking serializers against models to prevent Swagger documentation issues. 

Key features:

- **Comprehensive Model Field Detection**: Identifies both regular fields and properties
- **Relationship Field Validation**: Warns about relationship fields that might need explicit declaration
- **Exit Code Support**: Returns exit code 1 when issues are found (useful for CI/CD)
- **Detailed Reporting**: Shows exactly which fields are problematic in which serializers

### Running the Script

From the command line:

```bash
# From the project root with Docker
docker-compose exec backend bash -c "cd /app && python scripts/validate_serializers.py"

# From the backend directory directly
python scripts/validate_serializers.py
```

### Example Output

```
ECAR Serializer Validation
==============================
✓ UserSerializer - No issues
✓ CustomerSerializer - No issues
✓ CarSerializer - No issues
✓ ServiceSerializer - No issues

Issues in ServiceItemSerializer:
  - Warning: Relationship field 'service' may need explicit declaration
✓ InvoiceSerializer - No issues
✓ NotificationSerializer - No issues
```

### Validation Logic

The script uses the following approach:

1. Gets all field names from model through Django's introspection
2. Gets all property names from model through Python's dir() and getattr()
3. Creates a set of valid field names from both sources
4. Compares each serializer field against this set
5. Specially checks relationship fields which may need explicit declaration

### CI/CD Integration

To integrate the script into GitHub Actions:

```yaml
# .github/workflows/validate-serializers.yml
name: Validate Serializers

on:
  push:
    paths:
      - 'backend/api/serializers.py'
      - 'backend/core/models.py'
  pull_request:
    paths:
      - 'backend/api/serializers.py'
      - 'backend/core/models.py'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.12'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      - name: Run serializer validation
        run: |
          cd backend
          python scripts/validate_serializers.py
```

## Best Practices for Serializer Development

Based on our experience with the ECAR project, we recommend:

1. **Always validate serializers after model changes**: Run the validation script whenever you modify models
2. **Be explicit with relationship fields**: Declare ForeignKey fields explicitly in serializers
3. **Keep property and field names consistent**: Use the same names in models and serializers
4. **Use the swagger UI to test endpoints**: After fixing Swagger issues, verify endpoints work through the UI
5. **Add the validation script to pre-commit hooks**: Catch issues before they're committed to the repository

## Best Practices for Swagger Documentation

### 1. Validate Serializers Against Models

Before implementing Swagger, ensure that your serializers correctly reflect your models:

1. **Field Name Matching**: Field names in serializers must exactly match property names or fields in models.
   - Example: Use `total` in serializer if the model has `@property def total()`

2. **Field Existence Verification**: Only include fields that actually exist in the model or are explicitly declared in the serializer.
   - Common mistakes: Including `created_at` in serializer when model doesn't have this field

3. **Testing Serializer Structure**: Write a simple script to validate all serializer field references:
   ```python
   from api.serializers import *
   
   def validate_serializer(serializer_class):
       serializer = serializer_class()
       model = serializer.Meta.model
       model_fields = [f.name for f in model._meta.fields]
       model_properties = [name for name in dir(model) if isinstance(getattr(model, name), property)]
       valid_names = set(model_fields + model_properties)
       
       for field_name in serializer.Meta.fields:
           if field_name not in valid_names and field_name not in serializer.fields:
               print(f"Warning: {field_name} not found in {model.__name__}")
   
   # Test all serializers
   for serializer in [CustomerSerializer, CarSerializer, InvoiceSerializer]:
       validate_serializer(serializer)
   ```

4. **Explicit Declarations**: If you need fields in serializers that don't exist in models, declare them explicitly:
   ```python
   class CustomerSerializer(serializers.ModelSerializer):
       # Explicitly declare fields not in model
       full_name = serializers.SerializerMethodField()
       
       def get_full_name(self, obj):
           return f"{obj.user.first_name} {obj.user.last_name}"
       
       class Meta:
           model = Customer
           fields = ['id', 'phone', 'full_name']
   ```

### 2. Other Best Practices

- Group related endpoints with tags
- Provide clear operation descriptions 
- Include examples for complex requests
- Test documentation with actual API calls 