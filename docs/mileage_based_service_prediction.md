# Mileage-Based Service Prediction System
## Updated: April 2, 2025

## Overview

We've implemented a comprehensive service prediction system that allows car owners to periodically report their mileage and uses this data to predict when the next service will be due. This feature combines historical mileage data with configurable service intervals and service history to provide accurate maintenance recommendations.

## Key Components

### 1. Mileage Update Tracking

Car owners can now report their current mileage through:
- The mobile app interface
- The web admin dashboard (for staff)

Each mileage update is recorded with a timestamp, allowing the system to calculate average daily mileage.

### 2. Service Interval Configuration

Service intervals can be defined based on:
- **Mileage Interval**: Service is due after a specific number of kilometers
- **Time Interval**: Service is due after a specific number of days
- **Combined**: Service is due when either threshold is reached (whichever comes first)

Intervals can be configured globally or specific to a car's make and model, allowing for tailored maintenance schedules.

### 3. Service History Tracking

When a service is performed:
- It can be marked as "routine maintenance" to indicate it should reset the maintenance intervals
- It can be associated with a specific service type (oil change, major service, etc.)
- The system records the completed service date and mileage
- This information is used for future service predictions

### 4. Next Service Prediction

The system calculates the next service date based on:
- The car's current mileage
- Historical mileage accumulation rate
- Defined service intervals (mileage or time-based)
- The car's last service date and mileage
- Service history records for specific maintenance types

## Implementation Details

### 1. New Models

#### MileageUpdate Model
```python
class MileageUpdate(models.Model):
    """Track periodic mileage updates from car owners"""
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='mileage_updates')
    mileage = models.PositiveIntegerField(_('Current Mileage'))
    reported_date = models.DateTimeField(_('Reported Date'), auto_now_add=True)
    notes = models.TextField(_('Notes'), blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

#### ServiceInterval Model
```python
class ServiceInterval(models.Model):
    """Define service intervals for maintenance scheduling"""
    INTERVAL_TYPES = [
        ('mileage', _('Mileage Based')),
        ('time', _('Time Based')),
        ('both', _('Mileage and Time Based')),
    ]
    
    name = models.CharField(_('Service Type'), max_length=100)
    description = models.TextField(_('Description'))
    interval_type = models.CharField(_('Interval Type'), max_length=10, choices=INTERVAL_TYPES)
    mileage_interval = models.PositiveIntegerField(_('Mileage Interval (km)'), blank=True, null=True)
    time_interval_days = models.PositiveIntegerField(_('Time Interval (days)'), blank=True, null=True)
    car_make = models.CharField(_('Car Make'), max_length=50, blank=True, null=True)
    car_model = models.CharField(_('Car Model'), max_length=50, blank=True, null=True)
    is_active = models.BooleanField(_('Active'), default=True)
```

#### ServiceHistory Model
```python
class ServiceHistory(models.Model):
    """Track service history for maintenance and prediction purposes"""
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='service_history')
    service = models.OneToOneField(Service, on_delete=models.CASCADE, related_name='service_history_record')
    service_interval = models.ForeignKey(ServiceInterval, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='service_history')
    service_date = models.DateField(_('Service Date'))
    service_mileage = models.PositiveIntegerField(_('Service Mileage'))
    created_at = models.DateTimeField(auto_now_add=True)
```

#### New Fields in Service Model
```python
# New fields for service/maintenance integration
service_type = models.ForeignKey(ServiceInterval, on_delete=models.SET_NULL, 
                               related_name='services', null=True, blank=True)
is_routine_maintenance = models.BooleanField(_('Routine Maintenance'), default=False)
```

#### New Fields in Car Model
```python
# New fields for service prediction
average_daily_mileage = models.FloatField(_('Average Daily Mileage (km)'), blank=True, null=True)
last_service_date = models.DateField(_('Last Service Date'), blank=True, null=True)
last_service_mileage = models.PositiveIntegerField(_('Last Service Mileage'), blank=True, null=True)
next_service_date = models.DateField(_('Estimated Next Service Date'), blank=True, null=True)
next_service_mileage = models.PositiveIntegerField(_('Estimated Next Service Mileage'), blank=True, null=True)
```

### 2. Prediction Algorithm

The enhanced service prediction algorithm now includes service history integration:

```python
def calculate_next_service_date(self):
    """
    Calculate when the next service is due based on mileage updates, service history 
    and service intervals.
    """
    # Find applicable service intervals for this car
    service_intervals = ServiceInterval.objects.filter(
        Q(car_make=self.make, car_model=self.model) | 
        Q(car_make=self.make, car_model__isnull=True) |
        Q(car_make__isnull=True, car_model__isnull=True),
        is_active=True
    ).order_by('-car_make', '-car_model')
    
    # ... calculate daily mileage rate from mileage updates or service history ...
    
    # Check if we have service history for this specific interval type
    matching_service_history = ServiceHistory.objects.filter(
        car=self,
        service_interval=service_interval
    ).order_by('-service_date').first()
    
    # If we have matching service history, use it as a base for prediction
    if matching_service_history:
        if service_interval.mileage_interval:
            next_service_mileage = matching_service_history.service_mileage + service_interval.mileage_interval
            
        if service_interval.time_interval_days:
            next_service_date = matching_service_history.service_date + 
                datetime.timedelta(days=service_interval.time_interval_days)
    
    # ... calculate predictions based on interval type (mileage, time, or both) ...
```

### 3. Service Integration

Services can now be marked as routine maintenance and associated with a specific service type:

```python
def save(self, *args, **kwargs):
    # ... validation code ...
    
    # When a service is completed
    if old_status != 'completed' and self.status == 'completed':
        # ... update car mileage ...
        
        # Only update service history for routine maintenance services
        if self.is_routine_maintenance:
            # Update the car's last service info
            self.car.last_service_date = self.completed_date.date()
            self.car.last_service_mileage = self.service_mileage
            
            # Create service history record if service type is specified
            if self.service_type:
                ServiceHistory.objects.create(
                    car=self.car,
                    service=self,
                    service_interval=self.service_type,
                    service_date=self.completed_date.date(),
                    service_mileage=self.service_mileage
                )
            
            # Recalculate service predictions
            self.car.update_service_predictions()
```

### 4. API Endpoints

#### Service Updates and History
```
# Updating a service when completed
PUT /api/services/{id}/
{
    "status": "completed",
    "service_mileage": 45000,
    "is_routine_maintenance": true,
    "service_type_id": 1,  # ID of the service interval
    "completed_date": "2025-04-01T14:30:00Z"
}

# View service history for a car
GET /api/cars/{id}/service_history/

# View all service history (admin)
GET /api/service-history/
```

#### Mileage Reporting
```
POST /api/cars/{id}/report_mileage/
{
    "mileage": 45000,
    "notes": "Reported via mobile app"
}
```

#### Next Service Prediction
```
GET /api/cars/{id}/next_service_prediction/
```
Response:
```json
{
    "has_prediction": true,
    "next_service_date": "2025-07-15",
    "next_service_mileage": 50000,
    "days_until_service": 104,
    "mileage_until_service": 5000,
    "average_daily_mileage": 48.1,
    "service_type": "Regular Maintenance",
    "service_description": "Oil change, filter replacement, and general inspection"
}
```

#### Mileage History
```
GET /api/cars/{id}/mileage_history/
```

#### Service Interval Management
```
GET /api/service-intervals/
POST /api/service-intervals/
GET /api/service-intervals/{id}/
PUT /api/service-intervals/{id}/
DELETE /api/service-intervals/{id}/
```

Additional helper endpoints:
```
GET /api/service-intervals/for_vehicle/?make=Toyota&model=Corolla
```

### 5. Admin Interface Enhancements

#### Service Admin
- Option to mark services as routine maintenance
- Association with specific service types/intervals
- Service history records automatically created for completed services

#### MileageUpdate Admin
- List view with car, mileage, and reported date
- Automatic car mileage update when a higher mileage is reported
- Automatic service prediction update
- Validation to ensure mileage always increases

#### ServiceInterval Admin
- Configuration of different service types and intervals
- Make/model specific interval settings
- Global default intervals
- Validation for interval types (mileage, time, or both)

#### ServiceHistory Admin
- View service history records
- Track which specific service intervals were applied
- Link to related service records

#### Car Admin Enhancements
- Display next service date and mileage
- Show service prediction information
- Track average daily mileage

## Business Value

This feature provides several key benefits:

1. **Proactive Maintenance**: Allows customers to be notified before service is due, preventing breakdowns and more expensive repairs
2. **Data-Driven Scheduling**: Uses actual usage patterns and service history rather than fixed schedules, for more accurate service timing
3. **Resource Optimization**: Helps the garage plan for upcoming service needs
4. **Customer Retention**: Enhances customer service by providing a personalized maintenance schedule
5. **Vehicle Lifespan**: Ensures vehicles receive timely maintenance, extending their useful life
6. **Service Tracking**: Provides comprehensive service history for each vehicle

## User Experience

### For Car Owners
- Simple interface to report current mileage
- Clear indication of when the next service is due
- Personalized maintenance schedule based on their driving patterns and service history
- Notifications when approaching service due date

### For Garage Staff
- Dashboard showing upcoming services based on predictions
- Ability to configure service intervals for different vehicle types
- Better scheduling capabilities based on expected service needs
- Historical mileage and service tracking data for analysis

## Technical Implementation Notes

- **Migrations**: 
  - `0007_car_average_daily_mileage_car_last_service_date_and_more.py` - Initial service prediction fields
  - `0008_service_is_routine_maintenance_service_service_type_and_more.py` - Service integration

- **Migration Commands**:
  - `backfill_service_history` - Utility to create service history records from existing services

- **Validation**: Comprehensive validation ensures data integrity (e.g., mileage cannot decrease)

## Future Enhancements

1. **Dynamic Intervals**: Adjust service intervals based on driving patterns (highway vs. city)
2. **Multi-Factor Prediction**: Consider additional factors like driving conditions, weather, etc.
3. **ML-Based Prediction**: Use machine learning to enhance prediction accuracy 
4. **Part-Specific Tracking**: Track different components with different service intervals
5. **Service Recommendation**: Include specific service recommendations based on mileage, time, and service history
6. **Integration with Parts Inventory**: Automatically check parts availability for upcoming services
7. **Detailed Analytics**: Provide analytics on service patterns, vehicle reliability, and maintenance costs

## How to Use

### Creating Service Intervals

1. In the admin interface, go to "Service Intervals" and click "Add"
2. Enter a name and description (e.g., "Oil Change", "Major Service")
3. Choose the interval type (mileage, time, or both)
4. If applicable, enter make and model for specific vehicles
5. Set the appropriate mileage and/or time intervals
6. Save the interval

### Completing Services with Maintenance Updates

1. When completing a service:
   - Set the status to "Completed" 
   - Enter the service mileage
   - Check "Is routine maintenance" if it should reset the service intervals
   - Select the appropriate service type from the dropdown
   - Ensure the completed date is set correctly
2. Save the service
3. The system will automatically:
   - Update the car's mileage if higher than current
   - Create a service history record
   - Update the car's prediction for next service
   - Create notifications if applicable

### Reporting Mileage (API)

```python
import requests

# Report new mileage
response = requests.post(
    "http://api.ecar.tn/api/cars/123/report_mileage/",
    headers={"Authorization": f"Bearer {token}"},
    json={"mileage": 45000}
)

# Get service prediction
prediction = requests.get(
    "http://api.ecar.tn/api/cars/123/next_service_prediction/",
    headers={"Authorization": f"Bearer {token}"}
)
``` 