import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

def get_sms_config():
    """
    Get SMS configuration from settings
    
    Returns:
        dict: SMS configuration with API key and sender ID
    """
    return {
        'api_key': getattr(settings, 'SMS_API_KEY', None),
        'sender_id': getattr(settings, 'SMS_SENDER_ID', 'ECAR'),
    }

def send_sms(phone_number, message):
    """
    Send an SMS to a customer
    
    Args:
        phone_number (str): The recipient's phone number
        message (str): The SMS content
        
    Returns:
        dict: Response from the SMS provider with status
    """
    config = get_sms_config()
    
    if not config['api_key']:
        logger.warning("SMS_API_KEY not configured. SMS not sent.")
        return {
            'status': 'failed',
            'message': 'SMS API key not configured'
        }
    
    # Format phone number - ensure it has country code
    if not phone_number.startswith('+'):
        # Default to Tunisia country code if not specified
        phone_number = '+216' + phone_number.lstrip('0')
    
    try:
        # This is a template for a generic SMS API service
        # Replace this with your actual SMS provider's API
        api_endpoint = "https://api.smsgateway.example/v1/messages"
        
        payload = {
            'api_key': config['api_key'],
            'sender_id': config['sender_id'],
            'phone': phone_number,
            'message': message,
        }
        
        # Send the request to the SMS provider
        response = requests.post(api_endpoint, json=payload)
        response.raise_for_status()  # Raise exception for non-2xx responses
        
        result = response.json()
        logger.info(f"SMS sent to {phone_number}")
        
        return {
            'status': 'success',
            'provider_response': result
        }
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to send SMS: {str(e)}")
        return {
            'status': 'failed',
            'message': str(e)
        }

def send_service_completed_sms(service):
    """
    Send an SMS notification when a service is completed
    
    Args:
        service: The service object that was completed
        
    Returns:
        dict: Response with status
    """
    try:
        customer = service.car.customer
        
        # Skip if no phone number
        if not customer.phone:
            return {
                'status': 'skipped',
                'message': 'No phone number available'
            }
        
        # Prepare the message
        car_info = f"{service.car.make} {service.car.model}"
        message = f"Bonjour {customer.user.first_name}, votre service pour {car_info} est terminé. Merci de nous contacter pour récupérer votre véhicule."
        
        # Send the SMS
        return send_sms(customer.phone, message)
        
    except Exception as e:
        logger.error(f"Error sending service completed SMS: {str(e)}")
        return {
            'status': 'failed',
            'message': str(e)
        }

def send_invoice_sms(invoice):
    """
    Send an SMS notification for a new invoice
    
    Args:
        invoice: The invoice object
        
    Returns:
        dict: Response with status
    """
    try:
        service = invoice.service
        customer = service.car.customer
        
        # Skip if no phone number
        if not customer.phone:
            return {
                'status': 'skipped',
                'message': 'No phone number available'
            }
        
        # Prepare the message
        car_info = f"{service.car.make} {service.car.model}"
        message = f"Bonjour {customer.user.first_name}, une nouvelle facture ({invoice.invoice_number}) de {invoice.total} DT pour votre {car_info} a été émise. Merci de votre confiance."
        
        # Send the SMS
        return send_sms(customer.phone, message)
        
    except Exception as e:
        logger.error(f"Error sending invoice SMS: {str(e)}")
        return {
            'status': 'failed',
            'message': str(e)
        }

def send_appointment_reminder_sms(appointment):
    """
    Send an SMS reminder for an upcoming appointment
    
    Args:
        appointment: The appointment object
        
    Returns:
        dict: Response with status
    """
    try:
        customer = appointment.car.customer
        
        # Skip if no phone number
        if not customer.phone:
            return {
                'status': 'skipped',
                'message': 'No phone number available'
            }
        
        # Format the date/time
        appointment_datetime = appointment.appointment_time.strftime("%d/%m/%Y à %H:%M")
        
        # Prepare the message
        car_info = f"{appointment.car.make} {appointment.car.model}"
        message = f"Bonjour {customer.user.first_name}, rappel de votre rendez-vous pour votre {car_info} le {appointment_datetime}. En cas d'empêchement, merci de nous contacter."
        
        # Send the SMS
        return send_sms(customer.phone, message)
        
    except Exception as e:
        logger.error(f"Error sending appointment reminder SMS: {str(e)}")
        return {
            'status': 'failed',
            'message': str(e)
        }
