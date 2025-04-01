# Swagger Documentation Fix

## Issue Description

The Swagger documentation was failing with a 500 Internal Server Error when accessing the `/api/docs/?format=openapi` endpoint. This issue was occurring in the Docker environment and preventing proper API documentation.

## Root Cause

After investigation, we found that the error was caused by a field mismatch between the `InvoiceSerializer` and the `Invoice` model:

1. The `InvoiceSerializer` included a field named `tax_rate` which was removed from the `Invoice` model as part of recent updates to simplify the invoice system.
2. The serializer was missing the `pdf_file` field which is now a part of the `Invoice` model for manual PDF uploads.

## Solution

We fixed the issue by updating the `InvoiceSerializer` fields list to properly match the `Invoice` model:

1. Removed the obsolete `tax_rate` field
2. Added the `pdf_file` field which is used for manually uploading invoice PDFs

```python
# Updated InvoiceSerializer.Meta
class Meta:
    model = Invoice
    fields = ['id', 'service', 'service_id', 'invoice_number', 'issued_date', 
             'due_date', 'status', 'subtotal', 'tax_amount', 
             'total', 'notes', 'pdf_file', 'created_at', 'updated_at']
    read_only_fields = ['id', 'invoice_number', 'subtotal', 'tax_amount', 
                      'total', 'created_at', 'updated_at']
```

## Verification

After updating the serializer, we restarted the backend Docker container to apply the changes:

```bash
docker restart ecar_project_backend_1
```

The Swagger documentation now loads properly at `/api/docs/` and correctly displays all API endpoints.

## Preventive Measures

To prevent similar issues in the future:

1. Run the serializer validation script after any model changes:
   ```bash
   docker exec -it ecar_project_backend_1 python scripts/validate_serializers.py
   ```

2. Always check for field consistency between models and serializers when updating models.

3. Consider implementing automated CI/CD checks to validate serializers.

## Related Documentation

- Review the [API Documentation Guide](../api_documentation_guide.md) for information on how to properly document API endpoints
- See the [Serializer Validation Documentation](../serializer_validation.md) for details on how to validate serializers 