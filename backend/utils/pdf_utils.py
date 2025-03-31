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

def generate_invoice_pdf(invoice):
    """
    Generate a PDF invoice for the given invoice object
    """
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
    
    # Customer and car information
    customer = invoice.service.car.customer
    car = invoice.service.car
    
    elements.append(Paragraph("<b>INFORMATIONS CLIENT</b>", styles['Heading2']))
    elements.append(Paragraph(f"{customer.user.first_name} {customer.user.last_name}", styles['Normal']))
    elements.append(Paragraph(f"{customer.phone}", styles['Normal']))
    if customer.address:
        elements.append(Paragraph(f"{customer.address}", styles['Normal']))
    elements.append(Paragraph(f"{customer.user.email}", styles['Normal']))
    elements.append(Spacer(1, 0.5 * cm))
    
    elements.append(Paragraph("<b>INFORMATIONS VÉHICULE</b>", styles['Heading2']))
    elements.append(Paragraph(f"{car.make} {car.model} ({car.year})", styles['Normal']))
    elements.append(Paragraph(f"{_('License Plate')}: {car.license_plate}", styles['Normal']))
    elements.append(Paragraph(f"{_('Mileage')}: {car.mileage} km", styles['Normal']))
    elements.append(Spacer(1, 0.5 * cm))
    
    # Service information
    elements.append(Paragraph("<b>DÉTAILS DU SERVICE</b>", styles['Heading2']))
    elements.append(Paragraph(f"<b>{invoice.service.title}</b>", styles['Normal']))
    elements.append(Paragraph(f"{invoice.service.description}", styles['Normal']))
    elements.append(Spacer(1, 0.5 * cm))
    
    # Items table
    data = [
        [_('Description'), _('Quantity'), _('Unit Price'), _('Total')],
    ]
    
    for item in invoice.service.items.all():
        data.append([
            f"{item.name} ({item.get_item_type_display()})",
            str(item.quantity),
            f"{item.unit_price:.2f} DT",
            f"{item.total_price:.2f} DT",
        ])
    
    # Add subtotal, tax, and total
    data.append(['', '', f"<b>{_('Subtotal')}</b>", f"{invoice.subtotal:.2f} DT"])
    data.append(['', '', f"<b>{_('Tax')} ({invoice.tax_rate}%)</b>", f"{invoice.tax_amount:.2f} DT"])
    data.append(['', '', f"<b>{_('Total')}</b>", f"<b>{invoice.total:.2f} DT</b>"])
    
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
    
    # Save the PDF to the invoice model
    invoice.pdf_file.save(filename, ContentFile(pdf), save=True)
    
    return invoice.pdf_file.path
