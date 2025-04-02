# License Plate Validation
## Added: April 2, 2025

## Overview

We've implemented validation for license plate formats in the Car model to ensure that only valid formats are accepted. The system now supports two specific license plate formats:

1. **TU Format**: `xxxTUxxxx` where:
   - Left `xxx` must be exactly 3 digits (e.g., 123, 456, 789)
   - Middle part is always "TU"
   - Right `xxxx` can be 1-4 digits (e.g., 1, 23, 456, 7890)
   - Examples: 123TU4567, 789TU1, 456TU23

2. **RS Format**: `RSxxxxx` where:
   - Starts with "RS"
   - Followed by 1-6 digits
   - Examples: RS1, RS123, RS456789

## Implementation Details

### 1. Validation Function

Created a custom validation function that uses regular expressions to check the license plate format:

```python
def validate_license_plate(value):
    """
    Validate license plate format.
    Valid formats:
    - xxxTUxxxx: 3 digits + TU + 1-4 digits
    - RSxxxxx: RS + 1-6 digits
    """
    # Pattern for TU format: 3 digits + TU + 1-4 digits
    tu_pattern = r'^\d{3}TU\d{1,4}$'
    
    # Pattern for RS format: RS + 1-6 digits
    rs_pattern = r'^RS\d{1,6}$'
    
    if not (re.match(tu_pattern, value) or re.match(rs_pattern, value)):
        raise ValidationError(
            _('Invalid license plate format. Must be either xxxTUxxxx (where x are digits) or RSxxxxx (where x are digits).')
        )
```

### 2. Model Integration

Updated the Car model to use the validation function:

```python
license_plate = models.CharField(
    _('License Plate'), 
    max_length=20, 
    unique=True, 
    validators=[validate_license_plate]
)
```

### 3. Admin Interface Enhancement

Added detailed help text in the admin interface to guide users on the correct formats:

```python
form.base_fields['license_plate'].help_text = _(
    'Enter license plate in one of these formats:<br>'
    '1. xxxTUxxxx - where left x\'s are exactly 3 digits and right x\'s are 1-4 digits (e.g., 123TU45, 567TU8901)<br>'
    '2. RSxxxxx - where x\'s are 1-6 digits (e.g., RS123, RS456789)'
)
```

### 4. API Integration

Enhanced the API serializer to provide clear error messages when invalid formats are submitted:

```python
extra_kwargs = {
    'license_plate': {
        'error_messages': {
            'invalid': _('Invalid license plate format. Must be either xxxTUxxxx (where x are digits) or RSxxxxx (where x are 1-6 digits).'),
        }
    }
}
```

## Database Migration

Created and applied a migration to add the validator to the license_plate field:

```bash
docker-compose exec backend python manage.py makemigrations core --empty --name add_license_plate_validation
docker-compose exec backend python manage.py migrate core
```

## User Experience

1. **Data Entry Guidance**: Users are provided with clear instructions on the expected format
2. **Validation Errors**: Clear error messages are shown when invalid formats are entered
3. **Examples**: Example formats are provided in the help text to guide users

## Compatibility Notes

- This validation applies to all new car records
- Existing car records should be checked and updated if they don't follow the required format
- Both Django Admin and API endpoints enforce this validation

## Testing

You can test the validation with these examples:

**Valid formats:**
- `123TU456`: Valid TU format (3 digits + TU + 3 digits)
- `789TU1`: Valid TU format (3 digits + TU + 1 digit)
- `456TU7890`: Valid TU format (3 digits + TU + 4 digits)
- `RS1`: Valid RS format (RS + 1 digit)
- `RS123456`: Valid RS format (RS + 6 digits)

**Invalid formats:**
- `12TU456`: Invalid (only 2 digits before TU)
- `1234TU456`: Invalid (4 digits before TU)
- `123TU12345`: Invalid (5 digits after TU)
- `RS1234567`: Invalid (7 digits after RS)
- `AB123`: Invalid (doesn't match either pattern) 