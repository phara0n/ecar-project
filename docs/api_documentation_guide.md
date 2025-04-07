# API Documentation Guide
## Updated: April 7th, 2025 (Reflecting Nginx Proxy)

## Overview

The ECAR Garage Management System provides a comprehensive REST API built with Django REST Framework. This document provides information on how to access and use the API documentation.

## Accessing API Documentation

The API documentation is available through Swagger UI and ReDoc, which provide interactive ways to explore and test the API endpoints. Access is now via the Nginx proxy running on port 80.

### Swagger UI
- **URL**: http://localhost/api/docs/
- Interactive documentation with request/response examples
- Ability to test API endpoints directly from the browser
- Authentication support using JWT tokens

### ReDoc
- **URL**: http://localhost/api/redoc/
- More user-friendly documentation for reading
- Better organization of endpoints by tags
- Cleaner presentation of schemas and models

### Raw Swagger Definitions
- **JSON**: http://localhost/api/swagger.json
- **YAML**: http://localhost/api/swagger.yaml

## Authentication

To use most API endpoints, you need to authenticate using JWT tokens:

1. Obtain a token by making a POST request to `/api/auth/token/` with your credentials (using `username` and `password`).
2. Include the token in the Authorization header: `Authorization: Bearer <your_token>`
3. For token refresh, use `/api/auth/token/refresh/`

In Swagger UI, you can authenticate by:
1. Click the "Authorize" button at the top
2. Enter your Bearer token (with the word "Bearer " before the token)
3. Click "Authorize" and close the dialog

## API Structure

The API is organized into the following categories (Note: Verify exact implementation via Swagger/ReDoc):

### Authentication Endpoints
- `POST /api/auth/token/`: Obtain JWT token (Requires `username`, `password`)
- `POST /api/auth/token/refresh/`: Refresh JWT token
- `POST /api/auth/register/`: Register a new user
- `POST /api/auth/change-password/`: Change password

### Customer Management
- `GET /api/customers/`: List all customers (Assumed paginated, returns objects with `id`, `first_name`, `last_name`)
- `POST /api/customers/`: Create a new customer
- `GET /api/customers/{id}/`: Retrieve a specific customer
- `PUT /api/customers/{id}/`: Update a customer
- `DELETE /api/customers/{id}/`: Delete a customer

### Vehicle Management
- `GET /api/cars/`: List all cars (Observed paginated, returns objects with nested `customer: {id: number, ...}`)
- `POST /api/cars/`: Register a new car (Expects `customer` field to be the customer ID number)
- `GET /api/cars/{id}/`: Retrieve a specific car
- `PUT /api/cars/{id}/`: Update a car
- `DELETE /api/cars/{id}/`: Delete a car
- `GET /api/cars/{id}/services/`: List services for a car
- `POST /api/cars/{id}/report_mileage/`: Report a new mileage reading
- `GET /api/cars/{id}/next_service_prediction/`: Get prediction for next service
- `GET /api/cars/{id}/mileage_history/`: Get mileage update history

### Mileage Update Management
- `GET /api/mileage-updates/`: List mileage updates
- `POST /api/mileage-updates/`: Create a new mileage update
- `GET /api/mileage-updates/{id}/`: Retrieve a specific mileage update
- `PUT /api/mileage-updates/{id}/`: Update a mileage update (admin only)
- `DELETE /api/mileage-updates/{id}/`: Delete a mileage update (admin only)

### Service Interval Management
- `GET /api/service-intervals/`: List service intervals
- `POST /api/service-intervals/`: Create a new service interval (admin only)
- `GET /api/service-intervals/{id}/`: Retrieve a specific service interval
- `PUT /api/service-intervals/{id}/`: Update a service interval (admin only)
- `DELETE /api/service-intervals/{id}/`: Delete a service interval (admin only)
- `GET /api/service-intervals/for_vehicle/`: Get intervals for a specific vehicle

### Service Management
- `GET /api/services/`: List all services
- `POST /api/services/`: Create a new service
- `GET /api/services/{id}/`: Retrieve a specific service
- `PUT /api/services/{id}/`: Update a service
- `DELETE /api/services/{id}/`: Delete a service

### Service Items
- `GET /api/service-items/`: List all service items
- `POST /api/service-items/`: Create a new service item
- `GET /api/service-items/{id}/`: Retrieve a specific service item
- `PUT /api/service-items/{id}/`: Update a service item
- `DELETE /api/service-items/{id}/`: Delete a service item

### Invoice Management
- `GET /api/invoices/`: List all invoices
- `POST /api/invoices/`: Create a new invoice
- `GET /api/invoices/{id}/`: Retrieve a specific invoice
- `PUT /api/invoices/{id}/`: Update an invoice
- `DELETE /api/invoices/{id}/`: Delete an invoice
- `POST /api/invoices/{id}/refund/`: Process a refund

### Notification Management
- `GET /api/notifications/`: List all notifications
- `POST /api/notifications/`: Create a new notification
- `GET /api/notifications/{id}/`: Retrieve a specific notification
- `PUT /api/notifications/{id}/`: Update a notification
- `DELETE /api/notifications/{id}/`: Delete a notification
- `PUT /api/notifications/{id}/mark-read/`: Mark notification as read

## Using the API Documentation

### Testing Endpoints
1. Navigate to http://localhost/api/docs/
2. Authenticate using the Authorize button
3. Expand the endpoint you want to test
4. Fill in the required parameters
5. Click "Execute" to send the request
6. View the response

### Understanding Models
Each API endpoint operates on specific data models. The models are documented in the "Schemas" section at the bottom of the Swagger UI / ReDoc pages. 
**Important:** Verify the schemas shown in Swagger/ReDoc against the actual backend code (`serializers.py`, `models.py`) for accuracy, especially for nested relationships (e.g., `customer` field within `Vehicle` response).

### Error Handling
API errors follow standard HTTP status codes:
- 400: Bad Request (invalid input)
- 401: Unauthorized (missing or invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (resource doesn't exist)
- 500: Server Error (internal problems)

Error responses include a detailed message and sometimes field-specific errors.

## Mileage-Based Service Prediction 

The ECAR system now includes a feature for predicting when a vehicle's next service will be due, based on its mileage history and defined service intervals.

### Core Endpoints

#### Report New Mileage
```
POST /api/cars/{id}/report_mileage/
{
    "mileage": 45000,
    "notes": "Optional notes about this update"
}
```

This endpoint allows car owners to report their current mileage, which updates the car's mileage record and recalculates the next service prediction.

#### Get Next Service Prediction
```
GET /api/cars/{id}/next_service_prediction/
```

Returns a prediction for when the car's next service will be due, based on its mileage history and applicable service intervals.

Example response:
```json
{
    "has_prediction": true,
    "next_service_date": "2025-07-15",
    "next_service_mileage": 50000,
    "days_until_service": 104,
    "mileage_until_service": 5000,
    "average_daily_mileage": 48.1,
    "service_type": "Regular Maintenance",
    "service_description": "Oil change, filter replacement, and general inspection"
}
```

#### Get Mileage History
```
GET /api/cars/{id}/mileage_history/
```

Returns the history of mileage updates for a car, ordered by date (newest first).

#### Get Vehicle-Specific Service Intervals
```
GET /api/service-intervals/for_vehicle/?make=Toyota&model=Corolla
```

Returns the service intervals applicable to a specific vehicle make and model, ordered from most specific to most general.

### Related Models

#### MileageUpdate
- `car`: The car this update is for
- `mileage`: Current mileage reading
- `reported_date`: When the mileage was reported
- `notes`: Optional notes about this update

#### ServiceInterval
- `name`: Name of the service type
- `description`: Detailed description of what the service includes
- `interval_type`: Mileage-based, time-based, or both
- `mileage_interval`: How many kilometers between services
- `time_interval_days`: How many days between services
- `car_make`: Optional, specific car make this applies to
- `car_model`: Optional, specific car model this applies to
- `is_active`: Whether this interval is currently active

## Best Practices

1. **Authentication**: Always store tokens securely
2. **Error Handling**: Check for error responses and handle them appropriately
3. **Pagination**: For list endpoints, respect pagination parameters
4. **Filtering**: Use available filters to minimize data transfer
5. **File Uploads**: Use proper multipart/form-data content type for file uploads
6. **Rate Limiting**: Be aware of rate limits on authentication endpoints

## Development and Testing

### Testing Tools
- Swagger UI: Built-in testing capability (at `http://localhost/api/docs/`)
- ReDoc: Documentation viewing (at `http://localhost/api/redoc/`)
- Postman: More advanced API testing
- curl: Command-line API testing

### Environment Configuration
- Development (Local Docker w/ Nginx): `http://localhost/api/` 
- Production: `https://ecar.tn/api/` (Example)

## Future API Enhancements

1. Enhanced filtering and searching
2. Bulk operations for multiple resources
3. Advanced reporting endpoints
4. Mobile-specific optimized endpoints
5. Webhook integration for events

## Additional Resources

- [Django REST Framework Documentation](https://www.django-rest-framework.org/)
- [JWT Authentication Guide](https://django-rest-framework-simplejwt.readthedocs.io/en/latest/)
- [OpenAPI Specification](https://swagger.io/specification/) 