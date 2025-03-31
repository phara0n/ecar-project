from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from utils.pdf_utils import generate_invoice_pdf
from utils.email_utils import send_email_notification, send_service_completed_notification, send_invoice_notification
from utils.sms_utils import send_service_completed_sms, send_invoice_sms

# This file now only imports utility functions from the utils package
# and serves as a compatibility layer for existing code that imports from core.utils.
# Over time, code should be updated to import directly from the utils package. 