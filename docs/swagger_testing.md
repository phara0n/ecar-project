# Testing Swagger Documentation

This document provides instructions for testing the Swagger documentation for the ECAR API.

## Accessing Swagger Documentation

The Swagger documentation for the ECAR API is available at the following URLs:

- **Swagger UI**: `http://localhost:8000/api/docs/`
- **ReDoc UI**: `http://localhost:8000/api/redoc/`
- **Swagger JSON**: `http://localhost:8000/api/swagger.json`
- **Swagger YAML**: `http://localhost:8000/api/swagger.yaml`

## Running the Local Server

To test the Swagger documentation locally, follow these steps:

1. Navigate to the project directory:
   ```bash
   cd /home/ecar/ecar_project
   ```

2. Stop any running Docker containers:
   ```bash
   docker-compose down
   ```

3. Make sure all required dependencies are installed:
   ```bash
   cd backend
   source .venv/bin/activate
   pip install django-filter drf-yasg
   ```

4. Run the local server:
   ```bash
   cd /home/ecar/ecar_project
   ./run_local_server.sh
   ```

5. Access the Swagger UI at `http://localhost:8000/api/docs/`

## Verifying Endpoint Documentation

For each endpoint, verify the following:

1. **Correct HTTP Method**: Check that the endpoint has the correct HTTP method (GET, POST, PUT, DELETE, etc.)
2. **Operation Summary**: Check that the operation summary is clear and concise
3. **Operation Description**: Check that the operation description provides useful information about the endpoint
4. **Request Body**: Check that the request body schema is accurate and includes all required fields
5. **Response Codes**: Check that all possible response codes are documented with appropriate descriptions
6. **Tags**: Check that the endpoint is properly tagged for organization in the Swagger UI

## Testing Admin Login Endpoint

To specifically test the `admin_login` endpoint:

1. Access the Swagger UI at `http://localhost:8000/api/docs/`
2. Find the `/api/admin-login/` endpoint in the "Authentication" section
3. Click on the endpoint to expand it
4. Verify that it has the following:
   - Method: POST
   - Summary: "Admin login"
   - Description about its purpose
   - Request body with username and password fields
   - Response codes for success (200) and various error conditions (400, 401, 403)

5. Click the "Try it out" button
6. Enter valid admin credentials in the request body:
   ```json
   {
     "username": "admin",
     "password": "your_password"
   }
   ```
7. Click "Execute" and verify that you receive a 200 response with the expected format

## Adding Documentation to New Endpoints

When adding new endpoints, use the following pattern for Swagger documentation:

```python
@swagger_auto_schema(
    method='post',  # Specify the HTTP method if using @api_view with multiple methods
    operation_summary="Short summary",
    operation_description="Detailed description",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['field1', 'field2'],
        properties={
            'field1': openapi.Schema(type=openapi.TYPE_STRING, description='Description'),
            'field2': openapi.Schema(type=openapi.TYPE_INTEGER, description='Description'),
        }
    ),
    responses={
        200: openapi.Response('Success description', schema=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'result': openapi.Schema(type=openapi.TYPE_STRING, description='Description'),
            }
        )),
        400: 'Error description',
        401: 'Unauthorized description',
        403: 'Permission denied description'
    },
    tags=['Category']
)
```

## Common Issues and Solutions

1. **Missing Dependencies**:
   - Error: `ModuleNotFoundError: No module named 'drf_yasg'` or `ModuleNotFoundError: No module named 'django_filters'`
   - Solution: Install the missing packages with `pip install drf-yasg django-filter`

2. **AssertionError with Multi-Method Decorators**:
   - Error: `AssertionError: on multi-method api_view or action, you must specify swagger_auto_schema on a per-method basis`
   - Solution: Add the `method='post'` parameter to the `@swagger_auto_schema` decorator

3. **Recursion Errors**:
   - Error: `RecursionError: maximum recursion depth exceeded`
   - Solution: Check for circular references in your serializers or nested relationships

4. **Schema Generation Errors**:
   - Error: `AttributeError: 'AutoSchema' object has no attribute 'get_operation'`
   - Solution: Make sure you're using the correct schema class for your viewsets

## Conclusion

Properly documented API endpoints make it easier for frontend developers, mobile app developers, and API consumers to understand and use your API. Always ensure that your Swagger documentation is accurate and up-to-date.

For any issues with the Swagger documentation, check the Django server logs for errors or refer to the [drf-yasg documentation](https://drf-yasg.readthedocs.io/en/stable/). 