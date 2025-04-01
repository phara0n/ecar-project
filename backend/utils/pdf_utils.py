import os
from io import BytesIO
from django.conf import settings
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.core.files.base import ContentFile
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from django.db import connection
from django.db import transaction
from core.models import ServiceItem

def generate_invoice_pdf(invoice):
    """
    Generate a PDF invoice for the given invoice object
    """
    # Check if we're in a recursion loop
    if getattr(invoice, '_pdf_generation_in_progress', False):
        return None
        
    # Set flag to prevent recursion
    invoice._pdf_generation_in_progress = True
    
    try:
        # Create a buffer to receive PDF data
        buffer = BytesIO()
        
        # Create the PDF object using the buffer as its "file"
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72,
            title=f"Invoice {invoice.invoice_number}"
        )
        
        # Container for the 'Flowable' objects
        elements = []
        
        # Styles
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(
            name='RightAlign',
            parent=styles['Normal'],
            alignment=2,  # right alignment
        ))
        
        # Header
        elements.append(Paragraph(f"<b>FACTURE #{invoice.invoice_number}</b>", styles['Title']))
        elements.append(Spacer(1, 0.5 * cm))
        
        # Date and status
        elements.append(Paragraph(f"<b>{_('Date')}:</b> {invoice.issued_date.strftime('%d/%m/%Y')}", styles['Normal']))
        elements.append(Paragraph(f"<b>{_('Due Date')}:</b> {invoice.due_date.strftime('%d/%m/%Y')}", styles['Normal']))
        elements.append(Paragraph(f"<b>{_('Status')}:</b> {invoice.get_status_display()}", styles['Normal']))
        elements.append(Spacer(1, 0.5 * cm))
        
        # Get related objects directly from database to avoid recursion
        with connection.cursor() as cursor:
            # Get customer information
            cursor.execute("""
                SELECT 
                    c.phone, c.address, 
                    u.first_name, u.last_name, u.email
                FROM 
                    core_customer c
                JOIN 
                    auth_user u ON c.user_id = u.id
                JOIN 
                    core_car car ON car.customer_id = c.id
                JOIN 
                    core_service s ON s.car_id = car.id
                WHERE 
                    s.id = %s
            """, [invoice.service_id])
            customer_data = cursor.fetchone()
            
            if customer_data:
                phone, address, first_name, last_name, email = customer_data
                
                # Customer information
                elements.append(Paragraph("<b>INFORMATIONS CLIENT</b>", styles['Heading2']))
                elements.append(Paragraph(f"{first_name} {last_name}", styles['Normal']))
                elements.append(Paragraph(f"{phone}", styles['Normal']))
                if address:
                    elements.append(Paragraph(f"{address}", styles['Normal']))
                elements.append(Paragraph(f"{email}", styles['Normal']))
                elements.append(Spacer(1, 0.5 * cm))
            
            # Get car information
            cursor.execute("""
                SELECT 
                    car.make, car.model, car.year, car.license_plate, car.mileage
                FROM 
                    core_car car
                JOIN 
                    core_service s ON s.car_id = car.id
                WHERE 
                    s.id = %s
            """, [invoice.service_id])
            car_data = cursor.fetchone()
            
            if car_data:
                make, model, year, license_plate, mileage = car_data
                
                # Car information
                elements.append(Paragraph("<b>INFORMATIONS VÉHICULE</b>", styles['Heading2']))
                elements.append(Paragraph(f"{make} {model} ({year})", styles['Normal']))
                elements.append(Paragraph(f"{_('License Plate')}: {license_plate}", styles['Normal']))
                elements.append(Paragraph(f"{_('Mileage')}: {mileage} km", styles['Normal']))
                elements.append(Spacer(1, 0.5 * cm))
            
            # Get service information
            cursor.execute("""
                SELECT 
                    title, description
                FROM 
                    core_service
                WHERE 
                    id = %s
            """, [invoice.service_id])
            service_data = cursor.fetchone()
            
            if service_data:
                service_title, service_description = service_data
                
                # Service information
                elements.append(Paragraph("<b>DÉTAILS DU SERVICE</b>", styles['Heading2']))
                elements.append(Paragraph(f"<b>{service_title}</b>", styles['Normal']))
                elements.append(Paragraph(f"{service_description}", styles['Normal']))
                elements.append(Spacer(1, 0.5 * cm))
            
            # Get service items
            cursor.execute("""
                SELECT 
                    name, item_type, quantity, unit_price, (quantity * unit_price) as total_price
                FROM 
                    core_serviceitem
                WHERE 
                    service_id = %s
            """, [invoice.service_id])
            service_items = cursor.fetchall()
            
            # Items table
            data = [
                [_('Description'), _('Quantity'), _('Unit Price'), _('Total')],
            ]
            
            for item in service_items:
                name, item_type, quantity, unit_price, total_price = item
                item_type_display = dict(ServiceItem.TYPE_CHOICES).get(item_type, item_type)
                data.append([
                    f"{name} ({item_type_display})",
                    str(quantity),
                    f"{unit_price:.2f} DT",
                    f"{total_price:.2f} DT",
                ])
        
        # Calculate totals manually
        subtotal = sum(float(item[4]) for item in service_items) if service_items else 0
        
        # Add subtotal and total
        data.append(['', '', f"<b>{_('Subtotal')}</b>", f"{subtotal:.2f} DT"])
        data.append(['', '', f"<b>{_('Total')}</b>", f"<b>{subtotal:.2f} DT</b>"])
        
        table = Table(data, colWidths=[8 * cm, 2 * cm, 3 * cm, 3 * cm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -4), colors.white),
            ('GRID', (0, 0), (-1, -4), 1, colors.black),
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, -3), (2, -1), 'Helvetica-Bold'),
            ('FONTNAME', (3, -1), (3, -1), 'Helvetica-Bold'),
            ('LINEABOVE', (0, -3), (-1, -3), 1, colors.black),
            ('LINEABOVE', (0, -1), (-1, -1), 1, colors.black),
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 1 * cm))
        
        # Notes
        if invoice.notes:
            elements.append(Paragraph("<b>NOTES</b>", styles['Heading3']))
            elements.append(Paragraph(invoice.notes, styles['Normal']))
        
        # Build the PDF
        doc.build(elements)
        
        # Get the value of the BytesIO buffer and save it to the invoice
        pdf = buffer.getvalue()
        buffer.close()
        
        # Generate filename
        filename = f"invoice_{invoice.invoice_number}.pdf"
        
        # Save the PDF to the invoice model - but without trigger save recursion
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute(
                    "UPDATE core_invoice SET pdf_file = %s WHERE id = %s",
                    [f"invoices/{filename}", invoice.id]
                )
        
        # Create the file in the media directory
        # Ensure the invoices directory exists
        invoices_dir = os.path.join(settings.MEDIA_ROOT, 'invoices')
        os.makedirs(invoices_dir, exist_ok=True)
        
        # Write the file
        file_path = os.path.join(invoices_dir, filename)
        with open(file_path, 'wb') as f:
            f.write(pdf)
        
        return file_path
    
    finally:
        # Clear flag
        invoice._pdf_generation_in_progress = False
