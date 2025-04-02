# Swagger API Documentation

## Overview

This document outlines the improvements made to the Swagger API documentation for the ECAR project. The API now has comprehensive documentation for all endpoints, making it easier for developers to understand and use the API.

## Improvements Made

1. **Fixed `admin_login` Endpoint Documentation**
   - Added proper method parameter to the Swagger annotation
   - Included detailed request body schema with username and password fields
   - Defined comprehensive response objects for success and error cases
   - Fixed decorator order to prevent duplicate annotations

2. **Added Documentation to Previously Undocumented Endpoints**
   - Added documentation to `register_user` function
   - Added documentation to `get_user_data` function
   - Documented all ViewSet methods (list, create, retrieve, update, partial_update, destroy)
   - Documented all ViewSet actions using appropriate @swagger_auto_schema decorators

3. **Created Utility Scripts**
   - `find_undocumented_endpoints.py`: Analyzes the views.py file to identify API endpoints without Swagger documentation
   - `fix_remaining_docs.py`: Adds documentation to remaining undocumented API endpoints
   - `fix_get_user_data.py`: Specifically fixes the get_user_data function documentation
   - `fix_car_endpoints.py`: Adds documentation to all car-related endpoints
   - `fix_all_endpoints.py`: Comprehensive script to document all service endpoints
   - `fix_targeted_endpoints.py`: Handles specific endpoints that need documentation

4. **Added Mileage-Based Service Prediction Documentation**
   - Added documentation for all mileage update endpoints
   - Added documentation for service interval management
   - Documented car-related mileage reporting and prediction endpoints
   - Added appropriate request/response schemas and examples

## Swagger Documentation Standards

All API endpoints in the project now follow these documentation standards:

1. **Operation Summary and Description**
   - Concise summary of what the endpoint does
   - Detailed description explaining the purpose and behavior

2. **Request Parameters**
   - Path parameters (e.g., ID values in the URL)
   - Query parameters (e.g., filters, search terms)
   - Request body schema with required fields and data types

3. **Response Objects**
   - Success response with schema definition
   - Error responses with appropriate status codes
   - Examples where appropriate

4. **Tags**
   - Endpoints are organized by functional area (users, services, authentication, etc.)
   - Vehicle-related endpoints use the 'vehicles' tag

## Using the API Documentation

The Swagger UI is accessible at the `/swagger/` URL when running the application. It provides:

1. Interactive documentation for all API endpoints
2. Try-it-out functionality to test endpoints directly from the browser
3. Schema models for request and response objects
4. Authentication support for testing protected endpoints

## Mileage-Based Service Prediction Endpoints

The following new endpoints have been documented:

### Car ViewSet Extensions

1. **Report Mileage**
   - `POST /api/cars/{id}/report_mileage/`
   - Summary: Report current mileage
   - Description: Car owners can report their current mileage
   - Request Body: MileageUpdateSerializer (mileage, notes)
   - Response: Updated car with service predictions

2. **Next Service Prediction**
   - `GET /api/cars/{id}/next_service_prediction/`
   - Summary: Get next service prediction
   - Description: Get estimated next service date and mileage
   - Response: Service prediction including date, mileage, and service details

3. **Mileage History**
   - `GET /api/cars/{id}/mileage_history/`
   - Summary: Get mileage history
   - Description: Get the car's mileage update history
   - Response: List of mileage updates with dates and values

### MileageUpdate ViewSet

1. **List Mileage Updates**
   - `GET /api/mileage-updates/`
   - Summary: List mileage updates
   - Description: List mileage updates for the authenticated user's vehicles

2. **Create Mileage Update**
   - `POST /api/mileage-updates/`
   - Summary: Create mileage update
   - Description: Report a new mileage reading for a vehicle
   - Request Body: MileageUpdateSerializer

3. **CRUD Operations**
   - Standard CRUD endpoints with appropriate documentation
   - Update/Delete operations restricted to admin users only

### ServiceInterval ViewSet

1. **List Service Intervals**
   - `GET /api/service-intervals/`
   - Summary: List service intervals
   - Description: List all service intervals

2. **For Vehicle**
   - `GET /api/service-intervals/for_vehicle/`
   - Summary: Get vehicle-specific service intervals
   - Description: Get service intervals applicable to a specific car make and model
   - Query Parameters: make, model
   - Response: List of applicable service intervals, ordered by specificity

3. **CRUD Operations**
   - Standard CRUD endpoints with appropriate documentation
   - Create/Update/Delete operations restricted to admin users only

## Future Recommendations

1. **Keep Documentation Updated**: Update Swagger documentation whenever endpoints are modified
2. **Add More Examples**: Provide more example requests and responses for complex endpoints
3. **Improve Descriptions**: Continuously improve descriptions based on user feedback
4. **Add Authentication Notes**: Include clearer notes about which authentication method to use for each endpoint
5. **Standardize Tags**: Ensure consistent use of tags across related endpoints

## Testing the Documentation

The documentation has been tested to ensure:

1. All endpoints are documented
2. Schemas are correctly defined
3. The server starts without Swagger-related errors
4. The Swagger UI loads and displays the documentation correctly
5. Mileage prediction endpoints are accessible and testable through Swagger UI

# Swagger Documentation Implementation

## Overview

This document outlines our implementation of Swagger documentation for the ECAR project API. Swagger provides interactive API documentation, allowing developers to understand and test the API endpoints directly in a browser.

## Setup

The Swagger implementation uses the `drf-yasg` (Yet Another Swagger Generator) package for Django REST Framework. The key files involved are:

1. **urls.py**: Contains the Swagger view configuration and URL routing
2. **serializers.py**: Contains all serializers used for API data
3. **swagger_schemas.py**: Contains simplified serializers specifically for documentation
4. **swagger_wrapper.py**: Contains a custom SchemaGenerator to handle special cases

## Endpoints

- **Swagger UI**: `/api/docs/`
- **OpenAPI Schema**: `/api/docs/?format=openapi`

## Known Issues and Solutions

### Issue 1: Field Reference Error

**Error Message**:
```
ImproperlyConfigured: Field name `created_at` is not valid for model `ServiceItem` in `api.serializers.ServiceItemSerializer`.
```

**Root Cause**:
The `ServiceItemSerializer` included fields (`created_at` and `updated_at`) that don't exist in the actual `ServiceItem` model. Additionally, the `ServiceItemDocsSerializer` included a `line_total` field that also doesn't exist in the model.

**Solution**:
1. Removed non-existent fields from both serializers
2. Added proper `total_price` read-only field using `SerializerMethodField`
3. Aligned all serializers with the actual model fields
4. Added proper documentation for fields

**Code Changes**:

```python
# Before
class ServiceItemSerializer(serializers.ModelSerializer):
    # ...
    class Meta:
        model = ServiceItem
        fields = ['id', 'service', 'service_id', 'name', 'description', 'quantity', 'unit_price', 
                 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
        ref_name = 'ServiceItemFull'
        
    def validate(self, data):
        # Calculate the line_total based on quantity and unit_price
        data['line_total'] = data['quantity'] * data['unit_price']
        return data

# After
class ServiceItemSerializer(serializers.ModelSerializer):
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        source='service',
        write_only=True
    )
    total_price = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = ServiceItem
        fields = ['id', 'service', 'service_id', 'item_type', 'name', 'description', 'quantity', 'unit_price', 
                 'total_price']
        read_only_fields = ['id', 'total_price']
        ref_name = 'ServiceItemFull'
    
    def get_total_price(self, obj):
        return obj.total_price
        
    def validate(self, data):
        # No need to modify data here, total_price is calculated by the model property
        return data
```

Similarly, the docs serializer was fixed:

```python
# Before
class ServiceItemDocsSerializer(serializers.ModelSerializer):
    service = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = ServiceItem
        fields = ('id', 'service', 'name', 'description', 'quantity', 'unit_price', 'line_total')
        ref_name = 'ServiceItemDocs'

# After
class ServiceItemDocsSerializer(serializers.ModelSerializer):
    service = serializers.PrimaryKeyRelatedField(read_only=True)
    total_price = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = ServiceItem
        fields = ('id', 'service', 'item_type', 'name', 'description', 'quantity', 'unit_price', 'total_price')
        ref_name = 'ServiceItemDocs'
        
    def get_total_price(self, obj):
        return obj.total_price
```

## Best Practices

1. **Always check model fields**: Before adding a field to a serializer, ensure it exists in the model or is properly defined as a SerializerMethodField
2. **Use separate serializers for docs**: Keep documentation serializers simpler to avoid circular references
3. **Add unique ref_name**: Always add a unique ref_name to serializers to avoid conflicts
4. **Test schema generation**: Always test both the Swagger UI and OpenAPI schema generation after making changes

## Future Improvements

1. **Automated testing**: Add automated tests for API schema generation
2. **Enhanced documentation**: Add more detailed descriptions for endpoints and parameters
3. **Custom operation descriptions**: Add custom descriptions for complex operations
