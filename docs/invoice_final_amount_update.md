# Invoice Final Amount Field - Decimal Places Update
## Updated: April 2, 2025

## Overview

We've updated the `final_amount` field in the Invoice model to support 3 decimal places instead of the original 2 decimal places. This update provides more precision for financial amounts, which is important for certain calculations and display purposes.

## Changes Made

### 1. Model Definition Update

Updated the `final_amount` field definition in the `Invoice` model:

```python
# Before
final_amount = models.DecimalField(
    _('Final Amount'), 
    max_digits=10, 
    decimal_places=2,  # 2 decimal places
    blank=True, 
    null=True, 
    help_text=_('Custom final amount to be displayed to the customer.')
)

# After
final_amount = models.DecimalField(
    _('Final Amount'), 
    max_digits=10, 
    decimal_places=3,  # 3 decimal places
    blank=True, 
    null=True, 
    help_text=_('Custom final amount to be displayed to the customer.')
)
```

### 2. Database Migration

Created and applied a migration to update the database column:

1. Created an empty migration:
   ```bash
   docker-compose exec backend python manage.py makemigrations core --empty --name update_final_amount_decimal_places
   ```

2. Added the field alteration operation to the migration:
   ```python
   operations = [
       migrations.AlterField(
           model_name='invoice',
           name='final_amount',
           field=models.DecimalField(blank=True, decimal_places=3, help_text='Custom final amount to be displayed to the customer.', max_digits=10, null=True, verbose_name='Final Amount'),
       ),
   ]
   ```

3. Applied the migration:
   ```bash
   docker-compose exec backend python manage.py migrate core
   ```

4. Directly updated the database column as a safeguard:
   ```sql
   ALTER TABLE core_invoice ALTER COLUMN final_amount TYPE numeric(10,3);
   ```

## Impact

With this change:

1. **Increased Precision**: The field can now store values with 3 decimal places (e.g., 25.265)
2. **Database Storage**: Values are now stored with 3 decimal places in the database
3. **API Responses**: The API will now return values with 3 decimal places
4. **Data Entry**: The admin interface will accept values with 3 decimal places

## Usage Example

Values like these can now be stored without rounding:
- 25.265
- 100.001
- 1234.567

## Compatibility Notes

- Any existing values with 2 decimal places will be preserved
- The update is backward compatible with any code expecting 2 decimal places
- Any calculations that depend on this field will now work with increased precision 