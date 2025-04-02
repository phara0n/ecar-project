# Testing Guide: Mileage-Based Service Prediction System

This document provides a comprehensive approach to testing the mileage-based service prediction system to ensure it functions correctly before deploying to production.

## Prerequisites

- Access to the ECAR admin interface
- API access with authentication credentials
- A test environment with the latest migrations applied
- At least one car record in the database

## Test Cases

### 1. ServiceInterval Model

#### 1.1 Create Service Intervals

**Test Steps:**
1. Log in to the admin interface
2. Navigate to Service Intervals
3. Create the following test intervals:
   - "Oil Change" - mileage-based - 10,000 km interval
   - "Regular Maintenance" - time-based - 180 days interval
   - "Major Service" - both - 30,000 km and 365 days interval
   - Make-specific interval for "Toyota" - 15,000 km
   - Make and model specific interval for "Toyota Corolla" - 12,000 km

**Expected Results:**
- All service intervals should be created successfully
- Validation should prevent creating intervals without required fields
- For combined intervals, both mileage and time values should be required

#### 1.2 Test Interval Filtering

**Test Steps:**
1. Create a car with make "Toyota" and model "Corolla"
2. In a development console or through API, fetch intervals for this car
3. Verify that the correct priority order is applied

**API Endpoint Test:**
```bash
# Get intervals for Toyota Corolla
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/service-intervals/for_vehicle/?make=Toyota&model=Corolla
```

**Expected Results:**
- The Toyota Corolla specific interval should be returned first
- If not available, the Toyota generic interval should be returned
- If none of the above, global intervals should be returned

### 2. MileageUpdate Model

#### 2.1 Create Mileage Updates

**Test Steps:**
1. Log in to the admin interface
2. Navigate to Mileage Updates
3. Add a new mileage update for a test car with current mileage + 500km
4. Add notes to the update
5. Save the update

**Expected Results:**
- Mileage update should be saved successfully
- The car's mileage should be updated to the new value if higher
- Timestamp should be recorded correctly

#### 2.2 Test API Mileage Reporting

**Test Steps:**
1. Obtain an API auth token
2. Report a mileage update via the API endpoint

```bash
# Report mileage for car ID 1
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <token>" \
     -d '{"mileage": 45000, "notes": "Test update"}' \
     http://localhost:8000/api/cars/1/report_mileage/
```

**Expected Results:**
- API should return 201 Created status code
- Mileage update should be saved to the database
- Car mileage should update if the reported value is higher
- Validation should reject mileage values lower than the current car mileage

#### 2.3 Test Validation Rules

**Test Steps:**
1. Try to create a mileage update with a value lower than the car's current mileage
2. Try to create a mileage update with a negative value
3. Try to create a mileage update with an extremely high value (e.g., 999999999)

**Expected Results:**
- All attempts should be rejected with appropriate validation errors
- Car's mileage should remain unchanged

### 3. Car Model Service Prediction

#### 3.1 Test Daily Mileage Calculation

**Test Steps:**
1. Create a car with initial mileage of 10,000
2. Add multiple mileage updates over "time":
   - Day 1: 10,500
   - Day 3: 11,000
   - Day 7: 12,000
3. Check the calculated average daily mileage

**Expected Results:**
- Average daily mileage should be approximately (12,000 - 10,000) / 7 ≈ 285.7 km/day
- The value should be stored in `average_daily_mileage` field

#### 3.2 Test Next Service Prediction - Mileage Based

**Test Steps:**
1. Create a car with mileage 10,000
2. Create a mileage-based service interval of 5,000 km
3. Set up mileage updates to establish a daily rate of 100 km/day
4. Request the next service prediction

**Expected Results:**
- Next service mileage should be 15,000
- Next service date should be approximately 50 days from now
- Mileage until service should be 5,000

#### 3.3 Test Next Service Prediction - Time Based

**Test Steps:**
1. Create a car with a last service date 30 days ago
2. Create a time-based service interval of 90 days
3. Request the next service prediction

**Expected Results:**
- Next service date should be 60 days from now
- Days until service should be 60

#### 3.4 Test Next Service Prediction - Combined

**Test Steps:**
1. Create a car with mileage 10,000 and last service date 30 days ago
2. Create a service interval with both 5,000 km and 90 days
3. Set up mileage updates to establish a daily rate of 100 km/day
4. Request the next service prediction

**Expected Results:**
- Next service should be predicted based on whichever comes first
- With a rate of 100 km/day, mileage threshold would be reached in 50 days
- Since this is before the 60-day remaining time threshold, next service should be in 50 days
- If you change the daily rate to 50 km/day, time should become the determining factor

#### 3.5 Test API Prediction Endpoint

**Test Steps:**
1. Set up a car with the necessary mileage data and service intervals
2. Request the prediction via API

```bash
# Get prediction for car ID 1
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/cars/1/next_service_prediction/
```

**Expected Results:**
- API should return a prediction with all expected fields
- Response should include both date and mileage predictions
- Days and mileage until service should be calculated correctly

### 4. Edge Cases

#### 4.1 No Mileage History

**Test Steps:**
1. Create a new car without any mileage updates
2. Request service prediction

**Expected Results:**
- System should handle this gracefully
- Response should indicate insufficient data for precise prediction
- Default values or estimates should be provided when possible

#### 4.2 Multiple Service Intervals

**Test Steps:**
1. Create multiple overlapping service intervals for the same car
2. Request service prediction

**Expected Results:**
- System should correctly prioritize the most specific interval
- Make and model specific intervals should take precedence over make-only intervals
- Make-only intervals should take precedence over global intervals

#### 4.3 Changing Mileage Patterns

**Test Steps:**
1. Set up a car with consistent mileage updates
2. Then add updates showing a significant change in usage patterns
3. Request service prediction

**Expected Results:**
- Recent usage patterns should be weighted more heavily
- Prediction should adapt to changing usage patterns
- Ideally, system should detect anomalies and use reasonable averages

### 5. Performance Testing

#### 5.1 Bulk Mileage Updates

**Test Steps:**
1. Create a script to add 1000+ mileage updates across multiple cars
2. Measure the system's response time for retrieving predictions

**Expected Results:**
- System should handle bulk data efficiently
- Response times should remain reasonable
- Database indexes should optimize query performance

#### 5.2 Concurrent Users

**Test Steps:**
1. Simulate multiple users reporting mileage simultaneously
2. Monitor system performance and database locks

**Expected Results:**
- No deadlocks or significant slowdowns
- All updates should be processed correctly
- Race conditions should be handled properly

## Test Automation

Consider creating automated tests for the following:

1. **Unit Tests**:
   - Service interval selection logic
   - Daily mileage calculation algorithm
   - Next service date prediction algorithm

2. **API Tests**:
   - Mileage reporting endpoint
   - Prediction retrieval endpoint
   - Validation of input data

3. **Integration Tests**:
   - End-to-end workflow from mileage update to prediction
   - Admin interface functionality
   - Database update integrity

## Test Data Generator

For comprehensive testing, create a script that:

1. Generates realistic car data with various makes and models
2. Creates appropriate service intervals
3. Simulates realistic mileage update patterns
4. Allows time-based simulation to test prediction accuracy

## Test Reporting

Document any issues found during testing:

1. Unexpected behaviors or edge cases
2. Performance bottlenecks
3. User experience concerns
4. Suggestions for algorithm improvements

## Post-Deployment Monitoring

After deploying to production:

1. Monitor prediction accuracy over time
2. Track system performance metrics
3. Collect user feedback on prediction usefulness
4. Identify patterns that may require algorithm adjustment 