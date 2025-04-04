# E-Car Project - Bug Fixes Log

## April 2, 2025

### Fixed Swagger Documentation Schema Generation

**Issue**: Swagger documentation was generating 500 errors when accessing the OpenAPI schema due to serializer naming conflicts and circular references between serializers.

**Solution**:
1. Added `ref_name` attributes to all serializer `Meta` classes to provide unique references
2. Created a custom `FixedSchemaGenerator` class that properly handles serializer reference conflicts
3. Added `swagger_schema_fields` to problematic viewsets to ensure proper schema generation
4. Updated the `get_schema_view` configuration to use our custom generator

**Impact**: Swagger documentation now works correctly, allowing developers to explore the API through the UI and generate client code. Both the Swagger UI and the OpenAPI schema JSON endpoints work properly.

**Files Affected**:
- `/home/ecar/ecar_project/backend/api/serializers.py`
- `/home/ecar/ecar_project/backend/api/views.py`
- `/home/ecar/ecar_project/backend/api/urls.py`
- `/home/ecar/ecar_project/backend/api/swagger_wrapper.py` (new file)

**Verification**: Confirmed that both the Swagger UI (`/api/docs/`) and the OpenAPI schema (`/api/docs/?format=openapi`) are now accessible and working correctly.

### Fixed Circular Import in Serializers

**Issue**: Circular import error in the serializers where `ServiceSerializer` referenced `ServiceIntervalSerializer` which was defined after it in the file. This caused a `NameError` for `ServiceIntervalSerializer` when running migrations or using the API.

**Solution**: Rearranged the class definitions in `serializers.py` to ensure that `ServiceIntervalSerializer` is defined before `ServiceSerializer`. This resolved the dependency issue without requiring any changes to the models or API endpoints.

**Impact**: Fixed Docker container errors when running migrations. The service prediction system now works correctly, allowing for tracking service history and making accurate predictions for future maintenance.

**Files Affected**: 
- `/home/ecar/ecar_project/backend/api/serializers.py`

**Verification**: Confirmed that all migrations run successfully in the Docker environment and the API endpoints for service history are accessible.

## API Authentication Endpoint Fixes (April 9, 2025)

### Description
Frontend was unable to connect to the backend API due to incorrect authentication endpoint paths in the authProvider.

### Root Cause
- Frontend was trying to use `/api/token/` and `/api/token/refresh/` endpoints
- Backend API uses `/api/admin-login/` and `/api/auth/token/refresh/` as per Swagger documentation

### Solution
1. Updated authentication endpoints in `authProvider.ts`:
   - Changed login endpoint from `/api/token/` to `/api/admin-login/`
   - Updated token refresh endpoint from `/api/token/refresh/` to `/api/auth/token/refresh/`

2. Verified functionality:
   - Tested login endpoint with curl: `curl -X POST http://localhost:8000/api/admin-login/ -H "Content-Type: application/json" -d '{"username":"admin","password":"Phara0n$"}'`
   - Confirmed token refresh endpoint: `curl -X POST http://localhost:8000/api/auth/token/refresh/ -H "Content-Type: application/json" -d '{"refresh":"token_here"}'`

### Impact
- Restored frontend connection to backend API
- Ensured proper authentication flow
- Frontend can now perform CRUD operations through the authenticated API

## CORS Configuration Fix (April 9, 2025)

### Description
Frontend was unable to connect to the backend API due to CORS (Cross-Origin Resource Sharing) issues when running on different ports.

### Root Cause
- Frontend runs on port 5173 via Vite
- Backend runs on port 8000 via Django
- No proxy configuration was set up to handle the cross-origin requests

### Solution
1. Updated Vite configuration in `vite.config.ts` to:
   - Set up a proxy for API requests to forward them to the backend
   - Configure CORS settings for development
   - Added the following configuration:
     ```ts
     server: {
       port: 5173,
       proxy: {
         '/api': {
           target: 'http://localhost:8000',
           changeOrigin: true,
           secure: false,
         }
       },
       cors: true
     }
     ```

2. This configuration ensures:
   - API requests from the frontend are proxied to the backend
   - CORS headers are properly set
   - The same-origin policy is respected for browser security

### Impact
- Resolved CORS errors in the browser console
- Frontend can now connect to the backend API without authentication issues
- Improved developer experience with seamless API integration

## Previous Fixes

### Swagger Documentation Issue

**Issue**: Swagger API documentation generator was failing to correctly document viewsets that used custom serializer methods.

**Solution**: Implemented a bypass for viewsets that were causing issues by adding a `get_serializer_class` method that returns a simplified serializer for documentation purposes.

**Files Affected**:
- `/home/ecar/ecar_project/backend/api/views.py`
- `/home/ecar/ecar_project/backend/api/serializers.py` 