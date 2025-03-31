# ECAR API Documentation

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

## Customers

### List Customers
```
GET /api/customers/
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
  "mileage": 15000
}
```

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
  "created_at": "2023-04-01T12:00:00Z",
  "updated_at": "2023-04-01T12:00:00Z"
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

**Response:**
Similar to the Get Car Services response but showing all services for the authenticated user

### Get Service Invoice
```
GET /api/services/1/invoice/
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