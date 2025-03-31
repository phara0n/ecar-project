# Email Templates

## Overview

The ECAR Garage Management System uses HTML email templates to send professional and consistent notifications to customers. These templates are stored in the `backend/templates/emails/` directory and are rendered using Django's template engine.

## Email Types

Currently, the system includes the following email templates:

1. **Service Completed** (`service_completed.html`)
   - Sent when a service is marked as completed
   - Includes details about the service and vehicle
   - Optionally attaches the invoice PDF if available

2. **Invoice Created** (`invoice_created.html`)
   - Sent when a new invoice is generated
   - Includes invoice details and payment information
   - Attaches the invoice PDF

## Template Structure

Each email template follows a consistent structure:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Title</title>
    <style>
        /* Inline CSS styles */
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Email Title</h1>
        </div>
        <div class="content">
            <!-- Email content -->
        </div>
        <div class="footer">
            <!-- Footer information -->
        </div>
    </div>
</body>
</html>
```

## Context Variables

The email templates use Django template variables to dynamically insert content. The following context variables are available:

### Service Completed Email

| Variable | Description |
|----------|-------------|
| `user` | The customer user object |
| `service` | The completed service object |
| `car` | The car object associated with the service |

### Invoice Email

| Variable | Description |
|----------|-------------|
| `user` | The customer user object |
| `invoice` | The invoice object |
| `service` | The service object associated with the invoice |
| `car` | The car object associated with the service |

## Email Sending Process

Emails are sent using the utility functions in `utils/email_utils.py`. These functions:

1. Render the HTML template with the appropriate context
2. Create a plain text version from the HTML
3. Create an email message with both HTML and plain text versions
4. Attach the PDF file if applicable
5. Send the email using Django's email backend

Example function call:
```python
from utils.email_utils import send_service_completed_notification
send_service_completed_notification(service)
```

## Customization

To customize the email templates:

1. Edit the HTML files in `backend/templates/emails/`
2. Keep the structure consistent but modify the styles and content as needed
3. Make sure to maintain all the required template variables
4. Test the emails with different data to ensure they render correctly

## Email Design Best Practices

The templates are designed following email best practices:

1. **Responsive Design**: All templates use responsive design principles
2. **Inline CSS**: All styling is inline to ensure compatibility with email clients
3. **Simple Layout**: Clean, simple layouts that work across various email clients
4. **Consistent Branding**: Consistent use of colors, fonts, and style
5. **Call-to-Action**: Clear call-to-action buttons

## Testing Emails

To test email rendering without sending actual emails:

1. Use Django's `render_to_string` function to render the template
2. View the rendered HTML in a browser to check appearance
3. Test with Django's `EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'` setting to output emails to the console

Example:
```python
from django.template.loader import render_to_string
context = {'user': user, 'service': service, 'car': car}
html = render_to_string('emails/service_completed.html', context)
# Now view the html content in a browser or print it to console
``` 