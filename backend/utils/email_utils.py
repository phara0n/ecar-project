from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

def send_email_notification(recipient_email, subject, template_name, context, attachment=None):
    """
    Send an email notification using a template.
    
    Args:
        recipient_email (str): The email address of the recipient
        subject (str): The email subject
        template_name (str): The name of the HTML template to use
        context (dict): The context to render the template with
        attachment (tuple, optional): A tuple of (filename, content, mimetype)
    """
    # Render HTML content
    html_content = render_to_string(template_name, context)
    
    # Create plain text version
    text_content = strip_tags(html_content)
    
    # Create email
    email = EmailMultiAlternatives(
        subject,
        text_content,
        settings.DEFAULT_FROM_EMAIL,
        [recipient_email]
    )
    
    # Attach HTML content
    email.attach_alternative(html_content, "text/html")
    
    # Attach file if provided
    if attachment:
        filename, content, mimetype = attachment
        email.attach(filename, content, mimetype)
    
    # Send email
    email.send()
    
    return True


def send_service_completed_notification(service):
    """
    Send a notification when a service is completed
    
    Args:
        service (Service): The completed service
    """
    customer = service.car.customer
    user = customer.user
    
    # Don't send if no email
    if not user.email:
        return False
    
    subject = _("Your service has been completed")
    template_name = "emails/service_completed.html"
    context = {
        "user": user,
        "service": service,
        "car": service.car,
    }
    
    # If there's an invoice with a PDF, attach it
    attachment = None
    try:
        invoice = service.invoice
        if invoice and invoice.pdf_file:
            with open(invoice.pdf_file.path, "rb") as f:
                content = f.read()
                attachment = (
                    f"invoice_{invoice.invoice_number}.pdf", 
                    content, 
                    "application/pdf"
                )
    except:
        pass
    
    return send_email_notification(user.email, subject, template_name, context, attachment)


def send_invoice_notification(invoice):
    """
    Send a notification when an invoice is created
    
    Args:
        invoice (Invoice): The invoice
    """
    service = invoice.service
    customer = service.car.customer
    user = customer.user
    
    # Don't send if no email
    if not user.email:
        return False
    
    subject = _("New invoice for your service")
    template_name = "emails/invoice_created.html"
    context = {
        "user": user,
        "invoice": invoice,
        "service": service,
        "car": service.car,
    }
    
    # Attach the PDF if it exists
    attachment = None
    if invoice.pdf_file:
        with open(invoice.pdf_file.path, "rb") as f:
            content = f.read()
            attachment = (
                f"invoice_{invoice.invoice_number}.pdf", 
                content, 
                "application/pdf"
            )
    
    return send_email_notification(user.email, subject, template_name, context, attachment)
