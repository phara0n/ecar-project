# Invoice PDF Handling
## Updated: April 2, 2025

## Overview

This document describes the updated approach for handling PDF files for invoices in the ECAR Garage Management System.

## Changes Made

### 1. Removed Automatic PDF Generation

Previously, the system would automatically generate a PDF invoice whenever:
- An invoice was created
- An invoice status was changed from draft to another status
- The PDF file was missing

This automatic generation has been removed to give users full control over the PDF files associated with invoices.

### 2. Added Manual PDF Upload

The system now allows manual PDF uploads for invoices:
- A dedicated PDF file upload field has been added to the invoice form
- Users can upload any PDF file they wish to associate with an invoice
- The uploaded PDF is stored in the `/media/invoices/` directory

### 3. Enhanced PDF Viewing/Downloading

A new PDF link has been added to:
- The invoice detail view in the Django Admin interface
- The invoice list view in the Django Admin interface

This link allows users to:
- View the PDF directly in the browser
- Download the PDF file for offline use

## How to Use

### Uploading a PDF Invoice

1. In the Django Admin interface, create or edit an invoice
2. In the "PDF Invoice" section, click "Choose File" to select a PDF file
3. Complete the other invoice details and click "Save"

### Viewing/Downloading a PDF Invoice

1. In the invoice detail view, find the "PDF Invoice" section
2. Click on the "View/Download PDF" link to open the PDF in a new browser tab
3. Use your browser's controls to save the PDF if needed

### List View Access

The invoice list view now includes a "PDF Link" column that provides direct access to the PDF file for each invoice that has one.

## Technical Details

### Model Changes

The `Invoice` model's `save()` method has been modified to:
- Remove the automatic call to `generate_invoice_pdf()`
- Maintain other functionality like notifications and refund handling

### Admin Interface Changes

The `InvoiceAdmin` class has been updated to:
- Include the `pdf_file` field in the form
- Add a dedicated "PDF Invoice" fieldset in the detail view
- Create a `get_pdf_link` method that renders a link to the PDF file
- Add the PDF link to both detail and list views

### File Storage

PDF files are still stored in the `/media/invoices/` directory, consistent with the previous implementation.

## Benefits

This new approach offers several advantages:

1. **Flexibility**: Users can upload pre-designed PDF invoices created with specialized tools
2. **Control**: Administrators have full control over the content and format of invoice PDFs
3. **Simplicity**: No need to worry about automatic PDF generation issues or failures
4. **Performance**: Reduced server load by eliminating background PDF generation tasks

## Migration Notes

The changes are backward compatible:
- Existing PDF files will continue to work with the new interface
- No database migration is required since the model field is unchanged
- The PDF utility functions remain available if needed for future use 