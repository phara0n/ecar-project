# ECAR Admin Interfaces User Guide

This guide explains how to access and use both admin interfaces available in the ECAR Garage Management System: the Django Admin Interface and the custom Web Admin Interface.

## Access Information

### Django Admin Interface
- **URL**: http://localhost/admin/core/
- **Credentials**: 
  - Username: admin
  - Password: Phara0n$
- **Best for**: Database administration, data validation, and bulk operations

### Custom Web Admin Interface
- **URL**: http://localhost:5173/
- **Credentials**: 
  - Username: admin
  - Password: Phara0n$
- **Best for**: Day-to-day operations, service management, and user-friendly workflows

## Django Admin Interface

The Django Admin Interface provides a traditional tabular interface for database management. It's excellent for:
- Direct database record manipulation
- Bulk operations
- Advanced filtering
- Backend administration

### Navigation

1. **Login**: Navigate to http://localhost/admin/core/ and enter your credentials
2. **Dashboard**: After login, you'll see the main admin dashboard with models listed in the sidebar
3. **Models**: Click on any model name to see a list of records
   - Customer
   - Car (Vehicle)
   - Service
   - ServiceItem
   - Invoice

### Common Tasks

#### Viewing Records
1. Click on a model name in the sidebar
2. Use the filters on the right to narrow down results
3. Click on a record to view its details

#### Creating Records
1. Click on a model name in the sidebar
2. Click "Add" button in the top right
3. Fill in the form and click "Save"

#### Editing Records
1. Click on a model name in the sidebar
2. Click on a record to open it
3. Make changes and click "Save"

#### Deleting Records
1. Click on a model name in the sidebar
2. Select records using checkboxes
3. Choose "Delete selected" from the action dropdown
4. Confirm deletion

#### Bulk Operations
1. Click on a model name in the sidebar
2. Select multiple records using checkboxes
3. Choose an action from the dropdown
4. Click "Go"

## Custom Web Admin Interface

The custom Web Admin Interface provides a modern, user-friendly experience with enhanced features for daily operations. It's excellent for:
- Service management
- Customer interactions
- Invoice handling
- Dashboard analytics

### Navigation

1. **Login**: Navigate to http://localhost:5173/ and enter your credentials
2. **Dashboard**: After login, you'll see the main dashboard with statistics and recent activities
3. **Menu**: Use the sidebar menu to navigate between different sections:
   - Dashboard
   - Customers
   - Vehicles
   - Services
   - Service Items
   - Invoices

### Common Tasks

#### Dashboard
- View key performance indicators
- See recent services
- Track upcoming appointments
- Monitor revenue statistics

#### Managing Services
1. Click "Services" in the sidebar
2. View all services in a card-based layout
3. Filter services by status using the filter sidebar
4. Click on a service card to edit its details
5. From the service edit page, manage service items directly

#### Adding Service Items to a Service
1. Open a service by clicking its card or "Edit" button
2. Scroll down to the "Service Items" section
3. Click "Add Service Item"
4. Fill in the form with item details
5. Click "Create Service Item"
6. You'll be redirected back to the service edit page with the new item listed

#### Managing Customers and Vehicles
1. Click "Customers" or "Vehicles" in the sidebar
2. Use the search and filter features to find records
3. Click "Edit" to modify a record
4. Click "Create" to add a new record

#### Invoice Management
1. Click "Invoices" in the sidebar
2. Browse existing invoices
3. Click "Create" to generate a new invoice
4. Select the related service
5. Add payment details
6. Upload or view PDF documents

### Tips for Using the Web Admin Interface

1. **Service Management**:
   - Use the colored status indicators to quickly identify service status
   - The service count badge shows how many items are associated with each service
   - Service items are automatically calculated for total amount

2. **Mobile Usage**:
   - The interface is fully responsive
   - On smaller screens, services display as cards instead of a table

3. **Data Relationships**:
   - Services are linked to vehicles
   - Vehicles are linked to customers
   - Service items are linked to services
   - Invoices are linked to services

## Which Interface to Use?

### Use Django Admin When:
- You need to perform bulk operations
- You're managing user permissions
- You need direct database access
- You're troubleshooting data issues
- You need advanced filtering options

### Use Web Admin When:
- You're managing daily service operations
- You want a more visual experience
- You're working on mobile devices
- You need dashboard analytics
- You're adding service items to services

## Starting the Interfaces

Both interfaces should be running within the Docker environment. If they're not accessible, you can start them:

### Django Admin:
```bash
cd /home/ecar/ecar_project && docker-compose up -d
```

### Web Admin Interface:
```bash
cd /home/ecar/ecar_project/web-admin && npm run dev
```

## Support

If you encounter any issues with the admin interfaces, please refer to:
- The documentation in the `/home/ecar/ecar_project/docs/` directory
- The checkpoint document for current status and known issues
- The admin interfaces checklist for feature status

Last Updated: April 2, 2025 