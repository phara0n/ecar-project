# Email Notification System

## Overview

The ECAR Garage Management System includes an email notification system that automatically sends emails to customers for various events such as appointment confirmations, service status updates, and invoice delivery. This document outlines the implementation, configuration, and usage of the email notification system.

## Implementation

### Dependencies

The email notification system relies on the following:

- **Django's Email Framework**: Core email sending functionality
- **Django Templates**: For rendering email content
- **Redis**: For asynchronous email processing (future enhancement)

### Core Components

#### 1. Email Configuration

The email settings are configured in `settings.py`:

```python
# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'  # Or other backends for development
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@ecargarage.com')
```

#### 2. Email Templates

Email templates are stored in the `templates/emails/` directory:

- `appointment_confirmation.html`: Sent when an appointment is confirmed
- `service_update.html`: Sent when a service status is updated
- `service_completed.html`: Sent when a service is marked as completed
- `invoice_notification.html`: Sent when an invoice is generated

Example template (`service_completed.html`):

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Service Completed</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #4a90e2;
            color: white;
            padding: 15px;
            text-align: center;
        }
        .content {
            padding: 20px;
            background-color: #f9f9f9;
            border: 1px solid #ddd;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Service Completed</h1>
        </div>
        <div class="content">
            <p>Dear {{ customer_name }},</p>
            
            <p>We're pleased to inform you that the service for your vehicle ({{ vehicle_make }} {{ vehicle_model }}) has been completed.</p>
            
            <h3>Service Details:</h3>
            <ul>
                <li><strong>Service Type:</strong> {{ service_type }}</li>
                <li><strong>Completion Date:</strong> {{ completion_date }}</li>
                <li><strong>Service Description:</strong> {{ service_description }}</li>
            </ul>
            
            <p>Your vehicle is now ready for pickup. Our garage is open from Monday to Friday, 8:00 AM to 6:00 PM.</p>
            
            <p>If you have any questions or need further information, please don't hesitate to contact us at (555) 123-4567.</p>
            
            <p>Thank you for choosing ECAR Garage for your vehicle service needs!</p>
            
            <p>Best regards,<br>ECAR Garage Team</p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>© 2023 ECAR Garage. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
```

#### 3. Email Utility Functions

Email sending functions are implemented in `utils/email_utils.py`:

```python
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.conf import settings

def send_email_notification(to_email, subject, template_name, context):
    """
    Send an email notification using a template.
    
    Args:
        to_email (str): Recipient email address
        subject (str): Email subject
        template_name (str): Template file name (without path)
        context (dict): Context data for the template
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        # Render email content from template
        html_content = render_to_string(f'emails/{template_name}', context)
        
        # Create email message
        email = EmailMessage(
            subject=subject,
            body=html_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_email]
        )
        email.content_subtype = 'html'  # Set content type to HTML
        
        # Send email
        email.send(fail_silently=False)
        return True
        
    except Exception as e:
        # Log the error
        print(f"Error sending email: {str(e)}")
        return False

def send_service_completed_notification(service):
    """
    Send a notification when a service is completed.
    
    Args:
        service: Service model instance
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        customer = service.vehicle.owner
        vehicle = service.vehicle
        
        # Prepare context data
        context = {
            'customer_name': customer.name,
            'vehicle_make': vehicle.make,
            'vehicle_model': vehicle.model,
            'service_type': service.service_type,
            'completion_date': service.completed_date.strftime('%Y-%m-%d'),
            'service_description': service.description
        }
        
        # Send email
        subject = f"Your vehicle service has been completed - {vehicle.make} {vehicle.model}"
        return send_email_notification(
            to_email=customer.email,
            subject=subject,
            template_name='service_completed.html',
            context=context
        )
        
    except Exception as e:
        # Log the error
        print(f"Error sending service completion notification: {str(e)}")
        return False

def send_appointment_confirmation(appointment):
    """
    Send an appointment confirmation email.
    
    Args:
        appointment: Appointment model instance
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    # Implementation similar to service_completed_notification
    # ...

def send_invoice_notification(invoice):
    """
    Send an invoice notification email with the invoice PDF attached.
    
    Args:
        invoice: Invoice model instance
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        customer = invoice.customer
        
        # Prepare context data
        context = {
            'customer_name': customer.name,
            'invoice_number': invoice.invoice_number,
            'invoice_date': invoice.created_date.strftime('%Y-%m-%d'),
            'due_date': invoice.due_date.strftime('%Y-%m-%d'),
            'amount': invoice.total_amount
        }
        
        # Render email content
        html_content = render_to_string('emails/invoice_notification.html', context)
        
        # Create email
        subject = f"Invoice #{invoice.invoice_number} from ECAR Garage"
        email = EmailMessage(
            subject=subject,
            body=html_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[customer.email]
        )
        email.content_subtype = 'html'
        
        # Attach PDF if available
        if invoice.pdf_file:
            email.attach_file(invoice.pdf_file.path)
        
        # Send email
        email.send(fail_silently=False)
        return True
        
    except Exception as e:
        # Log the error
        print(f"Error sending invoice notification: {str(e)}")
        return False
```

#### 4. Integration with Models

Email notifications are triggered from model methods:

```python
class Service(models.Model):
    # ... fields ...
    
    def save(self, *args, **kwargs):
        # Check if status changed to 'completed'
        if self.pk:
            old_service = Service.objects.get(pk=self.pk)
            status_changed_to_completed = (
                old_service.status != 'completed' and self.status == 'completed'
            )
        else:
            status_changed_to_completed = self.status == 'completed'
            
        # Set completed date if status changed to completed
        if status_changed_to_completed:
            self.completed_date = timezone.now()
            
        # Save the service
        super().save(*args, **kwargs)
        
        # Send notification if status changed to completed
        if status_changed_to_completed:
            self._create_completion_notification()
            from utils.email_utils import send_service_completed_notification
            send_service_completed_notification(self)
            
    def _create_completion_notification(self):
        # Create notification record in database
        Notification.objects.create(
            customer=self.vehicle.owner,
            title="Service Completed",
            message=f"The service for your {self.vehicle.make} {self.vehicle.model} has been completed.",
            notification_type="service_completion",
            related_object_id=self.id
        )
```

## Usage

### Sending Manual Notifications

To send a manual notification:

```python
from utils.email_utils import send_email_notification

# Send a custom email
send_email_notification(
    to_email="customer@example.com",
    subject="Important Update",
    template_name="custom_notification.html",
    context={
        'customer_name': 'John Doe',
        'message': 'Your vehicle is ready for pickup.'
    }
)
```

### Testing Email Configuration

To test the email configuration:

```python
from django.core.mail import send_mail

# Simple test email
send_mail(
    'Test Email',
    'This is a test email from ECAR Garage Management System.',
    'noreply@ecargarage.com',
    ['test@example.com'],
    fail_silently=False,
)
```

## Configuration for Different Environments

### Development

For development, you can use the console or file backend to avoid sending actual emails:

```python
# settings/development.py
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
# or
EMAIL_BACKEND = 'django.core.mail.backends.filebased.EmailBackend'
EMAIL_FILE_PATH = os.path.join(BASE_DIR, 'sent_emails')
```

### Production

For production, use the SMTP backend with proper credentials:

```python
# settings/production.py
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('EMAIL_HOST')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT'))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL')
```

## Future Enhancements

### Asynchronous Email Processing

To improve performance, future implementations will use Redis and Celery for asynchronous email processing:

```python
# Using Celery tasks
@shared_task
def send_email_notification_task(to_email, subject, template_name, context):
    # Same implementation as the synchronous version
    # ...

# Call from services
def send_service_completed_notification(service):
    # ...
    # Instead of sending directly, queue the task
    context = {...}
    send_email_notification_task.delay(
        to_email=customer.email,
        subject=subject,
        template_name='service_completed.html',
        context=context
    )
```

### Email Analytics

Future versions will include email analytics to track:
- Open rates
- Click rates
- Delivery success/failure

### Customizable Email Templates

Allow admins to customize email templates through the admin interface. 