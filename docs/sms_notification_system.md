# SMS Notification System

## Overview

The ECAR Garage Management System includes an SMS notification system that allows the garage to send text messages to customers for various events like service completion and invoice generation. These notifications help improve customer communication and satisfaction.

## Features

1. **Automated SMS Notifications**:
   - Service completion notifications
   - New invoice notifications
   - Appointment reminders (future)

2. **Manual SMS Triggering**:
   - Staff can manually trigger SMS notifications through the API
   - Useful for resending failed notifications or sending custom updates

3. **Tunisia Phone Number Support**:
   - Automatic formatting of phone numbers with Tunisia country code (+216)
   - Proper handling of local number formats

## Implementation

### Core Components

- **SMS Utilities (`utils/sms_utils.py`)**: Contains all core SMS functionality
- **Service Model Integration**: Automatically sends SMS when a service is marked as completed
- **Invoice Model Integration**: Automatically sends SMS when a new invoice is created
- **API Endpoints**: For manual triggering of SMS notifications

### Configuration

SMS notifications are configured through environment variables:

```
# SMS Settings
SMS_API_KEY=your-sms-api-key
SMS_SENDER_ID=ECAR
```

The system is set up to use a configurable SMS gateway service. The current implementation includes a template that should be adapted to the specific SMS provider used in production.

## SMS Content

### Service Completion SMS

When a service is completed, the following SMS is sent to the customer:

```
Bonjour [FirstName], votre service pour [Car Make] [Car Model] est terminé. 
Merci de nous contacter pour récupérer votre véhicule.
```

### Invoice SMS

When a new invoice is created, the following SMS is sent to the customer:

```
Bonjour [FirstName], une nouvelle facture ([Invoice Number]) de [Total Amount] DT 
pour votre [Car Make] [Car Model] a été émise. Merci de votre confiance.
```

### Appointment Reminder SMS

For future appointment reminders, the following SMS template is used:

```
Bonjour [FirstName], rappel de votre rendez-vous pour votre [Car Make] [Car Model] 
le [Date] à [Time]. En cas d'empêchement, merci de nous contacter.
```

## API Endpoints

### Manually Trigger Service Completion SMS

```
POST /api/services/{service_id}/send_sms_notification/
```

This endpoint is restricted to staff users only.

### Manually Trigger Invoice SMS

```
POST /api/invoices/{invoice_id}/send_sms_notification/
```

This endpoint is restricted to staff users only.

## Error Handling

The SMS system includes robust error handling:

1. **Missing Phone Numbers**: If a customer doesn't have a phone number, the SMS is skipped with an appropriate log message
2. **API Failures**: If the SMS provider API fails, the error is logged and reported
3. **Configuration Issues**: If the SMS_API_KEY is not configured, a warning is logged

## Limitations and Future Improvements

1. **Current Limitations**:
   - Only supports a single SMS provider
   - Limited to French language messages
   - No message customization options

2. **Planned Improvements**:
   - Multi-provider support
   - Message templates with customization options
   - Multi-language support based on customer preferences
   - SMS delivery status tracking and reporting
   - Bulk SMS capabilities for marketing campaigns

## Testing

To test the SMS functionality:

1. Configure the SMS_API_KEY in your environment
2. Create a service and mark it as completed
3. Create an invoice for a service
4. Use the API endpoints to manually trigger SMS notifications

## Best Practices

1. Always ensure customer phone numbers are properly formatted
2. Monitor SMS delivery rates and failures
3. Respect local regulations regarding SMS marketing and communication
4. Provide an opt-out mechanism for customers who don't want to receive SMS
5. Keep SMS messages brief and to the point 