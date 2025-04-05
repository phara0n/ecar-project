# ECAR API Documentation

## API Overview

ECAR provides a comprehensive REST API that supports various operations for the garage management system. The API is secured with JWT authentication and supports filtering, pagination, and search capabilities.

### API Features

- **Authentication**: JWT-based authentication for secure access
- **Authorization**: Role-based access control (RBAC) for admin vs. mobile users
- **Filtering**: Advanced filtering capabilities using django-filter
- **Pagination**: Limit/offset pagination for all list endpoints
- **Search**: Text search across multiple fields
- **Rate Limiting**: Protection against abuse through rate limiting

## Authentication

### Obtain JWT Token
```
POST /api/token/
```

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "yourpassword"
}
```

**Response:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Refresh Token
```
POST /api/token/refresh/
```

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Register User
```
POST /api/register/
```

**Request Body:**
```json
{
  "username": "user@example.com",
  "email": "user@example.com",
  "password": "yourpassword",
  "password_confirm": "yourpassword",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "21612345678",
  "address": "123 Street, City, Tunisia"
}
```

**Response:**
```json
{
  "detail": "User registered successfully"
}
```

### Change Password
```
PATCH /api/change-password/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Request Body:**
```json
{
  "old_password": "oldpassword",
  "new_password": "newpassword",
  "confirm_password": "newpassword"
}
```

**Response:**
```json
{
  "detail": "Password updated successfully"
}
```

## Filtering

The API supports advanced filtering capabilities using django-filter. You can filter resources by various attributes using query parameters.

### Example: Filtering Services by Status

```
GET /api/services/?status=pending
```

This returns all services with a "pending" status.

### Example: Filtering Cars by Make and Year

```
GET /api/cars/?make=Toyota&year=2020
```

This returns all Toyota cars manufactured in 2020.

### Multiple Value Filtering

Some endpoints support filtering by multiple values for a single attribute:

```
GET /api/services/?status=pending&status=in_progress
```

This returns services with either "pending" or "in_progress" status.

## Customers

### List Customers
```
GET /api/customers/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Query Parameters:**
```
search - Optional search term to filter customers by name, email, or phone (staff only)
```

**Response:**
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "user": {
        "id": 2,
        "username": "john.doe",
        "email": "john.doe@example.com",
        "first_name": "John",
        "last_name": "Doe"
      },
      "phone": "21612345678",
      "address": "123 Street, City, Tunisia",
      "created_at": "2023-04-01T12:00:00Z",
      "updated_at": "2023-04-01T12:00:00Z"
    }
  ]
}
```

### Get Customer Profile
```
GET /api/customers/me/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
```json
{
  "id": 1,
  "user": {
    "id": 2,
    "username": "john.doe",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "phone": "21612345678",
  "address": "123 Street, City, Tunisia",
  "created_at": "2023-04-01T12:00:00Z",
  "updated_at": "2023-04-01T12:00:00Z"
}
```

### Get Customer Statistics
```
GET /api/customers/{customer_id}/statistics/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
```json
{
  "total_cars": 2,
  "total_services": 5,
  "completed_services": 3,
  "total_amount_spent": 350.75,
  "paid_invoices": 3,
  "pending_invoices": 1,
  "last_service_date": "2023-04-15T10:00:00Z"
}
```

### Get Customer Service History
```
GET /api/customers/{customer_id}/service_history/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
```json
[
  {
    "id": 1,
    "car": 1,
    "car_details": {
      "id": 1,
      "customer": 1,
      "customer_name": "John Doe",
      "make": "Toyota",
      "model": "Corolla",
      "year": 2020,
      "license_plate": "123ABC",
      "vin": "1HGBH41JXMN109186",
      "fuel_type": "gasoline",
      "mileage": 15000,
      "created_at": "2023-04-01T12:00:00Z",
      "updated_at": "2023-04-01T12:00:00Z"
    },
    "title": "Oil Change",
    "description": "Regular oil change service",
    "status": "completed",
    "scheduled_date": "2023-04-15T10:00:00Z",
    "completed_date": "2023-04-15T11:30:00Z",
    "technician_notes": "Used synthetic oil",
    "created_at": "2023-04-10T12:00:00Z",
    "updated_at": "2023-04-15T11:30:00Z",
    "items": []
  },
  // ... more services
]
```

### Update Customer Address
```
PATCH /api/customers/{customer_id}/update_address/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Request Body:**
```json
{
  "address": "456 New Street, Tunis, Tunisia"
}
```

**Response:**
```json
{
  "id": 1,
  "user": {
    "id": 2,
    "username": "john.doe",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "phone": "21612345678",
  "address": "456 New Street, Tunis, Tunisia",
  "created_at": "2023-04-01T12:00:00Z",
  "updated_at": "2023-04-01T12:30:00Z"
}
```

### Get Customer Cars
```
GET /api/customers/{customer_id}/cars/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
```json
[
  {
    "id": 1,
    "customer": 1,
    "customer_name": "John Doe",
    "make": "Toyota",
    "model": "Corolla",
    "year": 2020,
    "license_plate": "123ABC",
    "vin": "1HGBH41JXMN109186",
    "fuel_type": "gasoline",
    "mileage": 15000,
    "created_at": "2023-04-01T12:00:00Z",
    "updated_at": "2023-04-01T12:00:00Z"
  },
  // ... more cars
]
```

### Bulk Create Customers (Admin Only)
```
POST /api/customers/bulk_create/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: multipart/form-data
```

**Form Data:**
```
file: [CSV file with customer data]
```

**CSV Format:**
```
email,first_name,last_name,phone,address
user1@example.com,John,Doe,21612345678,123 Street Tunis
user2@example.com,Jane,Smith,21687654321,456 Avenue Sfax
```

**Response:**
```json
{
  "created_customers": 2,
  "errors": []
}
```

### Export Customers (Admin Only)
```
GET /api/customers/export/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
```
CSV file download with customer data
```

## Cars

### List Cars
```
GET /api/cars/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "customer": 1,
      "customer_name": "John Doe",
      "make": "Toyota",
      "model": "Corolla",
      "year": 2020,
      "license_plate": "123ABC",
      "vin": "1HGBH41JXMN109186",
      "fuel_type": "gasoline",
      "mileage": 15000,
      "initial_mileage": 14500,
      "average_daily_mileage": 50.0,
      "next_service_date": "2023-10-01",
      "next_service_mileage": 25000,
      "created_at": "2023-04-01T12:00:00Z",
      "updated_at": "2023-04-01T12:00:00Z"
    }
  ]
}
```

### Create Car
```
POST /api/cars/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Request Body:**
```json
{
  "customer": 1,
  "make": "Toyota",
  "model": "Corolla",
  "year": 2020,
  "license_plate": "123ABC",
  "vin": "1HGBH41JXMN109186",
  "fuel_type": "gasoline",
  "mileage": 15000,
  "initial_mileage": 15000
}
```

**Notes about `initial_mileage`**:
- `initial_mileage` represents the odometer reading when the car first enters the system
- If not specified during creation, it will automatically be set to the same value as `mileage`
- Once set, `initial_mileage` can only be modified by superadmins
- This field is used as the absolute baseline for all average daily mileage calculations
- For pre-owned vehicles, it should be set to the actual odometer reading at the time of registration
- Regular users can only read this field; it's read-only for all non-superadmin users

**Response:**
```json
{
  "id": 1,
  "customer": 1,
  "customer_name": "John Doe",
  "make": "Toyota",
  "model": "Corolla",
  "year": 2020,
  "license_plate": "123ABC",
  "vin": "1HGBH41JXMN109186",
  "fuel_type": "gasoline",
  "mileage": 15000,
  "initial_mileage": 15000,
  "average_daily_mileage": 50.0,
  "next_service_date": null,
  "next_service_mileage": null,
  "created_at": "2023-04-01T12:00:00Z",
  "updated_at": "2023-04-01T12:00:00Z"
}
```

### Update Car
```
PUT /api/cars/{id}/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Request Body:**
```json
{
  "customer": 1,
  "make": "Toyota",
  "model": "Corolla",
  "year": 2020,
  "license_plate": "123ABC",
  "vin": "1HGBH41JXMN109186",
  "fuel_type": "gasoline",
  "mileage": 16000
}
```

**Note**: The `initial_mileage` field cannot be modified by regular users or through the API. Only superadmins can change this value through the Django admin interface.

**Response:**
```json
{
  "id": 1,
  "customer": 1,
  "customer_name": "John Doe",
  "make": "Toyota",
  "model": "Corolla",
  "year": 2020,
  "license_plate": "123ABC",
  "vin": "1HGBH41JXMN109186",
  "fuel_type": "gasoline",
  "mileage": 16000,
  "initial_mileage": 15000,
  "average_daily_mileage": 50.0,
  "next_service_date": "2023-10-01",
  "next_service_mileage": 25000,
  "created_at": "2023-04-01T12:00:00Z",
  "updated_at": "2023-04-01T13:00:00Z"
}
```

### Get Car Services
```
GET /api/cars/1/services/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
```json
[
  {
    "id": 1,
    "car": 1,
    "car_details": {
      "id": 1,
      "customer": 1,
      "customer_name": "John Doe",
      "make": "Toyota",
      "model": "Corolla",
      "year": 2020,
      "license_plate": "123ABC",
      "vin": "1HGBH41JXMN109186",
      "fuel_type": "gasoline",
      "mileage": 15000,
      "created_at": "2023-04-01T12:00:00Z",
      "updated_at": "2023-04-01T12:00:00Z"
    },
    "title": "Oil Change",
    "description": "Regular oil change service",
    "status": "completed",
    "scheduled_date": "2023-04-15T10:00:00Z",
    "completed_date": "2023-04-15T11:30:00Z",
    "technician_notes": "Used synthetic oil",
    "created_at": "2023-04-10T12:00:00Z",
    "updated_at": "2023-04-15T11:30:00Z",
    "items": []
  }
]
```

## Services

### List Services
```
GET /api/services/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Query Parameters:**
```
status - Filter by status (scheduled, in_progress, completed, cancelled)
car - Filter by car ID
date_from - Filter by scheduled date (ISO format, e.g., 2023-04-01)
date_to - Filter by scheduled date (ISO format, e.g., 2023-04-30)
search - Search by title or description
order_by - Order by field (default: -scheduled_date)
```

**Response:**
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "car": 1,
      "car_details": {
        "id": 1,
        "customer": 1,
        "customer_name": "John Doe",
        "make": "Toyota",
        "model": "Corolla",
        "year": 2020,
        "license_plate": "123ABC",
        "vin": "1HGBH41JXMN109186",
        "fuel_type": "gasoline",
        "mileage": 15000,
        "created_at": "2023-04-01T12:00:00Z",
        "updated_at": "2023-04-01T12:00:00Z"
      },
      "title": "Oil Change",
      "description": "Regular oil change service",
      "status": "completed",
      "scheduled_date": "2023-04-15T10:00:00Z",
      "completed_date": "2023-04-15T11:30:00Z",
      "technician_notes": "Used synthetic oil",
      "created_at": "2023-04-10T12:00:00Z",
      "updated_at": "2023-04-15T11:30:00Z",
      "items": []
    }
  ]
}
```

### Get Service Details
```
GET /api/services/{id}/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
```json
{
  "id": 1,
  "car": 1,
  "car_details": {
    "id": 1,
    "customer": 1,
    "customer_name": "John Doe",
    "make": "Toyota",
    "model": "Corolla",
    "year": 2020,
    "license_plate": "123ABC",
    "vin": "1HGBH41JXMN109186",
    "fuel_type": "gasoline",
    "mileage": 15000,
    "created_at": "2023-04-01T12:00:00Z",
    "updated_at": "2023-04-01T12:00:00Z"
  },
  "title": "Oil Change",
  "description": "Regular oil change service",
  "status": "completed",
  "scheduled_date": "2023-04-15T10:00:00Z",
  "completed_date": "2023-04-15T11:30:00Z",
  "technician_notes": "Used synthetic oil",
  "created_at": "2023-04-10T12:00:00Z",
  "updated_at": "2023-04-15T11:30:00Z",
  "items": []
}
```

### Create Service
```
POST /api/services/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Request Body:**
```json
{
  "car": 1,
  "title": "Oil Change",
  "description": "Regular oil change service",
  "status": "scheduled",
  "scheduled_date": "2023-04-15T10:00:00Z"
}
```

**Response:**
```json
{
  "id": 1,
  "car": 1,
  "car_details": {
    "id": 1,
    "customer": 1,
    "customer_name": "John Doe",
    "make": "Toyota",
    "model": "Corolla",
    "year": 2020,
    "license_plate": "123ABC",
    "vin": "1HGBH41JXMN109186",
    "fuel_type": "gasoline",
    "mileage": 15000,
    "created_at": "2023-04-01T12:00:00Z",
    "updated_at": "2023-04-01T12:00:00Z"
  },
  "title": "Oil Change",
  "description": "Regular oil change service",
  "status": "scheduled",
  "scheduled_date": "2023-04-15T10:00:00Z",
  "completed_date": null,
  "technician_notes": null,
  "created_at": "2023-04-10T12:00:00Z",
  "updated_at": "2023-04-10T12:00:00Z",
  "items": []
}
```

### Update Service
```
PUT /api/services/{id}/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Request Body:**
```json
{
  "car": 1,
  "title": "Oil Change and Filter Replacement",
  "description": "Regular oil change service with new filter",
  "status": "in_progress",
  "scheduled_date": "2023-04-15T10:00:00Z"
}
```

**Response:**
Same format as Get Service Details

### Delete Service
```
DELETE /api/services/{id}/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
```
204 No Content
```

### Get Service Items
```
GET /api/services/{id}/items/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
```json
[
  {
    "id": 1,
    "service": 1,
    "item_type": "part",
    "name": "Oil Filter",
    "description": "OEM oil filter",
    "quantity": 1,
    "unit_price": "15.00",
    "total_price": "15.00"
  },
  {
    "id": 2,
    "service": 1,
    "item_type": "labor",
    "name": "Oil Change",
    "description": "Labor cost for oil change",
    "quantity": 1,
    "unit_price": "35.00",
    "total_price": "35.00"
  }
]
```

### Get Service Invoice
```
GET /api/services/{id}/invoice/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
```json
{
  "id": 1,
  "service": 1,
  "service_details": {
    "id": 1,
    "car": 1,
    "car_details": {
      "id": 1,
      "customer": 1,
      "customer_name": "John Doe",
      "make": "Toyota",
      "model": "Corolla",
      "year": 2020,
      "license_plate": "123ABC",
      "vin": "1HGBH41JXMN109186",
      "fuel_type": "gasoline",
      "mileage": 15000,
      "created_at": "2023-04-01T12:00:00Z",
      "updated_at": "2023-04-01T12:00:00Z"
    },
    "title": "Oil Change",
    "description": "Regular oil change service",
    "status": "completed",
    "scheduled_date": "2023-04-15T10:00:00Z",
    "completed_date": "2023-04-15T11:30:00Z",
    "technician_notes": "Used synthetic oil",
    "created_at": "2023-04-10T12:00:00Z",
    "updated_at": "2023-04-15T11:30:00Z",
    "items": []
  },
  "invoice_number": "INV-12345678",
  "issued_date": "2023-04-15",
  "due_date": "2023-04-30",
  "status": "paid",
  "notes": "Payment received",
  "tax_rate": "19.00",
  "pdf_file": "/media/invoices/invoice_12345678.pdf",
  "created_at": "2023-04-15T12:00:00Z",
  "updated_at": "2023-04-15T12:00:00Z",
  "subtotal": "50.00",
  "tax_amount": "9.50",
  "total": "59.50"
}
```

### Mark Service as Completed
```
POST /api/services/{id}/complete/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Request Body:**
```json
{
  "technician_notes": "Service completed - used synthetic oil"
}
```

**Response:**
```json
{
  "id": 1,
  "car": 1,
  "car_details": {
    "id": 1,
    "customer": 1,
    "customer_name": "John Doe",
    "make": "Toyota",
    "model": "Corolla",
    "year": 2020,
    "license_plate": "123ABC",
    "vin": "1HGBH41JXMN109186",
    "fuel_type": "gasoline",
    "mileage": 15000,
    "created_at": "2023-04-01T12:00:00Z",
    "updated_at": "2023-04-01T12:00:00Z"
  },
  "title": "Oil Change",
  "description": "Regular oil change service",
  "status": "completed",
  "scheduled_date": "2023-04-15T10:00:00Z",
  "completed_date": "2023-04-15T11:30:00Z",
  "technician_notes": "Service completed - used synthetic oil",
  "created_at": "2023-04-10T12:00:00Z",
  "updated_at": "2023-04-15T11:30:00Z",
  "items": []
}
```

### Cancel Service
```
POST /api/services/{id}/cancel/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Request Body:**
```json
{
  "reason": "Customer canceled appointment"
}
```

**Response:**
```json
{
  "id": 1,
  "car": 1,
  "car_details": {
    "id": 1,
    "customer": 1,
    "customer_name": "John Doe",
    "make": "Toyota",
    "model": "Corolla",
    "year": 2020,
    "license_plate": "123ABC",
    "vin": "1HGBH41JXMN109186",
    "fuel_type": "gasoline",
    "mileage": 15000,
    "created_at": "2023-04-01T12:00:00Z",
    "updated_at": "2023-04-01T12:00:00Z"
  },
  "title": "Oil Change",
  "description": "Regular oil change service",
  "status": "cancelled",
  "scheduled_date": "2023-04-15T10:00:00Z",
  "completed_date": null,
  "technician_notes": "Cancelled: Customer canceled appointment",
  "created_at": "2023-04-10T12:00:00Z",
  "updated_at": "2023-04-15T11:30:00Z",
  "items": []
}
```

### Reschedule Service
```
POST /api/services/{id}/reschedule/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Request Body:**
```json
{
  "scheduled_date": "2023-04-20T10:00:00Z"
}
```

**Response:**
```json
{
  "id": 1,
  "car": 1,
  "car_details": {
    "id": 1,
    "customer": 1,
    "customer_name": "John Doe",
    "make": "Toyota",
    "model": "Corolla",
    "year": 2020,
    "license_plate": "123ABC",
    "vin": "1HGBH41JXMN109186",
    "fuel_type": "gasoline",
    "mileage": 15000,
    "created_at": "2023-04-01T12:00:00Z",
    "updated_at": "2023-04-01T12:00:00Z"
  },
  "title": "Oil Change",
  "description": "Regular oil change service",
  "status": "scheduled",
  "scheduled_date": "2023-04-20T10:00:00Z",
  "completed_date": null,
  "technician_notes": "[2023-04-15 11:30] Service rescheduled to 2023-04-20T10:00:00Z.",
  "created_at": "2023-04-10T12:00:00Z",
  "updated_at": "2023-04-15T11:30:00Z",
  "items": []
}
```

### Get Upcoming Services
```
GET /api/services/upcoming/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "car": 1,
      "car_details": {
        "id": 1,
        "customer": 1,
        "customer_name": "John Doe",
        "make": "Toyota",
        "model": "Corolla",
        "year": 2020,
        "license_plate": "123ABC",
        "vin": "1HGBH41JXMN109186",
        "fuel_type": "gasoline",
        "mileage": 15000,
        "created_at": "2023-04-01T12:00:00Z",
        "updated_at": "2023-04-01T12:00:00Z"
      },
      "title": "Oil Change",
      "description": "Regular oil change service",
      "status": "scheduled",
      "scheduled_date": "2023-04-15T10:00:00Z",
      "completed_date": null,
      "technician_notes": null,
      "created_at": "2023-04-10T12:00:00Z",
      "updated_at": "2023-04-10T12:00:00Z",
      "items": []
    }
  ]
}
```

### Get In-Progress Services
```
GET /api/services/in_progress/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
Similar to the Get Upcoming Services response but with services that have status="in_progress"

### Get Completed Services
```
GET /api/services/completed/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
Similar to the Get Upcoming Services response but with services that have status="completed"

### Get Service Statistics
```
GET /api/services/statistics/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
```json
{
  "by_status": {
    "scheduled": 5,
    "in_progress": 3,
    "completed": 12,
    "cancelled": 2,
    "total": 22
  },
  "by_date_range": {
    "today": 3,
    "this_week": 8,
    "this_month": 15
  }
}
```

### Bulk Update Services (Admin Only)
```
POST /api/services/bulk_update/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: multipart/form-data
```

**Form Data:**
```
file: [CSV file with service data]
```

**CSV Format:**
```
id,status,technician_notes
1,completed,Oil change completed
2,in_progress,Waiting for parts
3,cancelled,Customer cancelled
```

**Response:**
```json
{
  "updated_services": 3,
  "errors": []
}
```

### Send Service Completion SMS
```
POST /api/services/{service_id}/send_sms_notification/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

> Note: Only staff users can trigger SMS notifications.

**Response (Success):**
```json
{
  "detail": "SMS notification sent successfully"
}
```

**Response (Failed):**
```json
{
  "detail": "SMS notification skipped: No phone number available"
}
```

**Response (Error):**
```json
{
  "detail": "Failed to send SMS notification: Error message from SMS provider"
}
```

## Invoices

### List Invoices
```
GET /api/invoices/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Query Parameters:**
```
status - Filter by status (draft, pending, paid, cancelled)
date_from - Filter by issued date (ISO format, e.g., 2023-04-01)
date_to - Filter by issued date (ISO format, e.g., 2023-04-30)
service - Filter by service ID
customer - Filter by customer ID (staff only)
search - Search by invoice number or notes
order_by - Order by field (default: -issued_date)
```

**Response:**
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "service": 1,
      "service_details": {
        "id": 1,
        "car": 1,
        "car_details": {
          "id": 1,
          "customer": 1,
          "customer_name": "John Doe",
          "make": "Toyota",
          "model": "Corolla",
          "year": 2020,
          "license_plate": "123ABC",
          "vin": "1HGBH41JXMN109186",
          "fuel_type": "gasoline",
          "mileage": 15000,
          "created_at": "2023-04-01T12:00:00Z",
          "updated_at": "2023-04-01T12:00:00Z"
        },
        "title": "Oil Change",
        "description": "Regular oil change service",
        "status": "completed",
        "scheduled_date": "2023-04-15T10:00:00Z",
        "completed_date": "2023-04-15T11:30:00Z",
        "technician_notes": "Used synthetic oil",
        "created_at": "2023-04-10T12:00:00Z",
        "updated_at": "2023-04-15T11:30:00Z",
        "items": []
      },
      "invoice_number": "INV-12345678",
      "issued_date": "2023-04-15",
      "due_date": "2023-04-30",
      "status": "paid",
      "notes": "Payment received",
      "tax_rate": "19.00",
      "pdf_file": "/media/invoices/invoice_12345678.pdf",
      "created_at": "2023-04-15T12:00:00Z",
      "updated_at": "2023-04-15T12:00:00Z",
      "subtotal": "50.00",
      "tax_amount": "9.50",
      "total": "59.50"
    }
  ]
}
```

### Get Invoice Details
```
GET /api/invoices/{id}/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
```json
{
  "id": 1,
  "service": 1,
  "service_details": {
    "id": 1,
    "car": 1,
    "car_details": {
      "id": 1,
      "customer": 1,
      "customer_name": "John Doe",
      "make": "Toyota",
      "model": "Corolla",
      "year": 2020,
      "license_plate": "123ABC",
      "vin": "1HGBH41JXMN109186",
      "fuel_type": "gasoline",
      "mileage": 15000,
      "created_at": "2023-04-01T12:00:00Z",
      "updated_at": "2023-04-01T12:00:00Z"
    },
    "title": "Oil Change",
    "description": "Regular oil change service",
    "status": "completed",
    "scheduled_date": "2023-04-15T10:00:00Z",
    "completed_date": "2023-04-15T11:30:00Z",
    "technician_notes": "Used synthetic oil",
    "created_at": "2023-04-10T12:00:00Z",
    "updated_at": "2023-04-15T11:30:00Z",
    "items": []
  },
  "invoice_number": "INV-12345678",
  "issued_date": "2023-04-15",
  "due_date": "2023-04-30",
  "status": "paid",
  "notes": "Payment received",
  "tax_rate": "19.00",
  "pdf_file": "/media/invoices/invoice_12345678.pdf",
  "created_at": "2023-04-15T12:00:00Z",
  "updated_at": "2023-04-15T12:00:00Z",
  "subtotal": "50.00",
  "tax_amount": "9.50",
  "total": "59.50"
}
```

### Create Invoice with PDF Upload
```
POST /api/invoices/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: multipart/form-data
```

**Form Data:**
```
service: 1
invoice_number: INV-12345678
issued_date: 2023-04-15
due_date: 2023-04-30
status: pending
notes: New invoice for oil change
tax_rate: 19.00
pdf_file: [PDF file upload]
```

**Response:**
```json
{
  "id": 1,
  "service": 1,
  "service_details": {
    "id": 1,
    "car": 1,
    "car_details": {
      "id": 1,
      "customer": 1,
      "customer_name": "John Doe",
      "make": "Toyota",
      "model": "Corolla",
      "year": 2020,
      "license_plate": "123ABC",
      "vin": "1HGBH41JXMN109186",
      "fuel_type": "gasoline",
      "mileage": 15000,
      "created_at": "2023-04-01T12:00:00Z",
      "updated_at": "2023-04-01T12:00:00Z"
    },
    "title": "Oil Change",
    "description": "Regular oil change service",
    "status": "completed",
    "scheduled_date": "2023-04-15T10:00:00Z",
    "completed_date": "2023-04-15T11:30:00Z",
    "technician_notes": "Used synthetic oil",
    "created_at": "2023-04-10T12:00:00Z",
    "updated_at": "2023-04-15T11:30:00Z",
    "items": []
  },
  "invoice_number": "INV-12345678",
  "issued_date": "2023-04-15",
  "due_date": "2023-04-30",
  "status": "pending",
  "notes": "New invoice for oil change",
  "tax_rate": "19.00",
  "pdf_file": "/media/invoices/invoice_12345678.pdf",
  "created_at": "2023-04-15T12:00:00Z",
  "updated_at": "2023-04-15T12:00:00Z",
  "subtotal": "50.00",
  "tax_amount": "9.50",
  "total": "59.50"
}
```

### Update Invoice
```
PUT /api/invoices/{id}/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: multipart/form-data
```

**Form Data:**
```
service: 1
invoice_number: INV-12345678
issued_date: 2023-04-15
due_date: 2023-04-30
status: paid
notes: Invoice paid on April 20
tax_rate: 19.00
pdf_file: [Optional PDF file upload]
```

**Response:**
Same format as Get Invoice Details

### Delete Invoice
```
DELETE /api/invoices/{id}/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
```
204 No Content
```

### Download Invoice PDF
```
GET /api/invoices/{id}/download/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
```
PDF file download
```

### Upload PDF for Existing Invoice
```
POST /api/invoices/{id}/upload_pdf/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: multipart/form-data
```

**Form Data:**
```
pdf_file: [PDF file upload]
```

**Response:**
Same format as Get Invoice Details

### Mark Invoice as Paid
```
POST /api/invoices/{id}/mark_as_paid/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Request Body:**
```json
{
  "payment_notes": "Paid via bank transfer on April 20"
}
```

**Response:**
Same format as Get Invoice Details

### Get Unpaid Invoices
```
GET /api/invoices/unpaid/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
Similar to List Invoices response but only showing invoices with status="pending"

### Get Paid Invoices
```
GET /api/invoices/paid/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
Similar to List Invoices response but only showing invoices with status="paid"

### Get Invoice Statistics
```
GET /api/invoices/statistics/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
```json
{
  "by_status": {
    "draft": 3,
    "pending": 7,
    "paid": 15,
    "cancelled": 1,
    "total": 26
  },
  "financials": {
    "total_amount": 2457.50,
    "total_paid": 1893.75,
    "total_pending": 563.75,
    "average_invoice": 94.52
  },
  "by_date_range": {
    "today": 2,
    "this_month": 12
  }
}
```

### Bulk Upload Invoices (Admin Only)
```
POST /api/invoices/bulk_upload/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: multipart/form-data
```

**Form Data:**
```
metadata: [CSV file with invoice metadata]
pdf_files: [Multiple PDF files]
```

**CSV Format:**
```
service_id,invoice_number,issued_date,due_date,status,notes,tax_rate,pdf_filename
1,INV-001,2023-04-15,2023-04-30,pending,New invoice,19.00,invoice1.pdf
2,INV-002,2023-04-16,2023-05-01,pending,New invoice,19.00,invoice2.pdf
```

**Response:**
```json
{
  "created_invoices": 2,
  "errors": []
}
```

### Send Invoice SMS
```
POST /api/invoices/{invoice_id}/send_sms_notification/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

> Note: Only staff users can trigger SMS notifications.

**Response (Success):**
```json
{
  "detail": "SMS notification sent successfully"
}
```

**Response (Failed):**
```json
{
  "detail": "SMS notification skipped: No phone number available"
}
```

**Response (Error):**
```json
{
  "detail": "Failed to send SMS notification: Error message from SMS provider"
}
```

## Notifications

### List Notifications
```
GET /api/notifications/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "customer": 1,
      "title": "Service Completed",
      "message": "Your oil change service has been completed",
      "notification_type": "service_update",
      "is_read": false,
      "created_at": "2023-04-15T12:00:00Z"
    }
  ]
}
```

### Mark Notification as Read
```
PATCH /api/notifications/1/mark_read/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
```json
{
  "status": "notification marked as read"
}
```

### Mark All Notifications as Read
```
PATCH /api/notifications/mark_all_read/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
```json
{
  "status": "all notifications marked as read"
}
```

## Mileage Tracking and Service Predictions

The ECAR system includes sophisticated mileage tracking and service prediction capabilities. The following sections provide details about how these features work and what API endpoints are available.

### Mileage Fields

The Car model includes several fields related to mileage tracking:

- `mileage`: The current mileage of the vehicle
- `initial_mileage`: The mileage when the car was added to the system (read-only for non-superadmins)
- `average_daily_mileage`: The calculated average kilometers driven per day
- `next_service_date`: The predicted date for the next service
- `next_service_mileage`: The predicted mileage at which the next service should occur

### MileageUpdate Endpoint

```
POST /api/mileage-updates/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Request Body:**
```json
{
  "car": 1,
  "mileage": 16500,
  "reported_date": "2023-05-01T12:00:00Z",
  "notes": "Updated at gas station"
}
```

**Response:**
```json
{
  "id": 1,
  "car": 1,
  "mileage": 16500,
  "reported_date": "2023-05-01T12:00:00Z",
  "notes": "Updated at gas station",
  "created_at": "2023-05-01T12:00:00Z",
  "updated_at": "2023-05-01T12:00:00Z"
}
```

### MileageUpdate Deletion Behavior

```
DELETE /api/mileage-updates/{id}/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
```
204 No Content
```

When a MileageUpdate is deleted, the system automatically handles the reversion of the car's mileage if needed:

1. The system checks if the car's mileage was set by the deleted update
2. If so, it intelligently determines the appropriate mileage value to revert to:
   - Uses the most recent remaining mileage update if available
   - Falls back to the highest service history mileage if no updates remain
   - Never reverts below the car's `initial_mileage` value
3. After reverting the mileage, the service predictions are recalculated automatically

**Important May 27, 2024 Update**: The deletion behavior has been enhanced to ensure that the car's mileage is never allowed to fall below the `initial_mileage` value. This ensures data integrity for pre-owned vehicles.

#### Special Handling for Pre-owned Vehicles:

When dealing with pre-owned vehicles (cars with significant initial mileage):

1. If all mileage updates are deleted, the car's mileage will fall back to the `initial_mileage` value
2. The average daily mileage will be calculated based on:
   - Actual mileage difference for vehicles with modest changes after addition 
   - Adjusted rate (difference ÷ 7) for vehicles with significant (>500 km) post-creation driving
   - Default value (50 km/day) for vehicles with minimal usage data

### Average Daily Mileage Calculation

The system calculates the average daily mileage using a sophisticated algorithm that takes into account:

1. **Initial and Current Mileage**: Uses `initial_mileage` as the absolute baseline for calculations
2. **Service History**: Incorporates mileage values from service records
3. **Mileage Updates**: Includes all reported mileage updates
4. **Time Periods**: Calculates mileage accumulation rates over different time periods

#### Recent Enhancement (May 27, 2024)

The average daily mileage calculation was recently enhanced to properly handle pre-owned vehicles:

- **Pre-owned vehicles** (high initial mileage with small difference): Uses the actual mileage difference since being added to the system
- **Vehicles with significant driving after creation** (>500 km): Uses adjusted rate based on mileage difference ÷ 7 days
- **Vehicles with minimal mileage difference**: Uses default value (50 km/day)

This ensures accurate service predictions for all vehicle types, especially pre-owned vehicles that already have significant mileage when added to the system.

### Service Predictions API

To fetch the latest service predictions for a car:

```
GET /api/cars/{id}/service_predictions/
```

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
```json
{
  "next_service_date": "2023-10-01",
  "next_service_mileage": 25000,
  "average_daily_mileage": 50.0,
  "days_until_service": 120,
  "kilometers_until_service": 9000,
  "service_interval": {
    "id": 1,
    "name": "Oil Change",
    "description": "Regular oil change service",
    "mileage_interval": 10000,
    "time_interval": 180
  }
}
``` 