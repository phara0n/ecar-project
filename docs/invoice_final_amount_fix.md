# Invoice Final Amount Field - Database Fix
## Fixed: April 2, 2025

## Issue Description

After adding the `final_amount` field to the Invoice model, we encountered the following error when accessing the invoice edit page in the Django Admin:

```
ProgrammingError at /admin/core/invoice/15/change/
column core_invoice.final_amount does not exist
LINE 1: ...core_invoice"."notes", "core_invoice"."pdf_file", "core_invo...
                                                             ^
```

This occurred because while the field was added to the model in the Python code, the corresponding database column was not created because the migration wasn't properly applied.

## Fix Applied

We resolved this issue by:

1. **Creating a specific migration for the new field:**
   ```bash
   docker-compose exec backend python manage.py makemigrations core --empty --name add_final_amount_to_invoice
   ```

2. **Editing the migration file to add the field:**
   ```python
   # core/migrations/0002_add_final_amount_to_invoice.py
   operations = [
       migrations.AddField(
           model_name='invoice',
           name='final_amount',
           field=models.DecimalField(blank=True, decimal_places=2, help_text='Custom final amount to be displayed to the customer.', 
                                     max_digits=10, null=True, verbose_name='Final Amount'),
       ),
   ]
   ```

3. **Applying the migration:**
   ```bash
   docker-compose exec backend python manage.py migrate core
   ```

## Root Cause Analysis

The issue occurred because:
- When we initially added the field to the Invoice model, we didn't create a new migration
- The Django ORM was looking for a column that didn't exist in the database
- The model definition and database schema were out of sync

## Verification

After applying the fix, we verified that:
1. The migration was successfully applied
2. The column now exists in the database
3. The Django Admin interface can now access and display the field correctly

## Lessons Learned

1. **Always create and apply migrations after model changes:**
   - Use `makemigrations` after any model field additions, modifications, or removals
   - Verify with `showmigrations` that the migrations are created
   - Apply the migrations with `migrate`

2. **Test changes thoroughly:**
   - After adding a new field, check that it works in the admin interface
   - Verify that the field appears in both the list and detail views
   - Test creating and editing records with the new field

3. **Database synchronization:**
   - Keep the Django model definitions in sync with the database schema
   - Use the Django migration system for all database schema changes
   - Avoid direct database schema modifications

## Related Documentation

- [Invoice Final Amount Field](/docs/invoice_final_amount.md)
- [Django Migrations Guide](https://docs.djangoproject.com/en/5.1/topics/migrations/) 