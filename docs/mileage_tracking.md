# Mileage Tracking System

## Overview

The ECAR Garage Management System includes a comprehensive mileage tracking system that maintains accurate vehicle mileage records. This system is critical for several features:

- Service scheduling based on mileage
- Maintenance predictions
- Service history tracking
- Average daily mileage calculations
- Vehicle usage analytics

## Mileage Data Sources

The system tracks vehicle mileage through multiple sources:

1. **Mileage Updates**: Direct mileage reports from customers or staff
2. **Service Records**: Mileage recorded during service appointments
3. **Initial Registration**: Mileage when the car is first added to the system (now stored in `initial_mileage` field)

## Mileage Fields

The system uses two distinct mileage fields for tracking:

1. **Initial Mileage**: The immutable odometer reading when a car was first added to the system
   - Stored in the `initial_mileage` field
   - Represents a permanent historical record of the car's mileage at the time of registration
   - Can only be manually modified by superadmins (for corrections)
   - Never automatically modified by any system process under any circumstances
   - Used as the absolute baseline for all mileage calculations
   - Automatically set to the car's initial mileage value at creation
   - Visible in the admin interface and API responses

2. **Current Mileage**: The most recent recorded mileage for the car
   - Stored in the `mileage` field
   - Updated through mileage updates and service records
   - Used for service scheduling and predictions
   - Can be incremented but not decreased
   - May revert to previous values if incorrect mileage updates are deleted, but never below the `initial_mileage`

## Mileage Update Flow

### Creating Mileage Updates

When a new mileage update is created:

1. The system validates that the new mileage is higher than:
   - The car's current mileage
   - Any previous mileage update values

2. If the mileage is valid:
   - The new value is saved as a MileageUpdate record
   - The car's current mileage is updated to the new value (if higher)
   - Service predictions are recalculated based on the new data

3. The new mileage data is used to:
   - Update the car's average daily mileage
   - Recalculate the next service date and mileage
   - Provide more accurate service predictions

### Deleting Mileage Updates

When a mileage update is deleted (e.g., if it was entered incorrectly):

1. The system identifies the deleted update's mileage value
2. It checks if this value is currently set as the car's mileage
3. If yes, the system determines the correct fallback value:
   - First, it looks for the most recent remaining mileage update
   - Then, it checks for the highest service history mileage
   - It uses the higher of these two values
4. The car's mileage is updated to this fallback value
5. Service predictions are recalculated based on the corrected data

This ensures that when incorrect mileage updates are deleted, the car's mileage reverts to an accurate previous value, maintaining data integrity.

## Car Creation and Initial Mileage

When a new car is added to the system:

1. Both `mileage` and `initial_mileage` can be set at creation
2. If `initial_mileage` is not explicitly set but `mileage` is provided, `initial_mileage` is automatically set to match `mileage`
3. After creation, only superadmins can modify the `initial_mileage` value
4. Regular users can still update the current `mileage` through:
   - Mileage updates
   - Service records
   - Admin interface (superadmins only)

## Average Daily Mileage Calculation

The `initial_mileage` field improves average daily mileage calculations by:

1. Providing a more accurate starting point for calculations
2. Allowing for pre-owned vehicles with existing mileage to have proper calculations
3. Improving the accuracy of service predictions based on actual usage since the car was added to the system
4. Enabling accurate calculations for vehicles registered with non-zero mileage

The average daily mileage calculation now uses `initial_mileage` instead of assuming the car started at 0 km.

## Service-Based Mileage Updates

In addition to direct mileage updates, the system also updates mileage when services are completed:

1. When a service is marked as completed with a recorded service_mileage:
   - If the service_mileage is higher than the car's current mileage, the car's mileage is updated
   - This happens for both routine maintenance and non-routine repairs
   - Service history records are created (for routine maintenance)
   - Service predictions are updated

2. Benefits of dual mileage tracking:
   - More frequent data points for prediction accuracy
   - Automatic updates during regular service visits
   - Redundancy in case one data source is missing

## Implementation Details

### Mileage Update Model

The `MileageUpdate` model stores:
- Car reference
- Mileage value
- Reported date
- Optional notes
- Creation timestamp

### Validation Logic

Mileage updates are validated to ensure:
- New mileage is higher than the car's current mileage
- New mileage is higher than any previous mileage updates
- Multiple updates can occur on the same day (for fixing errors)

### Deletion Logic

When a mileage update is deleted:
1. The system checks if the car's current mileage matches the deleted update
2. If matching, it searches for alternative mileage sources:
   - Most recent remaining mileage update
   - Highest service history mileage
3. It selects the higher value between these sources
4. The car's mileage is updated to this value
5. Service predictions are recalculated

### Average Daily Mileage Integration

Mileage updates are a key data source for average daily mileage calculations:
- Used to establish mileage change over time
- Combined with service history data for more accurate calculations
- Help predict future mileage for service scheduling
- Now using initial_mileage as a more accurate starting point

## Best Practices for Mileage Management

1. **Setting Initial Mileage**: Always set the correct `initial_mileage` when adding a car to the system
2. **Regular Updates**: Encourage customers to update mileage regularly
3. **Correction Protocol**: When a mileage error is discovered:
   - Delete the incorrect mileage update
   - Add a new correct mileage update if needed
   - Verify the car's mileage value is accurate after deletion
4. **Service Integration**: Always record mileage during service appointments
5. **Validation**: Verify mileage is increasing over time
6. **Data Integrity**: Maintain chronological consistency in mileage records

## Troubleshooting

If mileage values seem incorrect:

1. Check the MileageUpdate history for the car
2. Verify service history records
3. Ensure the car's mileage field is updated correctly
4. Check if initial_mileage was set properly at car creation
5. Delete any incorrect mileage updates
6. Add new, correct mileage updates if necessary

## Recent Fixes

1. **May 25, 2024**: Fixed issue with car mileage not reverting properly when mileage updates are deleted
   - Added intelligent fallback to previous mileage values
   - Implemented conditional updates based on data source
   - Enhanced logging for better troubleshooting
   - Added validation to ensure mileage integrity

2. **May 26, 2024**: Added `initial_mileage` field to Car model
   - Created a dedicated field to store the starting mileage
   - Made it editable only by superadmins
   - Added automatic setting of initial_mileage when a car is created
   - Updated average daily mileage calculation to use initial_mileage
   - Improved mileage reporting accuracy for pre-owned vehicles

## Technical Implementation

The mileage tracking functionality is implemented in:

- `backend/core/models.py`: Car model with initial_mileage field and MileageUpdate model with validation logic
- `backend/api/views.py`: MileageUpdateViewSet with deletion handling
- `backend/api/serializers.py`: CarSerializer and MileageUpdateSerializer for data validation
- `backend/core/admin.py`: CarAdmin with special handling for initial_mileage field

These components work together to ensure accurate and consistent mileage tracking throughout the system. 