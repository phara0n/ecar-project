from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
import uuid
from django.db import transaction
import time
import re
import datetime
from django.core.exceptions import ValidationError
from django.db.models import Q
from django.utils import timezone
import logging
from datetime import timedelta
from django.conf import settings

User = settings.AUTH_USER_MODEL

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


class Customer(models.Model):
    """
    Customer model representing garage clients
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer')
    phone = models.CharField(_('Phone Number'), max_length=20)
    address = models.TextField(_('Address'), blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name}"

    class Meta:
        verbose_name = _('Customer')
        verbose_name_plural = _('Customers')
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['phone']),
            models.Index(fields=['created_at']),
        ]


class Car(models.Model):
    """
    Car model representing customer vehicles
    """
    FUEL_CHOICES = [
        ('gasoline', _('Gasoline')),
        ('diesel', _('Diesel')),
        ('electric', _('Electric')),
        ('hybrid', _('Hybrid')),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='cars')
    make = models.CharField(_('Make'), max_length=50)
    model = models.CharField(_('Model'), max_length=50)
    year = models.PositiveIntegerField(_('Year'))
    license_plate = models.CharField(_('License Plate'), max_length=20, unique=True, validators=[validate_license_plate])
    vin = models.CharField(_('VIN'), max_length=17, blank=True, null=True)
    fuel_type = models.CharField(_('Fuel Type'), max_length=10, choices=FUEL_CHOICES, default='gasoline')
    initial_mileage = models.PositiveIntegerField(_('Initial Mileage'), default=0, help_text=_('Starting mileage when car was added to the system. Cannot be changed except by superadmin.'))
    mileage = models.PositiveIntegerField(_('Current Mileage'), default=0)
    # New fields for service prediction
    average_daily_mileage = models.FloatField(_('Average Daily Mileage (km)'), blank=True, null=True)
    last_service_date = models.DateField(_('Last Service Date'), blank=True, null=True)
    last_service_mileage = models.PositiveIntegerField(_('Last Service Mileage'), blank=True, null=True)
    next_service_date = models.DateField(_('Estimated Next Service Date'), blank=True, null=True)
    next_service_mileage = models.PositiveIntegerField(_('Estimated Next Service Mileage'), blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.make} {self.model} ({self.license_plate})"

    def calculate_next_service_date(self):
        """
        Calculate when the next service is due based on mileage updates, service history and service intervals.
        Returns tuple of (next_service_date, next_service_mileage).
        
        If insufficient mileage data is available, calculation will be based only on time (365 days).
        """
        logger = logging.getLogger(__name__)
        
        # Find applicable service intervals for this car
        service_intervals = ServiceInterval.objects.filter(
            Q(car_make=self.make, car_model=self.model) | 
            Q(car_make=self.make, car_model__isnull=True) |
            Q(car_make__isnull=True, car_model__isnull=True),
            is_active=True
        ).order_by('-car_make', '-car_model')
        
        if not service_intervals.exists():
            # If no service intervals found, provide a basic fallback prediction
            # based on specified interval (10,000 km or 365 days)
            logger.warning(f"No service intervals found for car {self.id}. Using fallback prediction.")
            return self._generate_fallback_prediction()
            
        # Use the most specific applicable interval
        service_interval = service_intervals.first()
        logger.info(f"Car {self.id}: Using service interval '{service_interval.name}' with mileage interval {service_interval.mileage_interval} km")
        
        # Calculate average daily mileage using available data
        daily_mileage_rate = self._calculate_average_daily_mileage()
        
        # BUGFIX: Get the highest service mileage from service history
        from django.db.models import Max
        highest_service_mileage = ServiceHistory.objects.filter(car=self).aggregate(Max('service_mileage'))['service_mileage__max']
        
        if highest_service_mileage:
            logger.info(f"Car {self.id}: Highest service mileage found: {highest_service_mileage} km")
        
        # Get all service history records for this car, ordered by date (newest first) and mileage (highest first)
        all_service_history = ServiceHistory.objects.filter(car=self).order_by('-service_date', '-service_mileage')
        
        # Always get the newest service history record with the highest mileage
        newest_service_history = all_service_history.first()
        
        # Debug log the service history records
        if newest_service_history:
            logger.info(f"Car {self.id}: Found newest service history with mileage {newest_service_history.service_mileage} on {newest_service_history.service_date}")
        
        # Check if we have service history for this specific interval type
        matching_service_history = ServiceHistory.objects.filter(
            car=self,
            service_interval=service_interval
        ).order_by('-service_date', '-service_mileage').first()
        
        if matching_service_history:
            logger.info(f"Car {self.id}: Found matching service history with mileage {matching_service_history.service_mileage} on {matching_service_history.service_date}")
        
        next_service_date = None
        next_service_mileage = None
        
        # FIRST PRIORITY: Use the highest service mileage + interval if available
        if highest_service_mileage and service_interval.mileage_interval:
            next_service_mileage = highest_service_mileage + service_interval.mileage_interval
            logger.info(f"Car {self.id}: Setting next service mileage to {next_service_mileage} (highest service mileage {highest_service_mileage} + interval {service_interval.mileage_interval})")
        
        # Calculate the next service date based on the most appropriate service history
        if matching_service_history:
            # Always calculate the time-based date
            if service_interval.time_interval_days:
                time_interval = service_interval.time_interval_days or 365  # Default to 365 if not set
                next_service_date = matching_service_history.service_date + datetime.timedelta(days=time_interval)
            else:
                # If no time interval in service_interval, use the default 365 days
                next_service_date = matching_service_history.service_date + datetime.timedelta(days=365)
        
        # If no matching service interval record, but we have any service history, use the newest one with highest mileage
        elif newest_service_history:
            # Always calculate the time-based date
            if service_interval.time_interval_days:
                time_interval = service_interval.time_interval_days or 365  # Default to 365 if not set
                next_service_date = newest_service_history.service_date + datetime.timedelta(days=time_interval)
            else:
                # If no time interval in service_interval, use the default 365 days
                next_service_date = newest_service_history.service_date + datetime.timedelta(days=365)
        
        # If no service history at all, fall back to last_service data or current data
        else:
            # Always calculate the time-based date
            if self.last_service_date:
                # Use service interval's time interval or default to 365 days
                time_interval = service_interval.time_interval_days or 365
                next_service_date = self.last_service_date + datetime.timedelta(days=time_interval)
            else:
                # If no last service date, use current date + interval
                time_interval = service_interval.time_interval_days or 365
                next_service_date = timezone.now().date() + datetime.timedelta(days=time_interval)
            
            # Calculate mileage-based threshold if we don't already have it
            if next_service_mileage is None and service_interval.mileage_interval:
                if self.last_service_mileage:
                    next_service_mileage = self.last_service_mileage + service_interval.mileage_interval
                    logger.info(f"Car {self.id}: Calculated next service mileage {next_service_mileage} from last service mileage {self.last_service_mileage}")
                else:
                    # Otherwise use current mileage as base
                    next_service_mileage = self.mileage + service_interval.mileage_interval
                    logger.info(f"Car {self.id}: Calculated next service mileage {next_service_mileage} from current mileage {self.mileage}")
        
        # Estimate when car will reach the mileage threshold
        if next_service_mileage:
            # Estimate date when car will reach mileage threshold
            mileage_remaining = next_service_mileage - self.mileage
            # Use a very large number of days if daily_mileage_rate is zero to prioritize time-based date
            days_until_mileage_service = mileage_remaining / daily_mileage_rate if daily_mileage_rate > 0 else 9999
            mileage_based_date = timezone.now().date() + datetime.timedelta(days=days_until_mileage_service)
            
            # Log the mileage-based date calculation
            logger.info(f"Car {self.id}: Mileage remaining: {mileage_remaining}, Days until mileage service: {days_until_mileage_service}, Mileage-based date: {mileage_based_date}")
            
            # For interval_type = 'both' or 'mileage', use the earlier of the two dates
            if service_interval.interval_type in ('both', 'mileage'):
                if not next_service_date or mileage_based_date < next_service_date:
                    logger.info(f"Car {self.id}: Using mileage-based date {mileage_based_date} as it's earlier than time-based date {next_service_date}")
                    next_service_date = mileage_based_date
        
        # If we only have a date but no mileage (unlikely with our logic), estimate the mileage
        if next_service_date and not next_service_mileage:
            days_until_service = (next_service_date - timezone.now().date()).days
            next_service_mileage = self.mileage + (daily_mileage_rate * max(days_until_service, 0))
            logger.info(f"Car {self.id}: Estimated next service mileage {next_service_mileage} based on next service date {next_service_date}")
        
        # Round the mileage to an integer
        if next_service_mileage:
            next_service_mileage = int(next_service_mileage)
            
        # If both values are somehow still None, use fallback
        if next_service_date is None or next_service_mileage is None:
            logger.warning(f"Car {self.id}: Next service date or mileage is None, using fallback prediction")
            return self._generate_fallback_prediction()
            
        # Log the final prediction details for debugging
        logger.info(f"Car {self.id}: Final next service date {next_service_date}, mileage {next_service_mileage}")
        
        return next_service_date, next_service_mileage
    
    def _calculate_average_daily_mileage(self):
        """
        Calculate the average daily mileage using available data.
        Uses initial mileage when car was created as first data point if needed.
        Handles same-day activity (services and mileage updates) by accumulating the total mileage changes.
        
        Returns:
            float: The calculated daily mileage rate
        """
        logger = logging.getLogger(__name__)
        
        # Get initial reference points
        car_creation_date = self.created_at.date()
        days_since_creation = max(1, (timezone.now().date() - car_creation_date).days)
        initial_car_mileage = self.initial_mileage  # Use the initial_mileage field instead of assuming 0
        
        # Default daily mileage (if we can't calculate)
        default_daily_mileage = 50.0
        
        logger.info(f"Car {self.id}: Starting mileage calculation. Days since creation: {days_since_creation}, current mileage: {self.mileage}, initial mileage: {initial_car_mileage}")
        
        # First check if we have any data for today (same-day activities)
        today = timezone.now().date()
        
        # Check if this is a new car (created today) with mileage activity
        if car_creation_date == today:
            # Calculate the difference between current and initial mileage
            mileage_difference = self.mileage - initial_car_mileage
            
            # If there is significant mileage difference despite being a new car (>500 km driven since creation)
            if mileage_difference > 500:
                # Use mileage difference as basis for calculation - assume accumulated over at least a week
                adjusted_mileage = mileage_difference / 7
                logger.info(f"Car {self.id}: New car with significant mileage difference ({mileage_difference} km). Using adjusted rate: {adjusted_mileage} km/day")
                return adjusted_mileage
                
            # If the car itself has significant mileage (>500) but the difference is small,
            # this is likely a pre-owned vehicle that was just added to the system
            elif self.mileage > 500 and mileage_difference <= 500:
                # Use the actual mileage difference as daily rate if it's non-zero,
                # otherwise use the default rate of 50 km/day
                if mileage_difference > 0:
                    logger.info(f"Car {self.id}: Pre-owned car with small mileage difference ({mileage_difference} km). Using that as daily rate.")
                    return mileage_difference
                else:
                    logger.info(f"Car {self.id}: Pre-owned car with no mileage difference. Using default {default_daily_mileage} km/day")
                    return default_daily_mileage
            
            # If the car was created today and all activity is on the same day,
            # and doesn't have significant mileage difference, we use the default value
            logger.info(f"Car {self.id}: All activity is on car creation day with minimal mileage change. Using default mileage of {default_daily_mileage} km/day")
            return default_daily_mileage
        
        # Get all available data first to avoid repeated database queries
        all_mileage_updates = list(MileageUpdate.objects.filter(car=self).order_by('-reported_date'))
        all_service_history = list(ServiceHistory.objects.filter(car=self).order_by('-service_date'))
        
        # Log counts of available data for debugging
        logger.info(f"Car {self.id}: Found {len(all_mileage_updates)} mileage updates and {len(all_service_history)} service history records")
        
        # Quick check: If no history data at all, return default immediately
        if not all_mileage_updates and not all_service_history:
            logger.info(f"Car {self.id}: No mileage updates or service history found. Using default {default_daily_mileage} km/day")
            return default_daily_mileage
            
        # Special case: If the car was created recently (within 7 days), we have service history but no mileage updates,
        # and all services occurred on the same day as creation, use the default value
        if days_since_creation <= 7 and len(all_mileage_updates) == 0 and len(all_service_history) > 0:
            # Check if all services were on the creation date
            all_services_on_creation_date = all(sh.service_date == car_creation_date for sh in all_service_history)
            if all_services_on_creation_date:
                logger.info(f"Car {self.id}: New car with only same-day service history and no mileage updates. Using default {default_daily_mileage} km/day")
                return default_daily_mileage
        
        # Check for same-day mileage updates and service history
        same_day_mileage_updates = [mu for mu in all_mileage_updates if mu.reported_date.date() == today]
        same_day_services = [sh for sh in all_service_history if sh.service_date == today]
        
        # Special handling for same-day activities
        if same_day_mileage_updates or same_day_services:
            # Start with today's activities
            all_events = []
            
            # Add service history events
            for sh in same_day_services:
                all_events.append((sh.service_date, sh.service_mileage, 'service'))
                
            # Add mileage update events
            for mu in same_day_mileage_updates:
                all_events.append((mu.reported_date.date(), mu.mileage, 'update'))
                
            # Sort events by mileage (ascending)
            all_events.sort(key=lambda x: x[1])
            
            if len(all_events) >= 2:
                # Calculate total mileage change across all same-day events
                min_mileage = all_events[0][1]
                max_mileage = all_events[-1][1]
                
                # Get the day's total mileage change
                same_day_mileage_change = max_mileage - min_mileage
                
                # If this is the only day with data, use it directly
                if (today - car_creation_date).days <= 1:
                    # This is effective a 1-day rate
                    logger.info(f"Car {self.id}: Calculated daily mileage {same_day_mileage_change} from same-day events")
                    return same_day_mileage_change
                
                # Otherwise, use this as a supplemental data point with other historical data
                logger.info(f"Car {self.id}: Same-day mileage change detected: {same_day_mileage_change} km")
                
        # If this is a new car but has significant mileage, calculate based on the mileage
        if days_since_creation <= 7 and self.mileage > 500:
            # Adjust mileage to a reasonable daily rate
            # Assume this was accumulated over 7 days
            adjusted_rate = min(200, self.mileage / 7)
            logger.info(f"Car {self.id}: New car with significant mileage ({self.mileage}). Using adjusted rate: {adjusted_rate} km/day")
            return adjusted_rate
        
        # ===== Combined Events Approach =====
        # If we have both mileage updates and service history, combine them to improve accuracy
        combined_events = []
        
        # Always add car initial mileage as a starting point to ensure we have data
        combined_events.append((car_creation_date, initial_car_mileage, 'creation'))
        
        # Add service history events first to prioritize them
        for sh in all_service_history:
            combined_events.append((sh.service_date, sh.service_mileage, 'service'))
            
        # Add mileage update events
        for mu in all_mileage_updates:
            combined_events.append((mu.reported_date.date(), mu.mileage, 'update'))
        
        # If we have current mileage that's different, add it as a data point
        if self.mileage > 0 and self.mileage != initial_car_mileage:
            current_date = timezone.now().date()
            # Avoid duplicating the same mileage if it's already in our events
            if not any(event[0] == current_date and event[1] == self.mileage for event in combined_events):
                combined_events.append((current_date, self.mileage, 'current'))
                logger.info(f"Car {self.id}: Added current mileage {self.mileage} as a data point")
            
        # Sort by date (newest first) then by mileage (highest first)
        combined_events.sort(key=lambda x: (x[0], x[1]), reverse=True)
        
        logger.info(f"Car {self.id}: Built {len(combined_events)} combined events for mileage calculation")
        
        # If we have at least two events, calculate based on the newest and oldest
        if len(combined_events) >= 2:
            newest_event = combined_events[0]
            oldest_event = combined_events[-1]
            
            newest_date, newest_mileage, newest_type = newest_event
            oldest_date, oldest_mileage, oldest_type = oldest_event
            
            # Special case: If oldest is creation and newest is same-day service with no mileage updates
            if oldest_type == 'creation' and newest_type == 'service' and newest_date == car_creation_date and len(all_mileage_updates) == 0:
                if newest_mileage > 500:
                    # The car already has significant mileage, use an adjusted rate
                    adjusted_rate = min(200, newest_mileage / 7)
                    logger.info(f"Car {self.id}: New car with significant service mileage ({newest_mileage}). Using adjusted rate: {adjusted_rate} km/day")
                    return adjusted_rate
                else:
                    logger.info(f"Car {self.id}: Only have creation and same-day service. Using default {default_daily_mileage} km/day")
                    return default_daily_mileage
            
            days_difference = max(1, (newest_date - oldest_date).days)  # Ensure at least 1 day to prevent division by zero
            
            mileage_difference = newest_mileage - oldest_mileage
            daily_rate = mileage_difference / days_difference
            logger.info(f"Car {self.id}: Calculated daily mileage {daily_rate} from mixed events ({newest_type} and {oldest_type}), over {days_difference} days")
            
            # Don't allow extremely high values from same-day calculations with large mileage gaps
            if days_difference == 1 and mileage_difference > 1000:
                # Cap the daily rate at either 1000 or the current calculated rate divided by a reasonable factor
                capped_rate = min(1000, daily_rate / 10)
                logger.warning(f"Car {self.id}: Capping unusually high daily rate {daily_rate} to {capped_rate}")
                return capped_rate
                
            return daily_rate
        
        # ===== Service History Only Approach =====
        # If combined approach didn't work, try using only service history
        if all_service_history:
            newest_service = all_service_history[0]
            newest_mileage = newest_service.service_mileage
            newest_date = newest_service.service_date
            
            logger.info(f"Car {self.id}: Falling back to service history only approach with {len(all_service_history)} records")
            
            # Special case: If we only have service history and it's on the same day as creation
            if newest_date == car_creation_date and len(all_service_history) == 1:
                logger.info(f"Car {self.id}: Only have service history from creation date. Using default {default_daily_mileage} km/day")
                return default_daily_mileage
            
            # If we have multiple service history records, use the oldest one as start point
            if len(all_service_history) > 1:
                oldest_service = all_service_history[-1]
                oldest_mileage = oldest_service.service_mileage
                oldest_date = oldest_service.service_date
                
                # If all services are on the same day as creation, use default
                if oldest_date == car_creation_date and newest_date == car_creation_date:
                    logger.info(f"Car {self.id}: Multiple services all on creation date. Using default {default_daily_mileage} km/day")
                    return default_daily_mileage
                
                days_difference = max(1, (newest_date - oldest_date).days)  # Ensure at least 1 day
                mileage_difference = newest_mileage - oldest_mileage
                daily_rate = mileage_difference / days_difference
                logger.info(f"Car {self.id}: Calculated daily mileage {daily_rate} from {len(all_service_history)} service history records over {days_difference} days")
                return daily_rate
            
            # If we have only one service history, compare with car creation date
            days_difference = max(7, (newest_date - car_creation_date).days)  # Use at least 7 days to avoid unrealistic rates
            mileage_difference = newest_mileage - initial_car_mileage
            # Cap the daily rate to reasonable values based on the time span
            if days_difference <= 7:
                daily_rate = min(200, mileage_difference / days_difference)
                logger.info(f"Car {self.id}: Calculated capped daily mileage {daily_rate} from initial to service history over {days_difference} days")
            else:
                daily_rate = mileage_difference / days_difference
                logger.info(f"Car {self.id}: Calculated daily mileage {daily_rate} from initial to service history over {days_difference} days")
            return daily_rate
        
        # ===== Mileage Updates Only Approach =====
        # If service history approach didn't work, try using only mileage updates
        if all_mileage_updates:
            newest_update = all_mileage_updates[0]
            newest_mileage = newest_update.mileage
            newest_date = newest_update.reported_date.date()
            
            logger.info(f"Car {self.id}: Falling back to mileage updates only approach with {len(all_mileage_updates)} updates")
            
            # Special case: If we only have mileage updates and it's on the same day as creation
            if newest_date == car_creation_date and len(all_mileage_updates) == 1:
                logger.info(f"Car {self.id}: Only have mileage updates from creation date. Using default {default_daily_mileage} km/day")
                return default_daily_mileage
            
            # If we have multiple updates, use the oldest one as start point
            if len(all_mileage_updates) > 1:
                oldest_update = all_mileage_updates[-1]
                oldest_mileage = oldest_update.mileage
                oldest_date = oldest_update.reported_date.date()
                
                # If all updates are on the same day as creation, use default
                if oldest_date == car_creation_date and newest_date == car_creation_date:
                    logger.info(f"Car {self.id}: Multiple updates all on creation date. Using default {default_daily_mileage} km/day")
                    return default_daily_mileage
                
                days_difference = max(1, (newest_date - oldest_date).days)  # Ensure at least 1 day
                mileage_difference = newest_mileage - oldest_mileage
                daily_rate = mileage_difference / days_difference
                logger.info(f"Car {self.id}: Calculated daily mileage {daily_rate} from {len(all_mileage_updates)} mileage updates over {days_difference} days")
                return daily_rate
            
            # If we have only one mileage update, compare with car creation
            days_difference = max(7, (newest_date - car_creation_date).days)  # Use at least 7 days
            mileage_difference = newest_mileage - initial_car_mileage
            # Cap the daily rate to reasonable values based on the time span
            if days_difference <= 7:
                daily_rate = min(200, mileage_difference / days_difference)
                logger.info(f"Car {self.id}: Calculated capped daily mileage {daily_rate} from initial to update over {days_difference} days")
            else:
                daily_rate = mileage_difference / days_difference
                logger.info(f"Car {self.id}: Calculated daily mileage {daily_rate} from initial to update over {days_difference} days")
            return daily_rate
        
        # ===== Current Mileage Based Approach =====
        # If current mileage differs significantly from what would be predicted, use that
        if self.mileage > 0:
            # Special case: If the car is new (created within 7 days)
            if days_since_creation <= 7:
                logger.info(f"Car {self.id}: New car with current mileage {self.mileage}. Using default {default_daily_mileage} km/day")
                return default_daily_mileage
            
            # Calculate based on current mileage with minimum days
            adjusted_rate = self.mileage / days_since_creation
            logger.info(f"Car {self.id}: Calculated daily mileage {adjusted_rate} based on current mileage over {days_since_creation} days")
            return adjusted_rate
        
        # ===== Fallback Approaches =====
        # If we don't have enough data for a proper calculation, use the stored average or default
        if self.average_daily_mileage:
            logger.info(f"Car {self.id}: Using previously stored average daily mileage: {self.average_daily_mileage}")
            return self.average_daily_mileage
            
        # If all fails, use a reasonable default
        logger.warning(f"Car {self.id}: No data to calculate daily mileage, using default {default_daily_mileage}")
        return default_daily_mileage

    def _generate_fallback_prediction(self):
        """Generate a fallback prediction when insufficient data is available"""
        # Use 10,000 km interval and 365 days (1 year) as specified
        default_mileage_interval = 10000
        default_time_interval = 365
        
        # Estimate daily mileage if not set (50 km/day is a reasonable default)
        daily_mileage = self.average_daily_mileage or 50.0
        
        # Set next service date based on last service or current date (always calculate this)
        if self.last_service_date:
            next_service_date = self.last_service_date + timedelta(days=default_time_interval)
        else:
            next_service_date = timezone.now().date() + timedelta(days=default_time_interval)
            
        # Set next service mileage based on last service or current mileage
        if self.last_service_mileage:
            next_service_mileage = self.last_service_mileage + default_mileage_interval
        else:
            next_service_mileage = self.mileage + default_mileage_interval
            
        return next_service_date, next_service_mileage

    def update_service_predictions(self):
        """Update the service predictions for this car and save them to the model"""
        # First update the average daily mileage
        self.average_daily_mileage = self._calculate_average_daily_mileage()
        
        # Ensure we have a value for average_daily_mileage (fallback to default if None)
        if self.average_daily_mileage is None:
            self.average_daily_mileage = 50.0
            logger = logging.getLogger(__name__)
            logger.warning(f"Car {self.id}: No average daily mileage calculated, using default 50.0 km/day")
        
        # Then calculate next service date
        next_date, next_mileage = self.calculate_next_service_date()
        
        if next_date and next_mileage:
            self.next_service_date = next_date
            self.next_service_mileage = next_mileage
            self.save(update_fields=['next_service_date', 'next_service_mileage', 'average_daily_mileage'])
            return True
        return False

    def save(self, *args, **kwargs):
        """
        Ensure initial_mileage is set when a car is first created.
        The initial_mileage value is immutable after creation except by superadmins.
        """
        is_new = self.pk is None
        
        # If this is a new car, set initial_mileage to the same as current mileage
        if is_new and self.initial_mileage == 0 and self.mileage > 0:
            self.initial_mileage = self.mileage
        elif not is_new and 'update_fields' in kwargs and 'initial_mileage' in kwargs['update_fields']:
            # Allow explicit updates to initial_mileage via update_fields parameter (used by admin)
            pass
        elif not is_new:
            # For existing cars, retrieve the current initial_mileage to preserve it
            try:
                current_car = Car.objects.get(pk=self.pk)
                self.initial_mileage = current_car.initial_mileage
            except Car.DoesNotExist:
                # This is a safeguard - should not happen in normal operation
                pass
            
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = _('Car')
        verbose_name_plural = _('Cars')
        indexes = [
            models.Index(fields=['customer']),
            models.Index(fields=['license_plate']),
            models.Index(fields=['vin']),
            models.Index(fields=['make', 'model']),
            models.Index(fields=['year']),
        ]


class ServiceInterval(models.Model):
    """
    Define service intervals for maintenance scheduling based on mileage or time
    """
    INTERVAL_TYPES = [
        ('mileage', _('Mileage Based')),
        ('time', _('Time Based')),
        ('both', _('Mileage and Time Based')),
    ]
    
    name = models.CharField(_('Service Type'), max_length=100)
    description = models.TextField(_('Description'))
    interval_type = models.CharField(_('Interval Type'), max_length=10, choices=INTERVAL_TYPES)
    mileage_interval = models.PositiveIntegerField(_('Mileage Interval (km)'), blank=True, null=True, 
                                                help_text=_('Distance in kilometers between services'))
    time_interval_days = models.PositiveIntegerField(_('Time Interval (days)'), blank=True, null=True,
                                                 help_text=_('Days between services'))
    car_make = models.CharField(_('Car Make'), max_length=50, blank=True, null=True, 
                             help_text=_('Specific car make or leave blank for all makes'))
    car_model = models.CharField(_('Car Model'), max_length=50, blank=True, null=True,
                              help_text=_('Specific car model or leave blank for all models of the make'))
    is_active = models.BooleanField(_('Active'), default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def clean(self):
        """Validate that at least one interval type is provided based on the interval_type"""
        super().clean()
        
        if self.interval_type == 'mileage' and not self.mileage_interval:
            raise ValidationError({
                'mileage_interval': _('Mileage interval is required for mileage-based service intervals')
            })
            
        if self.interval_type == 'time' and not self.time_interval_days:
            raise ValidationError({
                'time_interval_days': _('Time interval is required for time-based service intervals')
            })
            
        if self.interval_type == 'both' and not (self.mileage_interval and self.time_interval_days):
            raise ValidationError({
                'interval_type': _('Both mileage and time intervals must be provided for this interval type')
            })
            
        # If car_model is specified, car_make must also be specified
        if self.car_model and not self.car_make:
            raise ValidationError({
                'car_model': _('You must specify a car make when specifying a car model')
            })
    
    def __str__(self):
        if self.car_make and self.car_model:
            return f"{self.name} - {self.car_make} {self.car_model}"
        elif self.car_make:
            return f"{self.name} - {self.car_make} (All Models)"
        else:
            return f"{self.name} - All Cars"
            
    class Meta:
        verbose_name = _('Service Interval')
        verbose_name_plural = _('Service Intervals')
        indexes = [
            models.Index(fields=['car_make', 'car_model']),
            models.Index(fields=['interval_type']),
            models.Index(fields=['is_active']),
        ]
        ordering = ['name', 'car_make', 'car_model']


class MileageUpdate(models.Model):
    """
    Track periodic mileage updates from car owners
    """
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='mileage_updates')
    mileage = models.PositiveIntegerField(_('Current Mileage'))
    reported_date = models.DateTimeField(_('Reported Date'), auto_now_add=True)
    notes = models.TextField(_('Notes'), blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def clean(self):
        """Ensure mileage is increasing"""
        super().clean()
        
        if self.mileage < self.car.mileage:
            raise ValidationError({
                'mileage': _('Reported mileage ({}) cannot be less than the car\'s current mileage ({})').format(
                    self.mileage, self.car.mileage
                )
            })
        
        previous_update = MileageUpdate.objects.filter(
            car=self.car
        ).exclude(pk=self.pk if self.pk else None).order_by('-reported_date').first()
        
        if previous_update and self.mileage < previous_update.mileage:
            raise ValidationError({
                'mileage': _('Reported mileage ({}) cannot be less than the previous update ({}) from {}').format(
                    self.mileage,
                    previous_update.mileage,
                    previous_update.reported_date.strftime('%Y-%m-%d')
                )
            })
    
    def save(self, *args, **kwargs):
        """
        Save the mileage update, and update the car's mileage if this update has a higher value.
        Also update the car's service predictions to ensure they account for the latest mileage.
        """
        # Check if the mileage is higher than the car's current mileage
        if self.mileage > self.car.mileage:
            self.car.mileage = self.mileage
            self.car.save(update_fields=['mileage'])

        # Save this mileage update
        super().save(*args, **kwargs)
        
        # Always update the car's service predictions after a new mileage update
        # This ensures average daily mileage is recalculated with the latest data
        self.car.update_service_predictions()
        
        # Log the mileage update for debugging
        logger = logging.getLogger(__name__)
        logger.info(f"MileageUpdate saved for car {self.car.id} ({self.car.make} {self.car.model}): {self.mileage}km. "
                   f"Car's current mileage: {self.car.mileage}km. Service predictions updated.")
        
    def __str__(self):
        return f"{self.car.license_plate} - {self.mileage} km ({self.reported_date.strftime('%Y-%m-%d')})"
        
    class Meta:
        verbose_name = _('Mileage Update')
        verbose_name_plural = _('Mileage Updates')
        indexes = [
            models.Index(fields=['car']),
            models.Index(fields=['reported_date']),
        ]
        ordering = ['-reported_date']


class Service(models.Model):
    """
    Service model representing repairs or maintenance on cars
    """
    STATUS_CHOICES = [
        ('scheduled', _('Scheduled')),
        ('in_progress', _('In Progress')),
        ('completed', _('Completed')),
        ('cancelled', _('Cancelled')),
    ]

    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='services')
    title = models.CharField(_('Service Title'), max_length=100)
    description = models.TextField(_('Description'))
    status = models.CharField(_('Status'), max_length=15, choices=STATUS_CHOICES, default='scheduled')
    scheduled_date = models.DateTimeField(_('Scheduled Date'))
    completed_date = models.DateTimeField(_('Completed Date'), blank=True, null=True)
    technician_notes = models.TextField(_('Technician Notes'), blank=True, null=True)
    service_mileage = models.PositiveIntegerField(_('Service Mileage'), blank=True, null=True, 
                                               help_text=_('The car\'s mileage at the time of service. '
                                                           'Cannot be less than the car\'s registered mileage.'))
    service_type = models.ForeignKey(ServiceInterval, on_delete=models.SET_NULL, 
                                   related_name='services', null=True, blank=True,
                                   help_text=_('The type of service performed, used for future service predictions.'))
    is_routine_maintenance = models.BooleanField(
        default=False,
        help_text=_(
            "Check this box if this service is part of the car's regular maintenance schedule. "
            "When checked and the service is completed, a service history record will be created "
            "and used for future service predictions. For non-routine repairs (like fixing a broken part), "
            "leave this unchecked."
        )
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        """
        Validate that service_mileage is not less than the car's current mileage.
        Also verify that mileage is not less than previous service mileages for the same car.
        """
        super().clean()
        
        if self.service_mileage is not None and self.car:
            # 1. Check service_mileage is not less than car's current mileage
            if self.service_mileage < self.car.mileage:
                raise ValidationError({
                    'service_mileage': _('Service mileage cannot be less than the car\'s current registered mileage ({}).').format(self.car.mileage)
                })
            
            # 2. If this is an update, check for previous services for chronological ordering
            if self.pk:
                # Get the latest service before this one (by scheduled_date)
                previous_service = Service.objects.filter(
                    car=self.car,
                    scheduled_date__lt=self.scheduled_date,
                    service_mileage__isnull=False
                ).exclude(pk=self.pk).order_by('-scheduled_date').first()
                
                if previous_service and previous_service.service_mileage > self.service_mileage:
                    raise ValidationError({
                        'service_mileage': _('Service mileage cannot be less than the previous service mileage ({}) from {}.').format(
                            previous_service.service_mileage,
                            previous_service.scheduled_date.strftime('%Y-%m-%d')
                        )
                    })
                
                # Get the next service after this one (by scheduled_date)
                next_service = Service.objects.filter(
                    car=self.car,
                    scheduled_date__gt=self.scheduled_date,
                    service_mileage__isnull=False
                ).exclude(pk=self.pk).order_by('scheduled_date').first()
                
                if next_service and next_service.service_mileage < self.service_mileage:
                    raise ValidationError({
                        'service_mileage': _('Service mileage cannot be greater than the next service mileage ({}) from {}.').format(
                            next_service.service_mileage,
                            next_service.scheduled_date.strftime('%Y-%m-%d')
                        )
                    })

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        
        # Get the old status if this is an existing service
        old_status = None
        if not is_new:
            old_status = Service.objects.get(pk=self.pk).status
            
        # Call the original save method first
        super().save(*args, **kwargs)
        
        import logging
        logger = logging.getLogger(__name__)
        
        # Update the car's mileage if this service has a service_mileage and is being completed
        # This should happen for ALL services, not just routine maintenance
        if self.status == 'completed' and self.service_mileage and self.service_mileage > self.car.mileage:
            logger.info(f"Updating car mileage from {self.car.mileage} to {self.service_mileage} for car {self.car.id}")
            self.car.mileage = self.service_mileage
            self.car.save(update_fields=['mileage'])
            
        # Process service completion for routine maintenance
        if self.status == 'completed' and old_status != 'completed' and self.is_routine_maintenance and self.service_type:
            from core.models import ServiceHistory
            
            # Check if service history already exists
            existing_history = ServiceHistory.objects.filter(service=self).exists()
            
            if not existing_history:
                try:
                    logger.info(f"Creating service history for service {self.id}")
                    
                    # Get or calculate service date and mileage
                    service_date = self.completed_date.date() if self.completed_date else timezone.now().date()
                    service_mileage = self.service_mileage or self.car.mileage
                    
                    # Create service history record
                    service_history = ServiceHistory.objects.create(
                        car=self.car,
                        service=self,
                        service_interval=self.service_type,
                        service_date=service_date,
                        service_mileage=service_mileage
                    )
                    
                    # Update car's last service info
                    self.car.last_service_date = service_date
                    self.car.last_service_mileage = service_mileage
                    self.car.save(update_fields=['last_service_date', 'last_service_mileage'])
                    
                    # Update service predictions
                    self.car.update_service_predictions()
                    
                    logger.info(f"Service history created with ID {service_history.id}")
                except Exception as e:
                    logger.error(f"Error creating service history: {str(e)}")
            else:
                logger.info(f"Service history already exists for service {self.id}")
                
        # Send notification when status changes to completed
        if self.status == 'completed' and old_status != 'completed':
            try:
                from utils.email_utils import send_service_completed_notification
                send_service_completed_notification(self)
                
                from utils.sms_utils import send_service_completed_sms
                send_service_completed_sms(self)
                
                # Create in-app notification
                from core.models import Notification
                Notification.objects.create(
                    customer=self.car.customer,
                    title=_('Service Completed'),
                    message=_('Your service "{}" has been completed.').format(self.title),
                    notification_type='service_update'
                )
                
            except Exception as e:
                logger.error(f"Error sending service completion notifications: {str(e)}")
                # Don't re-raise the exception to avoid breaking the save process

    def __str__(self):
        return f"{self.title} - {self.car}"

    class Meta:
        verbose_name = _('Service')
        verbose_name_plural = _('Services')
        indexes = [
            models.Index(fields=['car']),
            models.Index(fields=['status']),
            models.Index(fields=['scheduled_date']),
            models.Index(fields=['completed_date']),
            models.Index(fields=['created_at']),
        ]

    # Additional method for debugging service history creation
    def debug_service_history(self):
        """Check why service history isn't being created and return diagnostic information"""
        import logging
        logger = logging.getLogger(__name__)
        
        debug_info = {
            "service_id": self.id,
            "service_title": self.title,
            "status": self.status,
            "is_routine_maintenance": self.is_routine_maintenance,
            "has_service_type": self.service_type is not None,
            "completed_date": self.completed_date,
            "service_mileage": self.service_mileage,
            "problems": []
        }
        
        # Check for existing service history
        from core.models import ServiceHistory
        existing_history = ServiceHistory.objects.filter(service=self).exists()
        debug_info["existing_history"] = existing_history
        
        # Check for required fields
        if not self.is_routine_maintenance:
            debug_info["problems"].append("Service is not marked as routine maintenance")
            
        if self.status != 'completed':
            debug_info["problems"].append("Service status is not 'completed'")
            
        if not self.service_type:
            debug_info["problems"].append("Service has no service_type set")
            
        if not self.completed_date:
            debug_info["problems"].append("Service has no completed_date")
            
        if not self.service_mileage:
            debug_info["problems"].append("Service has no service_mileage")
            
        # Log the debug info
        logger.info(f"Service history debug info: {debug_info}")
        
        # Try to create service history if conditions are met
        if self.status == 'completed' and self.is_routine_maintenance and self.service_type and not existing_history:
            try:
                service_history = ServiceHistory.objects.create(
                    car=self.car,
                    service=self,
                    service_interval=self.service_type,
                    service_date=self.completed_date.date() if self.completed_date else timezone.now().date(),
                    service_mileage=self.service_mileage or self.car.mileage
                )
                debug_info["result"] = f"Created service history record with ID {service_history.id}"
                logger.info(f"Successfully created service history through debug method: {service_history.id}")
            except Exception as e:
                debug_info["result"] = f"Error creating service history: {str(e)}"
                logger.error(f"Failed to create service history through debug method: {str(e)}")
        else:
            debug_info["result"] = "Conditions not met for creating service history"
            
        return debug_info


class ServiceItem(models.Model):
    """
    Service item model representing individual parts or labor for a service
    """
    TYPE_CHOICES = [
        ('part', _('Part')),
        ('labor', _('Labor')),
    ]

    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='items')
    item_type = models.CharField(_('Type'), max_length=5, choices=TYPE_CHOICES)
    name = models.CharField(_('Name'), max_length=100)
    description = models.TextField(_('Description'), blank=True, null=True)
    quantity = models.PositiveIntegerField(_('Quantity'), default=1)
    unit_price = models.DecimalField(_('Unit Price'), max_digits=10, decimal_places=2)
    
    @property
    def total_price(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return f"{self.name} ({self.get_item_type_display()})"

    class Meta:
        verbose_name = _('Service Item')
        verbose_name_plural = _('Service Items')
        indexes = [
            models.Index(fields=['service']),
            models.Index(fields=['item_type']),
        ]


class Invoice(models.Model):
    """
    Invoice model for tracking payments
    """
    STATUS_CHOICES = [
        ('draft', _('Draft')),
        ('pending', _('Pending')),
        ('paid', _('Paid')),
        ('refunded', _('Refunded')),
        ('cancelled', _('Cancelled')),
    ]

    service = models.OneToOneField(Service, on_delete=models.CASCADE, related_name='invoice')
    invoice_number = models.CharField(_('Invoice Number'), max_length=20, unique=True, editable=False)
    issued_date = models.DateField(_('Issued Date'), auto_now_add=True)
    due_date = models.DateField(_('Due Date'))
    status = models.CharField(_('Status'), max_length=10, choices=STATUS_CHOICES, default='draft')
    notes = models.TextField(_('Notes'), blank=True, null=True)
    pdf_file = models.FileField(_('PDF File'), upload_to='invoices/', blank=True, null=True)
    final_amount = models.DecimalField(_('Final Amount'), max_digits=10, decimal_places=3, blank=True, null=True, 
                                     help_text=_('Custom final amount to be displayed to the customer.'))
    refund_date = models.DateField(_('Refund Date'), blank=True, null=True)
    refund_amount = models.DecimalField(_('Refund Amount'), max_digits=10, decimal_places=2, blank=True, null=True)
    refund_reason = models.TextField(_('Refund Reason'), blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def subtotal(self):
        return sum(item.total_price for item in self.service.items.all())

    @property
    def total(self):
        return self.subtotal

    def save(self, *args, **kwargs):
        # Check if this is a new invoice or status is changing to non-draft
        is_new = not self.pk
        status_changed = False
        old_status = None
        
        if not is_new:
            try:
                old_obj = Invoice.objects.get(pk=self.pk)
                old_status = old_obj.status
                if old_status != self.status:
                    status_changed = True
            except Invoice.DoesNotExist:
                pass
        
        if not self.invoice_number:
            self.invoice_number = f"INV-{uuid.uuid4().hex[:8].upper()}"
        
        # Handle refund status changes
        if status_changed and self.status == 'refunded' and old_status == 'paid':
            # Set refund date if not set
            if not self.refund_date:
                self.refund_date = timezone.now().date()
            
            # Set refund amount if not set (default to full amount)
            if not self.refund_amount:
                self.refund_amount = self.total
        
        # Save the invoice first so it has an ID
        super().save(*args, **kwargs)
        
        # Avoid immediate recursive calls by checking flags
        
        # Use transaction to avoid database inconsistencies
        with transaction.atomic():
            # Removed automatic PDF generation
            
            # If status changed to paid, create a notification
            if self.status == 'paid' and not getattr(self, '_notification_in_progress', False) and status_changed and old_status != 'refunded':
                self._notification_in_progress = True
                try:
                    self._create_invoice_paid_notification()
                finally:
                    self._notification_in_progress = False
            
            # If status changed to refunded, create a refund notification
            if self.status == 'refunded' and not getattr(self, '_refund_notification_in_progress', False) and status_changed:
                self._refund_notification_in_progress = True
                try:
                    self._create_refund_notification()
                finally:
                    self._refund_notification_in_progress = False
            
            # Send email notification for new invoices or status changes
            if (is_new or status_changed) and not getattr(self, '_notifications_in_progress', False):
                self._notifications_in_progress = True
                try:
                    from utils.email_utils import send_invoice_notification
                    send_invoice_notification(self)
                    
                    # Send SMS notification for new invoices
                    if is_new:
                        from utils.sms_utils import send_invoice_sms
                        send_invoice_sms(self)
                except Exception as e:
                    print(f"Error sending notifications: {e}")
                finally:
                    self._notifications_in_progress = False

    def _create_invoice_paid_notification(self):
        """Create a notification when an invoice is paid"""
        Notification.objects.create(
            customer=self.service.car.customer,
            title=_('Invoice Paid'),
            message=_('Your invoice #{} has been marked as paid. Thank you for your business!').format(self.invoice_number),
            notification_type='invoice'
        )
        
    def _create_refund_notification(self):
        """Create a notification when an invoice is refunded"""
        Notification.objects.create(
            customer=self.service.car.customer,
            title=_('Invoice Refunded'),
            message=_('Your invoice #{} has been refunded for {}. If you have any questions, please contact us.').format(
                self.invoice_number, self.refund_amount or self.total
            ),
            notification_type='invoice'
        )

    def __str__(self):
        return self.invoice_number

    class Meta:
        verbose_name = _('Invoice')
        verbose_name_plural = _('Invoices')
        indexes = [
            models.Index(fields=['service']),
            models.Index(fields=['invoice_number']),
            models.Index(fields=['issued_date']),
            models.Index(fields=['due_date']),
            models.Index(fields=['status']),
        ]


class Notification(models.Model):
    """
    Notification model for customer alerts
    """
    TYPE_CHOICES = [
        ('service_reminder', _('Service Reminder')),
        ('service_update', _('Service Update')),
        ('invoice', _('Invoice')),
        ('general', _('General')),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(_('Title'), max_length=100)
    message = models.TextField(_('Message'))
    notification_type = models.CharField(_('Type'), max_length=20, choices=TYPE_CHOICES)
    is_read = models.BooleanField(_('Read'), default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.customer}"

    class Meta:
        verbose_name = _('Notification')
        verbose_name_plural = _('Notifications')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['is_read']),
            models.Index(fields=['created_at']),
        ]


class ServiceHistory(models.Model):
    """
    Model for tracking service history as it relates to service intervals and predictions.
    This helps maintain a clear record of maintenance for prediction purposes.
    """
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='service_history')
    service = models.OneToOneField(Service, on_delete=models.CASCADE, related_name='service_history_record')
    service_interval = models.ForeignKey(ServiceInterval, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='service_history')
    service_date = models.DateField(_('Service Date'))
    service_mileage = models.PositiveIntegerField(_('Service Mileage'))
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        interval_name = self.service_interval.name if self.service_interval else "Unspecified"
        return f"{interval_name} - {self.car} - {self.service_date}"
    
    class Meta:
        verbose_name = _('Service History')
        verbose_name_plural = _('Service History')
        indexes = [
            models.Index(fields=['car']),
            models.Index(fields=['service_date']),
            models.Index(fields=['service_mileage']),
        ]
        ordering = ['-service_date']
