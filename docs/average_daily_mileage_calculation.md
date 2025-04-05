# Average Daily Mileage Calculation Method

## Overview

The average daily mileage calculation is a critical component of the ECAR Garage Management System that powers service predictions. It determines how quickly a car accumulates mileage, which directly affects when the next service will be due.

## Refined Calculation Method

The system uses a sophisticated hierarchy of calculations to determine average daily mileage:

### Special Case: Same-Day Activities for New Cars

For newly created cars with all activity (service, mileage updates) occurring on the same day as creation:

- **For pre-owned vehicles with significant initial mileage (>500 km) but small mileage difference**:
  - The system recognizes this is likely a pre-owned vehicle just added to the system
  - It uses the mileage difference (current - initial) as the daily rate if non-zero
  - This applies when adding a pre-owned car to the system (e.g., 1000 km initial, 1050 km current = 50 km/day)
  - This ensures accurate predictions based on actual usage since being added to the system

- **For cars with significant mileage difference (>500 km driven since creation)**:
  - The system recognizes that despite being new in the system, the car has accumulated substantial mileage after creation
  - It calculates an adjusted daily rate by assuming the mileage difference was accumulated over a 7-day period
  - This provides more realistic predictions than the default value (e.g., 600 km difference ÷ 7 days = 85.7 km/day)
  - This applies when a significant amount of driving occurred after the car was added

- **For cars with minimal mileage difference (<500 km)**:
  - The system recognizes that there's not enough historical data to make an accurate calculation
  - In these cases, it automatically falls back to the default value of 50 km/day
  - This applies when a brand new car is serviced on the same day it's added to the system
  - If mileage updates are added and later removed, the system will revert to this default value

### Calculation Hierarchy

1. **Special Cases Detection** (Highest Priority)
   - Car created today with pre-owned status (high initial, small difference): Use actual mileage difference
   - Car created today with significant mileage difference (>500 km): Use adjusted rate (difference ÷ 7 days)
   - Car created today with minimal mileage difference: Use default value (50 km/day)
   - Recently created car (≤7 days) with significant mileage: Use adjusted rate (difference ÷ 7 days)
   - Recently created car (≤7 days) with only creation-day service history: Use default value

2. **Combined Events Approach**
   - Uses all available data points (mileage updates, service history, and car creation)
   - Always includes the car's initial mileage at creation as a data point
   - Includes the car's current mileage as a data point if different from other records
   - Calculates based on the newest and oldest events to capture the full vehicle history
   - Special case handling for creation-day-only service history with significant mileage

3. **Service History Only** (First Fallback)
   - Used when combined approach doesn't yield results or when mileage updates have been removed
   - Includes special case handling for same-day/creation-day service records
   - Special handling for significant service mileage on creation day
   - Compares service history records or falls back to car creation date
   - Enforces minimum time spans (7 days) to prevent unrealistic rates
   - Caps results for short time periods to reasonable values (max 200 km/day for <7 days)

4. **Mileage Updates Only** (Second Fallback)
   - Used when no service history is available
   - Similar approach to service history, with safeguards for short time spans
   - Includes special case handling for same-day/creation-day mileage updates

5. **Current Mileage Based** (Third Fallback)
   - Uses current car mileage compared to creation date
   - Ensures minimum time span of 7 days for calculation
   - For new cars (≤7 days), falls back to default value unless mileage is significant

6. **Previous Average or Default** (Final Fallback)
   - Uses previously calculated average if available
   - Falls back to default of 50 km/day if no data available

### Same-Day Activity Handling

The system handles same-day activity (multiple services or mileage updates on the same day) by:
- Accumulating the total mileage change across all events
- Using minimum and maximum mileage values to determine the day's total usage
- Implementing rate capping to avoid unrealistic values from same-day data
- For same-day activities on car creation day with minimal mileage, using the default value (50 km/day)
- For same-day activities on car creation day with significant mileage (>500 km), using an adjusted rate

### Rate Capping for Realistic Values

To prevent unrealistic daily mileage calculations, the system implements:
- A minimum days value (1 day for general calculations, 7 days for single-point calculations)
- Rate capping for large mileage differences over short periods
- Maximum caps of 200 km/day for very short periods (≤7 days)
- For large same-day mileage differences (>1000 km), values are capped to 1/10th or maximum of 1000 km/day
- For significant mileage on new cars, the system assumes accumulation over a 7-day period

## Key Improvements

1. **Resilient to Missing Data**: Even if mileage updates are removed, the system will automatically fall back to service history or default values.
2. **Stable Predictions for New Cars**: Uses default values for cars with only same-day activity and minimal mileage to ensure stable predictions.
3. **Creation Date Awareness**: Recognizes and handles the special case of activities occurring on the car creation date.
4. **Significant Mileage Recognition**: Detects when a car has substantial mileage despite being new in the system, providing more realistic calculations.
5. **Combined Data Sources**: Always considers all available data points, prioritizing service history.
6. **Initial Data Point**: Always includes car creation date and initial mileage as a reference point.
7. **Current Mileage Integration**: Incorporates the car's current mileage as an additional data point.
8. **Realistic Rate Prevention**: Implements multiple safeguards to prevent unrealistic daily mileage rates.
9. **Removal Recovery**: Properly reverts to appropriate values when mileage updates are removed.
10. **Zero Division Prevention**: Ensures all time spans are at least 1 day to prevent division by zero.
11. **Same-Day Activity Handling**: Properly handles multiple events on the same day.

## Implementation

The refined average daily mileage calculation is implemented in the `_calculate_average_daily_mileage()` method in the `Car` model. This method is called by the `update_service_predictions()` method, which is triggered:

1. When a new service is completed
2. When a new mileage update is reported
3. When a mileage update is deleted
4. When running the `update_service_predictions` management command

## Benefits

- **Improved Accuracy**: Service predictions are more accurate even with minimal data.
- **Resilience**: The system can calculate reasonable estimates even when data is removed or incomplete.
- **Stability for New Cars**: Provides stable predictions for newly added cars with limited history.
- **Realistic Predictions for Pre-Owned Vehicles**: Gives better estimates for used cars added with significant mileage.
- **Safety Guards**: Prevents unrealistic daily mileage values that could lead to incorrect predictions.
- **Transparency**: Enhanced logging provides clear insight into how calculations are performed.
- **Adaptive**: The system adapts to different data availability scenarios and prioritizes the most reliable data.
- **Consistent Fallbacks**: Properly falls back to appropriate values when needed, ensuring reasonable predictions.

## Testing and Validation

The calculation method has been tested with various scenarios:

1. **Newly Created Cars with Minimal Mileage**: Uses default values (50 km/day) with minimal data.
2. **Newly Created Cars with Significant Mileage**: Uses adjusted rates based on mileage (e.g., 1200 km ÷ 7 days = 171.4 km/day).
3. **Cars with Multiple Service Records**: Prioritizes service history for calculation.
4. **Cars with Missing Mileage Updates**: Falls back to service history properly or to appropriate values when needed.
5. **Same-Day Activities**: Properly accumulates mileage changes on the same day.
6. **Unrealistic Values**: Successfully caps and adjusts unusually high daily mileage rates.
7. **Mileage Update Removal**: Correctly reverts to appropriate values when mileage updates are removed.

The system now correctly handles the following edge cases:
- A car is created with initial mileage (e.g., 1000 km)
- A service is performed on the same day (e.g., at 1020 km)
- A customer adds a mileage update (e.g., 1200 km) which causes recalculation of the daily rate
- If the mileage update is later removed, the system will calculate an appropriate rate based on the car's current mileage
- For significant mileage (>500 km), the system will calculate an adjusted rate instead of using the default value

This ensures that service predictions remain stable and reasonable even when data is modified or removed, while also providing more accurate predictions for pre-owned vehicles with existing mileage. 