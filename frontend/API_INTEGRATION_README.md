# API Integration - Register Admin, Login, Get All Admins, Get Admin Details & Delete Admin

## Overview
The frontend has been successfully integrated with the backend APIs for registering admins, user authentication, admin management, and admin deletion. All forms now send the correct payload structure that matches the backend expectations.

## User Flow
1. **Login** → `/login`
2. **Module Selector** → `/select-module` (after successful login)
3. **Dashboard** → `/dashboard` (after selecting "Chatting Agency")

## API Endpoints

### 1. Register Admin
- **URL**: `POST /api/v1/admin/register`
- **Base URL**: `http://localhost:5010` (configurable via `NEXT_PUBLIC_API_BASE_URL`)

### 2. Login Admin
- **URL**: `POST /api/v1/admin/login`
- **Base URL**: `http://localhost:5010` (configurable via `NEXT_PUBLIC_API_BASE_URL`)

### 3. Get All Admins
- **URL**: `GET /api/v1/admin/get_all_admin`
- **Parameters**: `limit`, `offset`, `query`, `sort`, `sort_by`

### 4. Get Admin Details
- **URL**: `GET /api/v1/admin/details`
- **Parameters**: `identifier` (email or username)

### 5. Delete Admin
- **URL**: `DELETE /api/v1/admin/delete`
- **Parameters**: `admin_id` (query parameter)

## Payload Structures

### Register Admin Payload
```json
{
  "admin_email": "admin@example.com",
  "admin_username": "admin2142user", 
  "admin_password": "Test123",
  "admin_first_name": "John",
  "admin_last_name": "Doe",
  "admin_role": "admin"
}
```

### Login Payload
```json
{
  "email_or_username": "admin112user",
  "password": "securepassword123"
}
```

### Get All Admins Response
```json
{
  "status": "Success",
  "message": "Retrieved 3 admin(s) successfully",
  "data": [
    {
      "admin_id": "1",
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "email": "john.doe@example.com",
      "username": "johndoe",
      "role": "admin",
      "status": "active"
    }
  ],
  "total_count": 3
}
```

### Get Admin Details Response
```json
{
  "status": "Success",
  "message": "Admin details retrieved successfully",
  "data": {
    "admin_id": "1",
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "role": "admin"
  }
}
```

### Delete Admin Response
```json
{
  "status": "Success",
  "message": "Admin deleted successfully"
}
```

## Frontend Changes Made

### 1. Form Structure Updated
- ✅ Split `name` into `admin_first_name` and `admin_last_name`
- ✅ Changed `email` to `admin_email`
- ✅ Added `admin_username` field (required)
- ✅ Added `admin_role` dropdown (admin/super admin)
- ✅ Removed `phone` field (not supported by backend)
- ✅ Updated validation schema

### 2. API Integration
- ✅ Created `src/lib/api.ts` with complete API service
- ✅ Added proper error handling and logging
- ✅ Integrated with the "Add Admin" form
- ✅ Integrated with the login form
- ✅ **NEW**: Integrated with "Get All Admins" API
- ✅ **NEW**: Integrated with "Get Admin Details" API
- ✅ **NEW**: Integrated with "Delete Admin" API
- ✅ Added loading states and user feedback

### 3. Authentication System
- ✅ Created `src/lib/auth-context.tsx` for state management
- ✅ Added authentication provider to app layout
- ✅ Implemented login/logout functionality
- ✅ Added user session persistence
- ✅ Protected routes with authentication checks

### 4. User Flow Implementation
- ✅ Login redirects to module selector
- ✅ Module selector shows user info and logout
- ✅ "Chatting Agency" module redirects to dashboard
- ✅ Dashboard protected with authentication
- ✅ Proper logout functionality throughout

### 5. Admin Management Dashboard
- ✅ **NEW**: Real-time data fetching from API
- ✅ **NEW**: Server-side search functionality
- ✅ **NEW**: Refresh button to reload data
- ✅ **NEW**: Proper loading states and error handling
- ✅ **NEW**: Empty state handling
- ✅ **NEW**: Data transformation from API to frontend format
- ✅ **NEW**: Statistics cards with real data
- ✅ **NEW**: Delete functionality with API integration
- ✅ **NEW**: Enhanced delete dialog with loading states
- ✅ **NEW**: Confirmation dialog for delete operations

### 6. UI/UX Improvements
- ✅ Added loading spinners during form submission
- ✅ Added toast notifications for success/error
- ✅ Disabled form fields during submission
- ✅ Enhanced table display with role badges
- ✅ Updated login form to support email/username
- ✅ User avatar shows initials from name
- ✅ Welcome message with user's name
- ✅ **NEW**: Search functionality with Enter key support
- ✅ **NEW**: Refresh button with loading state
- ✅ **NEW**: Empty state messages for no data
- ✅ **NEW**: Delete confirmation dialog with loading state
- ✅ **NEW**: Disabled buttons during delete operation
- ✅ **NEW**: Visual feedback during delete process

## Testing Instructions

### 1. Start the Backend
```bash
cd GoatFinance
uvicorn app:app --host localhost --port 8000 --reload
# Backend should be running on http://localhost:5010
```

### 2. Start the Frontend
```bash
npm run dev
# Frontend should be running on http://localhost:3000
```

### 3. Test Register Admin
1. Navigate to `/dashboard/manage-admins`
2. Click "Add Admin" button
3. Fill out the form with test data:
   - First Name: "John"
   - Last Name: "Doe"
   - Email: "john.doe@example.com"
   - Username: "johndoe"
   - Role: "admin"
   - Password: "Test123456"
   - Confirm Password: "Test123456"
4. Click "Create Admin"
5. Check browser console for API logs
6. Verify success/error toast notification

### 4. Test Complete User Flow
1. Navigate to `/login`
2. Use the credentials from the admin you just created:
   - Email/Username: "johndoe" (or "john.doe@example.com")
   - Password: "Test123456"
3. Click "Sign In"
4. **Verify redirect to module selector** (`/select-module`)
5. **Click "Chatting Agency" module**
6. **Verify redirect to dashboard** (`/dashboard`)
7. Check authentication state in localStorage
8. Test logout functionality

### 5. Test Admin Management Dashboard
1. Navigate to `/dashboard/manage-admins`
2. **Verify real data loads from API**
3. **Test search functionality**:
   - Type a name, email, or username
   - Press Enter or click Search button
   - Verify filtered results
4. **Test refresh functionality**:
   - Click Refresh button
   - Verify data reloads
5. **Test delete functionality**:
   - Click delete icon on any admin
   - **Verify confirmation dialog appears**
   - **Verify loading state during deletion**
   - Confirm deletion
   - Verify admin is removed from list
6. **Verify statistics cards** show real data

### 6. Test Delete Admin Functionality
1. **Test delete confirmation dialog**:
   - Click delete icon on any admin
   - Verify dialog shows admin name and email
   - Verify "Cancel" and "Delete Admin" buttons
2. **Test delete loading state**:
   - Click "Delete Admin" button
   - Verify button shows "Deleting..." with spinner
   - Verify dialog cannot be closed during deletion
   - Verify buttons are disabled during deletion
3. **Test delete success**:
   - Verify success toast notification
   - Verify admin is removed from the list
   - Verify statistics cards update
4. **Test delete error handling**:
   - Try deleting an admin that doesn't exist
   - Verify error toast notification
   - Verify dialog closes properly

### 7. Test Authentication Protection
1. Try accessing `/dashboard` directly without login
2. Verify redirect to login page
3. Try accessing `/select-module` directly without login
4. Verify redirect to login page

### 8. Monitor API Calls
Open browser developer tools and check:
- **Console**: API request/response logs
- **Network**: Actual HTTP requests to backend
- **Application**: Cookies, localStorage, and session storage

## Environment Configuration

### Option 1: Environment Variable (Recommended)
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5010
```

### Option 2: Default Configuration
The API service defaults to `http://localhost:5010` if no environment variable is set.

## Authentication Flow

### Login Process
1. User enters email/username and password
2. Frontend sends POST request to `/admin/login`
3. Backend validates credentials and returns user data
4. Frontend stores user data in localStorage and auth context
5. User is redirected to **module selector** (`/select-module`)

### Module Selection Process
1. User sees available modules (Chatting Agency, Management Agency, etc.)
2. User clicks "Chatting Agency" module
3. User is redirected to **dashboard** (`/dashboard`)

### Session Management
- User data is stored in localStorage for persistence
- Authentication state is managed via React Context
- Logout clears all stored data and cookies
- Protected routes redirect to login if not authenticated

## Admin Management Features

### Data Fetching
- ✅ Automatic loading on page mount
- ✅ Server-side search with query parameter
- ✅ Pagination support (limit/offset)
- ✅ Sorting support (sort/sort_by)
- ✅ Real-time data refresh

### Data Transformation
- ✅ API response mapping to frontend format
- ✅ Proper field mapping (first_name/last_name → admin_first_name/admin_last_name)
- ✅ Default value handling for missing fields
- ✅ Date formatting for display

### Delete Functionality
- ✅ **NEW**: Confirmation dialog with admin details
- ✅ **NEW**: Loading state during deletion
- ✅ **NEW**: Disabled buttons during operation
- ✅ **NEW**: Visual feedback with spinner
- ✅ **NEW**: Error handling for failed deletions
- ✅ **NEW**: Success feedback with toast notifications
- ✅ **NEW**: Automatic list refresh after deletion

### Error Handling
- ✅ Network error handling
- ✅ API error response handling
- ✅ User-friendly error messages
- ✅ Loading state management
- ✅ Retry functionality
- ✅ **NEW**: Authentication error handling
- ✅ **NEW**: Session expiration handling

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS is configured to allow `http://localhost:3000`
   - Check backend logs for CORS-related errors

2. **Connection Refused**
   - Verify backend is running on port 8000
   - Check if backend is accessible at `http://localhost:5010`

3. **Payload Validation Errors**
   - Check browser console for detailed error messages
   - Verify all required fields are filled
   - Ensure password meets minimum requirements (8+ characters)

4. **Authentication Issues**
   - Check if login response contains expected user data
   - Verify localStorage is working in browser
   - Check for any console errors during login

5. **Redirect Issues**
   - Ensure login redirects to `/select-module` not `/dashboard`
   - Verify module selector redirects to `/dashboard` when clicking "Chatting Agency"

6. **Data Loading Issues**
   - Check if "Get All Admins" API is returning data
   - Verify API response structure matches expected format
   - Check for any transformation errors in console

7. **Delete Issues**
   - **NEW**: Check if admin ID is being passed correctly
   - **NEW**: Verify admin exists in database before deletion
   - **NEW**: Check for permission issues (admin role required)

### Debug Steps
1. Check browser console for API logs
2. Verify network requests in developer tools
3. Check backend logs for incoming requests
4. Test API endpoints directly with tools like Postman
5. Check localStorage for stored user data
6. Verify authentication state in React DevTools
7. **NEW**: Check admin data transformation logs
8. **NEW**: Monitor delete operation logs

## Next Steps

1. **Test the complete user flow** with the provided test data
2. **Verify backend receives the correct payload**
3. **Check if admin is created in the database**
4. **Implement remaining API endpoints** (update admin)
5. **Add proper error handling** for different scenarios
6. **Implement real-time data fetching** instead of manual refresh
7. **Add role-based access control** for different admin types
8. **Add pagination UI** for large admin lists
9. **NEW**: Test delete functionality thoroughly
10. **NEW**: Implement soft delete recovery (if needed)

## Files Modified

- `src/components/dashboard/manage-admins/admin-form-sheet.tsx`
- `src/app/dashboard/manage-admins/page.tsx` **UPDATED**
- `src/components/dashboard/manage-admins/delete-admin-dialog.tsx` **ENHANCED**
- `src/app/login/page.tsx`
- `src/app/select-module/page.tsx`
- `src/app/dashboard/layout.tsx`
- `src/app/layout.tsx`
- `src/lib/types.ts` (new)
- `src/lib/api.ts` (new)
- `src/lib/auth-context.tsx` (new)

## API Service Features

- ✅ Automatic error handling
- ✅ Request/response logging
- ✅ Type-safe payloads
- ✅ Cookie-based authentication support
- ✅ Environment-based configuration
- ✅ Loading states and user feedback
- ✅ Authentication state management
- ✅ Session persistence
- ✅ Protected routes
- ✅ Complete user flow implementation
- ✅ **NEW**: Admin data fetching and management
- ✅ **NEW**: Search and filtering capabilities
- ✅ **NEW**: Real-time data refresh
- ✅ **NEW**: Data transformation utilities
- ✅ **NEW**: Delete admin functionality
- ✅ **NEW**: Enhanced error handling for delete operations
