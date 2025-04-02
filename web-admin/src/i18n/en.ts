import { TranslationMessages } from 'ra-core';
import englishMessages from 'ra-language-english';

const customEnglishMessages: TranslationMessages = {
  ...englishMessages,
  app: {
    title: 'ECAR Garage Management',
  },
  menu: {
    dashboard: 'Dashboard',
    customers: 'Customers',
    vehicles: 'Vehicles',
    services: 'Services',
    serviceItems: 'Service Items',
    invoices: 'Invoices',
    reports: 'Reports',
    notifications: 'Notifications',
    users: 'Staff Management',
    roles: 'Roles',
    permissions: 'Permissions',
    securityLogs: 'Security Logs',
    settings: 'Settings',
  },
  language: {
    current: 'English',
    english: 'English',
    french: 'French',
    arabic: 'Arabic',
  },
  resources: {
    customers: {
      name: 'Customer |||| Customers',
      fields: {
        id: 'ID',
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        address: 'Address',
        created_at: 'Created At',
        updated_at: 'Updated At',
      },
    },
    vehicles: {
      name: 'Vehicle |||| Vehicles',
      fields: {
        id: 'ID',
        make: 'Make',
        model: 'Model',
        year: 'Year',
        license_plate: 'License Plate',
        vin: 'VIN',
        customer_id: 'Customer',
        created_at: 'Created At',
        updated_at: 'Updated At',
      },
    },
    services: {
      name: 'Service |||| Services',
      fields: {
        id: 'ID',
        name: 'Service Name',
        description: 'Description',
        price: 'Price',
        duration: 'Duration (hours)',
        vehicle_id: 'Vehicle',
        service_date: 'Service Date',
        status: 'Status',
        created_at: 'Created At',
        updated_at: 'Updated At',
      },
    },
    invoices: {
      name: 'Invoice |||| Invoices',
      fields: {
        id: 'ID',
        invoice_number: 'Invoice Number',
        service_id: 'Service',
        customer_id: 'Customer',
        amount: 'Amount',
        issued_date: 'Issued Date',
        due_date: 'Due Date',
        paid: 'Paid',
        payment_date: 'Payment Date',
        created_at: 'Created At',
        updated_at: 'Updated At',
      },
    },
    notifications: {
      name: 'Notification |||| Notifications',
      fields: {
        id: 'ID',
        type: 'Type',
        message: 'Message',
        read: 'Read',
        created_at: 'Created At',
      },
    },
    users: {
      name: 'User |||| Users',
      fields: {
        id: 'ID',
        username: 'Username',
        email: 'Email',
        role: 'Role',
        created_at: 'Created At',
        updated_at: 'Updated At',
      },
    },
  },
  dashboard: {
    welcome: 'Welcome to ECAR Garage Management',
    pending_services: 'Pending Services',
    completed_services: 'Completed Services',
    revenue_this_month: 'Revenue this Month',
    new_customers: 'New Customers',
  },
  buttons: {
    save: 'Save',
    delete: 'Delete',
    cancel: 'Cancel',
    add: 'Add',
    edit: 'Edit',
    view: 'View',
    back: 'Back',
    next: 'Next',
  },
};

export default customEnglishMessages; 