# ECAR Project Development Journal

## April 3, 2025 - React Warnings and API Integration Fixes

### Issues Addressed

#### 1. React DOM Warnings

We encountered several React DOM warnings in the browser console related to props being incorrectly passed to DOM elements:

```
React does not recognize the `InputProps` prop on a DOM element.
React does not recognize the `confirmTitle` prop on a DOM element.
React does not recognize the `confirmContent` prop on a DOM element.
```

**Root Cause**: 
- Material-UI components like TextInput, SelectInput, DateTimeInput were being passed `InputProps` directly, which were then incorrectly passed down to DOM elements.
- DeleteButton components were using deprecated or incorrect prop names for confirmation dialogs.

**Solution**:
- Replaced `InputProps={{ className: "bg-[#1a1a2e]" }}` with `sx={{ "& .MuiInputBase-root": { backgroundColor: "#1a1a2e" } }}` to correctly style inputs.
- Updated DeleteButton props from `confirmTitle` and `confirmContent` to `confirmationTitle` and `confirmationContent`.

#### 2. API 415 (Unsupported Media Type) Errors

When attempting to create or update resources, particularly invoices with file uploads, we encountered 415 Unsupported Media Type errors:

```
POST http://localhost:8000/api/invoices/ 415 (Unsupported Media Type)
```

**Root Cause**:
- The API was expecting a specific Content-Type header that wasn't being set.
- For file uploads, the request was using JSON format instead of multipart/form-data.

**Solution**:
- Added proper Content-Type headers to API requests:
  ```javascript
  options.headers = new Headers({ 
    Accept: 'application/json',
    'Content-Type': 'application/json',
  });
  ```
- Implemented special handling for file uploads using FormData:
  ```javascript
  const hasFileUpload = (data: any): boolean => {
    return Object.values(data).some(
      (value) => value instanceof File || (value instanceof FileList && value.length > 0)
    );
  };
  
  // For requests with files, use FormData instead of JSON
  if (hasFileUpload(params.data)) {
    // ... FormData implementation ...
  }
  ```

### Enhanced Data Provider

We made several improvements to the data provider:

1. **Content-Type Management**:
   - Added proper headers for both JSON and multipart/form-data requests
   - Ensured Content-Type is correctly set for all request types

2. **File Upload Handling**:
   - Added detection of File objects in request data
   - Implemented FormData conversion for file uploads
   - Created separate handling for file uploads in create and update methods

3. **Error Handling**:
   - Enhanced error messages for API failures
   - Improved promise chain error handling

### Testing

All fixes were tested with:
- Creating a new invoice with PDF attachment
- Updating a service with multiple fields
- Creating and deleting service items
- Various filtering and search operations

### Next Steps

1. Continue monitoring for any additional API or React warnings
2. Implement additional error handling in the frontend for better user feedback
3. Consider adding progress indicators for file uploads
4. Update documentation with latest fixes and enhancements

## Previous Journal Entries

// Add previous entries here if they exist 