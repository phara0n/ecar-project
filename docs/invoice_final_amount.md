# Invoice Final Amount Field
## Added: April 2, 2025

## Overview

This document describes the new `final_amount` field that has been added to the Invoice model in the ECAR Garage Management System.

## Purpose

The `final_amount` field provides a way to specify a custom final amount for invoices that may differ from the automatically calculated total. This is useful in situations where:

- Special discounts need to be applied
- Manual adjustments are required
- Custom pricing needs to be specified
- Tax or additional fees need to be included

## Implementation Details

### Model Field

The `final_amount` field has been added to the `Invoice` model with the following properties:

```python
final_amount = models.DecimalField(
    _('Final Amount'), 
    max_digits=10, 
    decimal_places=2, 
    blank=True, 
    null=True, 
    help_text=_('Custom final amount to be displayed to the customer.')
)
```

Key characteristics:
- **Field Type**: `DecimalField` to store precise monetary values
- **Precision**: 10 digits with 2 decimal places
- **Optional**: The field is optional (blank=True, null=True)
- **Help Text**: Descriptive help text provided for admin users

### Admin Interface

The `final_amount` field has been integrated into the Django Admin interface:

1. **Display in List View**: 
   - Added to the `list_display` to show the value in the invoice list

2. **Financial Information Section**:
   - Added to the "Financial Information" fieldset
   - Positioned after the automatically calculated subtotal and total
   - Description added to explain its purpose

3. **Visual Distinction**:
   - Clear labeling to distinguish it from the calculated total
   - Explanatory text to indicate this is a manually specified amount

### API Integration

The `final_amount` field has been added to the API:

1. **Serializer Update**:
   - Added to the `InvoiceSerializer` fields list
   - Available in both API responses and for updates

2. **Documentation**:
   - Documented in the API schema
   - Included in Swagger documentation

## How to Use

### Setting a Final Amount

1. In the Django Admin interface, navigate to an invoice edit page
2. Locate the "Financial Information" section
3. Enter a custom value in the "Final Amount" field
4. Save the invoice

The specified amount will be:
- Displayed in the invoice list view
- Available through the API
- Shown in the invoice detail view

### API Access

The final amount can be accessed and set through the API:

```json
// Example API response
{
  "id": 1,
  "invoice_number": "INV-A1B2C3D4",
  "subtotal": "150.00",
  "total": "150.00",
  "final_amount": "135.00",
  // other invoice fields...
}
```

To set a final amount via the API, include it in a PUT or PATCH request to update an invoice.

## Integration Notes

- The `final_amount` field is independent of the calculated `total` field
- There is no automatic calculation between the two fields
- The `final_amount` field should be used for display purposes to the customer
- The original `total` field is still maintained for internal accounting 