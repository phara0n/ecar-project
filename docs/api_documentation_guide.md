# ECAR API Documentation Guide

## Overview

The ECAR system provides a comprehensive RESTful API for interfacing with the garage management system. This document explains how to access and use the API documentation.

## Accessing the API Documentation

The API documentation is accessible through two different interfaces:

1. **Swagger UI**: A modern, interactive documentation interface
   - URL: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)
   - Features:
     - Interactive API testing
     - Request/response examples
     - Authentication support
     - Schema definitions

2. **ReDoc**: A responsive, mobile-friendly documentation interface
   - URL: [http://localhost:8000/api/redoc/](http://localhost:8000/api/redoc/)
   - Features:
     - Clean, readable layout
     - Schema-focused organization
     - Searchable content

## Authentication

To test authenticated endpoints in the Swagger UI:

1. Obtain a JWT token by using the `/api/token/` endpoint
2. Click the "Authorize" button at the top of the Swagger UI
3. In the "Value" field, enter: `Bearer YOUR_TOKEN_HERE`
4. Click "Authorize" to apply the token to all subsequent requests

## Available Endpoints

The API is organized around the following main resources:

| Resource | Base URL | Description |
|----------|----------|-------------|
| Users | `/api/users/` | User account management |
| Customers | `/api/customers/` | Customer profile management |
| Cars | `/api/cars/` | Vehicle management |
| Services | `/api/services/` | Service appointment management |
| Service Items | `/api/service-items/` | Individual service tasks |
| Invoices | `/api/invoices/` | Invoice management |
| Notifications | `/api/notifications/` | System notifications |

## Filtering, Searching, and Ordering

The API supports advanced filtering, searching, and ordering capabilities:

### Filtering

Use query parameters to filter results:

```
GET /api/customers/?phone=21612345678
GET /api/cars/?make=Toyota&year=2020
```

### Searching

Use the `search` parameter to perform text searches:

```
GET /api/customers/?search=Doe
```

### Ordering

Use the `ordering` parameter to sort results:

```
GET /api/services/?ordering=-scheduled_date
```

Use a minus sign (`-`) to indicate descending order.

## API Documentation Maintenance

The API documentation is automatically generated from the codebase using the `drf-yasg` package. To improve the documentation:

1. Add detailed docstrings to API views and viewsets
2. Include parameter descriptions and response examples
3. Use proper ReStructuredText (reST) formatting in docstrings

Example of a well-documented view method:

```python
@action(detail=True, methods=['get'])
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
```

## Next Steps

To further enhance the API documentation:

1. Add detailed docstrings to all remaining viewsets
2. Include more example requests and responses
3. Create custom schemas for complex data structures
4. Add operation IDs for consistent API reference

---

Last updated: April 2, 2025
Created by: Claude AI Assistant 