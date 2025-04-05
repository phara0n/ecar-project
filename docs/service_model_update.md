# Service Model Update Documentation

## Overview

We've made important updates to the Service model to clarify the purpose of the "routine maintenance" checkbox and ensure that car mileage is properly updated for all services, regardless of their maintenance type.

## Changes Made

### 1. Mileage Updates for All Services

Previously, the car's mileage was only updated when a service was marked as "routine maintenance". This has been changed so that **all services** (both routine and non-routine) will update the car's mileage when:

- The service is marked as completed
- The service has a service_mileage value
- The service_mileage is greater than the car's current mileage

This ensures that the car's mileage is always kept up-to-date, regardless of the type of service performed.

### 2. Clearer Purpose for "Routine Maintenance" Checkbox

We've added a more detailed help text for the "routine maintenance" checkbox to clarify its purpose:

```python
is_routine_maintenance = models.BooleanField(
    default=False,
    help_text=_(
        "Check this box if this service is part of the car's regular maintenance schedule. "
        "When checked and the service is completed, a service history record will be created "
        "and used for future service predictions. For non-routine repairs (like fixing a broken part), "
        "leave this unchecked."
    )
)
```

### 3. Separation of Concerns

We've updated the code to clearly separate:

- **Mileage updates**: Apply to all services
- **Service history creation**: Only applies to routine maintenance services
- **Service prediction updates**: Only happens after routine maintenance

## When to Check "Routine Maintenance"

The "routine maintenance" checkbox should be checked when:

1. The service is part of the car's regular maintenance schedule (oil changes, filter replacements, etc.)
2. The service should be tracked for prediction purposes
3. The service affects the car's maintenance interval

Examples of when to check:
- Regular oil changes
- Scheduled inspections
- Tire rotations
- Filter replacements
- Any service listed in the car's maintenance schedule

Examples of when NOT to check:
- Repairing a broken part
- Addressing a specific issue/complaint
- Cosmetic work
- Installing accessories
- Services that don't affect the maintenance schedule

## Benefits of This Update

1. **Accurate Mileage Tracking**: Car mileage is now updated for all services, providing a more accurate record of the car's usage.

2. **Clearer User Guidance**: The improved help text makes it clearer when to check the "routine maintenance" box.

3. **More Reliable Service History**: Only routine maintenance services create service history records, keeping the maintenance history clean and relevant.

4. **Better Service Predictions**: By clearly distinguishing routine maintenance from repairs, the system can make more accurate predictions about future service needs.

## Implementation Details

The changes were implemented in:

1. `Service.save()` method in `core/models.py`
2. `ServiceSerializer.update()` method in `api/serializers.py`
3. Updated help text for the `is_routine_maintenance` field

These changes work together to ensure consistent behavior across all parts of the application. 