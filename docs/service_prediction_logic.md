# Service Prediction Logic - ECAR Garage Management System

## Overview

The service prediction feature in the ECAR Garage Management System uses intelligent algorithms to predict when vehicles will need their next service. This is calculated based on time intervals, mileage thresholds, or a combination of both factors, depending on the service type.

## Core Concepts

### Service Intervals

Service intervals define when maintenance should be performed based on:

- **Interval Type**:
  - `time`: Based solely on elapsed time (days since last service)
  - `mileage`: Based solely on kilometers driven since last service
  - `both`: Considers both time and mileage, recommending service when either threshold is reached

- **Parameters**:
  - `mileage_interval`: Number of kilometers between services (e.g., 10,000 km)
  - `time_interval_days`: Number of days between services (e.g., 180 days / 6 months)
  - `car_make` and `car_model`: Optional make/model specificity for tailored intervals

## Prediction Algorithm

The prediction logic is implemented in the `Car` model's `calculate_next_service_date` method. Here's how it works step by step:

### 1. Finding Applicable Service Intervals

```python
service_intervals = ServiceInterval.objects.filter(
    Q(car_make=self.make, car_model=self.model) | 
    Q(car_make=self.make, car_model__isnull=True) |
    Q(car_make__isnull=True, car_model__isnull=True),
    is_active=True
).order_by('-car_make', '-car_model')
```

The system looks for service intervals matching the car's make and model with the following priority:
1. Exact match on both make and model (most specific)
2. Match on make only
3. Generic intervals with no make/model specified (fallback)

### 2. Calculating Daily Mileage Rate

The system determines the vehicle's average daily usage by analyzing:

a. **Recent mileage updates** (preferred method):
```python
mileage_updates = list(MileageUpdate.objects.filter(car=self).order_by('-reported_date')[:10])
# ...
oldest_update = mileage_updates[-1]
newest_update = mileage_updates[0]
days_difference = (newest_update.reported_date - oldest_update.reported_date).days
mileage_difference = newest_update.mileage - oldest_update.mileage
daily_mileage_rate = mileage_difference / days_difference
```

b. **Service history** (fallback if insufficient mileage updates):
```python
service_history = list(ServiceHistory.objects.filter(car=self).order_by('-service_date')[:5])
# ...
oldest_service = service_history[-1]
newest_service = service_history[0]
days_difference = (newest_service.service_date - oldest_service.service_date).days
mileage_difference = newest_service.service_mileage - oldest_service.service_mileage
daily_mileage_rate = mileage_difference / days_difference
```

This daily rate is crucial for predicting when mileage thresholds will be reached.

### 3. Calculating Next Service Details

#### a. Using Specific Service History

The system first tries to find the most recent service that matches the specific service interval type:

```python
matching_service_history = ServiceHistory.objects.filter(
    car=self,
    service_interval=service_interval
).order_by('-service_date').first()

if matching_service_history:
    if service_interval.mileage_interval:
        next_service_mileage = matching_service_history.service_mileage + service_interval.mileage_interval
        
    if service_interval.time_interval_days:
        time_based_date = matching_service_history.service_date + datetime.timedelta(days=service_interval.time_interval_days)
        next_service_date = time_based_date
```

#### b. Fallback to Last Service or Current Data

If no specific service history exists for this interval:

```python
if service_interval.mileage_interval:
    # If car has service history, use last service as base
    if self.last_service_mileage:
        next_service_mileage = self.last_service_mileage + service_interval.mileage_interval
    else:
        # Otherwise use current mileage as base
        next_service_mileage = self.mileage + service_interval.mileage_interval
        
if service_interval.time_interval_days:
    if self.last_service_date:
        time_based_date = self.last_service_date + datetime.timedelta(days=service_interval.time_interval_days)
    else:
        time_based_date = timezone.now().date() + datetime.timedelta(days=service_interval.time_interval_days)
```

### 4. Handling Combined Interval Types

For intervals with type='both', the system performs extra calculations to ensure comprehensive predictions:

```python
if service_interval.interval_type == 'both' and service_interval.mileage_interval and service_interval.time_interval_days:
    # Calculate mileage-based date if we have a next_service_mileage but no next_service_date
    if next_service_mileage and not next_service_date:
        mileage_remaining = next_service_mileage - self.mileage
        days_until_service = mileage_remaining / daily_mileage_rate if daily_mileage_rate > 0 else 365
        mileage_based_date = timezone.now().date() + datetime.timedelta(days=days_until_service)
        next_service_date = mileage_based_date
        
    # Calculate time-based mileage if we have a next_service_date but no next_service_mileage
    elif next_service_date and not next_service_mileage:
        days_until_time_service = (next_service_date - timezone.now().date()).days
        next_service_mileage = self.mileage + (daily_mileage_rate * max(days_until_time_service, 0))
        
    # If we have both, determine which comes first (time or mileage)
    elif next_service_date and next_service_mileage:
        mileage_remaining = next_service_mileage - self.mileage
        days_until_mileage_service = mileage_remaining / daily_mileage_rate if daily_mileage_rate > 0 else 365
        mileage_based_date = timezone.now().date() + datetime.timedelta(days=days_until_mileage_service)
        
        # Use the earlier of the two dates
        if mileage_based_date < next_service_date:
            next_service_date = mileage_based_date
```

This ensures that for "both" type intervals, we always have complete predictions for both time and mileage, and we recommend the earliest upcoming service date.

## Practical Example

For a car with:
- Current mileage: 45,000 km
- Last service: 40,000 km on December 15, 2023
- Average daily mileage: 35 km/day
- Service interval: 10,000 km or 180 days (whichever comes first)

The system will calculate:
1. Next service due at 50,000 km
2. Mileage-based prediction: 50,000 km will be reached in approximately 143 days (5,000 km ÷ 35 km/day)
3. Time-based prediction: 180 days after December 15, 2023 = June 12, 2024
4. Final prediction: The car will need service in 143 days (around May 22, 2024) when it reaches 50,000 km, since the mileage threshold will be reached before the time threshold.

## Benefits

This prediction system offers several advantages:

1. **Proactive Maintenance**: Alerts customers before service is due
2. **Flexible Scheduling**: Accommodates both time and mileage-based maintenance schedules
3. **Make/Model Specificity**: Can be tailored to specific vehicle requirements
4. **Data-Driven**: Improves accuracy as more mileage data is collected
5. **Customer Trust**: Builds customer confidence through transparent, consistent service recommendations

## Technical Implementation

The prediction logic is implemented in the Car model and is automatically called when vehicles are updated. The results are stored in:

- `next_service_date`: The predicted date when service will be needed
- `next_service_mileage`: The predicted mileage when service will be needed

These fields are used throughout the system for notifications, reminders, and service planning.

## Future Enhancements

Potential improvements to the prediction system could include:

1. Machine learning models to further refine predictions based on driving patterns
2. Seasonal adjustments (e.g., increased mileage during summer months)
3. Integration with vehicle telematics for real-time mileage tracking
4. Personalized service recommendations based on driving style and conditions

---

Last updated: April 5, 2024 