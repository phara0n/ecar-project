# PDF Invoice Generation System

## Overview

The ECAR Garage Management System includes a PDF invoice generation system that automatically creates professional invoices for services rendered. This document outlines the implementation, usage, and customization options for the invoice generation system.

## Implementation

### Dependencies

The PDF generation system relies on the following libraries:

- **ReportLab**: Core PDF generation library
- **Django**: Framework integration
- **Pillow**: Image handling for logos

These dependencies are included in the project's `requirements.txt`.

### Core Components

#### 1. Invoice Model

The `Invoice` model in `models.py` defines the structure and data for invoices:

```python
class Invoice(models.Model):
    customer = models.ForeignKey('Customer', on_delete=models.CASCADE)
    service = models.OneToOneField('Service', on_delete=models.CASCADE)
    invoice_number = models.CharField(max_length=20, unique=True)
    created_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=INVOICE_STATUS_CHOICES, default='pending')
    pdf_file = models.FileField(upload_to='invoices/', blank=True, null=True)
    
    def save(self, *args, **kwargs):
        # Generate invoice number if not provided
        if not self.invoice_number:
            self.invoice_number = f"INV-{timezone.now().strftime('%Y%m%d')}-{randint(1000, 9999)}"
            
        # Create the invoice
        super().save(*args, **kwargs)
        
        # Generate PDF if it doesn't exist
        if not self.pdf_file:
            self.generate_pdf()
```

#### 2. PDF Generation Function

The invoice PDF generation is implemented in `utils/invoice_generator.py`:

```python
def generate_invoice_pdf(invoice_id):
    """
    Generate a PDF invoice for the given invoice ID.
    Returns the file path of the generated PDF.
    """
    try:
        invoice = Invoice.objects.get(id=invoice_id)
        
        # Initialize PDF document
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        # Build content elements
        elements = []
        
        # Add header with logo and company info
        header_data = [
            ["ECAR GARAGE", "Invoice #: " + invoice.invoice_number],
            ["123 Repair Street", "Date: " + invoice.created_date.strftime('%Y-%m-%d')],
            ["Autoville, AV 12345", "Due Date: " + invoice.due_date.strftime('%Y-%m-%d')],
            ["Phone: (555) 123-4567", ""]
        ]
        header_table = Table(header_data)
        header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 3), 'LEFT'),
            ('ALIGN', (1, 0), (1, 3), 'RIGHT'),
            ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (0, 0), 16),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 20))
        
        # Add customer information
        customer_data = [
            ["Bill To:", ""],
            [invoice.customer.name, ""],
            [invoice.customer.email, ""],
            [invoice.customer.phone, ""],
            [invoice.customer.address, ""]
        ]
        customer_table = Table(customer_data)
        customer_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 4), 'LEFT'),
            ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
        ]))
        elements.append(customer_table)
        elements.append(Spacer(1, 20))
        
        # Add vehicle information
        vehicle = invoice.service.vehicle
        vehicle_data = [
            ["Vehicle Information:", ""],
            ["Make: " + vehicle.make, "Model: " + vehicle.model],
            ["Year: " + str(vehicle.year), "License: " + vehicle.license_plate],
            ["VIN: " + vehicle.vin, ""]
        ]
        vehicle_table = Table(vehicle_data)
        vehicle_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (1, 3), 'LEFT'),
            ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
        ]))
        elements.append(vehicle_table)
        elements.append(Spacer(1, 20))
        
        # Add service details
        service_data = [
            ["Description", "Quantity", "Unit Price", "Total"],
            [invoice.service.description, "1", f"${invoice.total_amount}", f"${invoice.total_amount}"],
        ]
        
        # Get service items if any
        service_items = ServiceItem.objects.filter(service=invoice.service)
        for item in service_items:
            service_data.append([
                item.description,
                str(item.quantity),
                f"${item.unit_price}",
                f"${item.quantity * item.unit_price}"
            ])
        
        service_table = Table(service_data, colWidths=[doc.width/2, doc.width/6, doc.width/6, doc.width/6])
        service_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (3, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (3, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (3, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (3, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (3, 0), 12),
            ('BOTTOMPADDING', (0, 0), (3, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(service_table)
        elements.append(Spacer(1, 20))
        
        # Add total amount
        total_data = [
            ["", "", "Subtotal:", f"${invoice.total_amount}"],
            ["", "", "Tax (0%):", "$0.00"],
            ["", "", "Total:", f"${invoice.total_amount}"],
        ]
        total_table = Table(total_data, colWidths=[doc.width/2, doc.width/6, doc.width/6, doc.width/6])
        total_table.setStyle(TableStyle([
            ('ALIGN', (2, 0), (3, 2), 'RIGHT'),
            ('FONTNAME', (2, 2), (3, 2), 'Helvetica-Bold'),
        ]))
        elements.append(total_table)
        elements.append(Spacer(1, 30))
        
        # Add footer with terms and conditions
        elements.append(Paragraph("Thank you for your business!", getSampleStyleSheet()['Heading3']))
        elements.append(Paragraph("Terms and Conditions:", getSampleStyleSheet()['Heading4']))
        terms = """
        1. Payment is due within 30 days of invoice date.
        2. Please make checks payable to ECAR Garage.
        3. For questions regarding this invoice, contact billing@ecargarage.com.
        """
        elements.append(Paragraph(terms, getSampleStyleSheet()['Normal']))
        
        # Build PDF document
        doc.build(elements)
        
        # Save PDF to file
        buffer.seek(0)
        file_name = f"invoice_{invoice.invoice_number}.pdf"
        file_path = f"media/invoices/{file_name}"
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, 'wb') as f:
            f.write(buffer.read())
        
        # Update invoice with PDF file
        invoice.pdf_file.name = f"invoices/{file_name}"
        invoice.save(update_fields=['pdf_file'])
        
        return file_path
        
    except Invoice.DoesNotExist:
        raise ValueError(f"Invoice with ID {invoice_id} does not exist")
    except Exception as e:
        raise Exception(f"Failed to generate PDF invoice: {str(e)}")
```

#### 3. API Endpoint

The PDF invoice can be accessed via an API endpoint:

```python
class InvoicePDFView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, invoice_id):
        try:
            invoice = Invoice.objects.get(id=invoice_id)
            
            # Check if the requesting user is the customer or staff
            if request.user.is_staff or request.user == invoice.customer.user:
                if not invoice.pdf_file:
                    file_path = generate_invoice_pdf(invoice.id)
                else:
                    file_path = invoice.pdf_file.path
                    
                with open(file_path, 'rb') as pdf:
                    response = HttpResponse(pdf.read(), content_type='application/pdf')
                    response['Content-Disposition'] = f'inline; filename="{os.path.basename(file_path)}"'
                    return response
            else:
                return Response(
                    {"error": "You do not have permission to view this invoice"},
                    status=status.HTTP_403_FORBIDDEN
                )
                
        except Invoice.DoesNotExist:
            return Response(
                {"error": "Invoice not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
```

## Usage

### Automatic Generation

Invoices are automatically generated as PDFs when:

1. A new invoice is created
2. An invoice is updated and doesn't have a PDF

### Manual Generation

To manually generate or regenerate an invoice PDF:

```python
from utils.invoice_generator import generate_invoice_pdf

# Generate PDF for invoice ID 123
pdf_path = generate_invoice_pdf(123)
```

### Email Integration

Invoices can be automatically emailed to customers:

```python
def send_invoice_email(invoice_id):
    invoice = Invoice.objects.get(id=invoice_id)
    
    # Generate PDF if not already generated
    if not invoice.pdf_file:
        generate_invoice_pdf(invoice.id)
    
    # Prepare email
    subject = f"Invoice #{invoice.invoice_number} from ECAR Garage"
    message = f"Please find attached your invoice #{invoice.invoice_number} for recent services."
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [invoice.customer.email]
    
    # Send email with PDF attachment
    email = EmailMessage(subject, message, from_email, recipient_list)
    email.attach_file(invoice.pdf_file.path)
    email.send()
```

## Customization

### Template Customization

To customize the invoice template, modify the `generate_invoice_pdf` function in `utils/invoice_generator.py`:

1. **Logo**: Add your garage's logo to the header
2. **Colors**: Modify table styles and colors
3. **Content**: Change the structure or content of the invoice

### Advanced Customization

For more advanced customization:

1. Create a template-based PDF generation using HTML templates
2. Add QR codes for payment
3. Include dynamic calculations for taxes and discounts 