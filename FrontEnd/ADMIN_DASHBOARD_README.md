# Admin Dashboard - Coach Management

## Overview

AdminDashboard has been updated to integrate directly with 5 API endpoints from the backend, providing full coach management functionality as requested:

### 5 API Endpoints Integrated:

1. **POST /api/admin/create-coach** - Create Coach Account
2. **GET /api/admin/get-coaches** - Get Coaches List  
3. **PUT /api/admin/update-coach/:coach_id** - Update Coach
4. **DELETE /api/admin/delete-coach/:coach_id** - Deactivate Coach
5. **PUT /api/admin/restore-coach/:coach_id** - Restore Coach

## Main Features

### 1. Dashboard Overview
- **Statistics Overview**: Display total coaches, active coaches, inactive coaches
- **Visual Interface**: Using Ant Design with appropriate colors and icons

### 2. Coach Management

#### Create New Coach
- Coach creation form with fields:
  - Full Name (required)
  - Email (required, auto-generate username)
  - Phone Number
  - Date of Birth
  - Password (required)
  - Google Meet Link
- Display login credentials after successful creation
- Copy credentials functionality

#### View Coaches List
- Table displaying coach information:
  - Avatar and basic information
  - Specialization
  - Experience
  - Status (Active/Inactive)
  - Registration Date
- Search by name, email, phone number, specialization
- Filter by status

#### Edit Coach
- Form to update coach information:
  - Full Name
  - Phone Number
  - Account Status
  - Specialization
  - Years of Experience
  - Bio
  - Google Meet Link
  - Coach Status

#### Deactivate/Restore Coach
- Deactivate button for active coaches
- Restore button for inactive coaches
- Confirmation before execution

#### View Coach Details
- Modal displaying complete coach information
- Including bio, Google Meet link, status

## File Structure

```
FrontEnd/
└── src/
    └── pages/
        └── AdminDashboard/
            └── AdminDashboard.jsx   # Main component with integrated API calls
```

## API Integration

### Helper Functions in Component:

```javascript
// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'API request failed');
    }
    return data;
};
```

### Direct API Calls:

```javascript
// Create new coach
const response = await fetch(`${API_BASE_URL}/admin/create-coach`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(coachData)
});

// Get coaches list
const response = await fetch(`${API_BASE_URL}/admin/get-coaches`, {
    method: 'GET',
    headers: getAuthHeaders()
});

// Update coach
const response = await fetch(`${API_BASE_URL}/admin/update-coach/${coachId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updateData)
});

// Deactivate coach
const response = await fetch(`${API_BASE_URL}/admin/delete-coach/${coachId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
});

// Restore coach
const response = await fetch(`${API_BASE_URL}/admin/restore-coach/${coachId}`, {
    method: 'PUT',
    headers: getAuthHeaders()
});
```

### Data Structure:

#### Coach Data (create new):
```javascript
{
  username: string,        // Auto-generated from email
  full_name: string,       // Required
  email: string,          // Required
  phone_number: string,   // Optional
  date_of_birth: string,  // Format: YYYY-MM-DD
  password: string,       // Required
  google_meet_link: string // Optional
}
```

#### Coach Response (from API):
```javascript
{
  user_id: number,
  username: string,
  full_name: string,
  email: string,
  phone_number: string,
  account_status: 'active' | 'inactive',
  registration_date: string,
  coach_id: number,
  specialization: string,
  bio: string,
  experience_years: number,
  coach_status: 'active' | 'inactive',
  google_meet_link: string
}
```

## How to Use

### 1. Access Admin Dashboard
- Login with admin account
- Navigate to `/admin-dashboard`

### 2. Create New Coach
- Click "Create Coach" button
- Fill in required information
- Submit form
- Copy login credentials for coach

### 3. Manage Coaches
- Use search bar to filter coaches
- Click "View" icon to see details
- Click "Edit" icon to modify
- Click "Deactivate/Restore" icon to change status

### 4. Refresh Data
- Click "Refresh" button to reload coaches list

## Important Notes

1. **Authentication**: Must be logged in with admin role to access
2. **Token**: API calls use JWT token from localStorage
3. **Error Handling**: Error handling and appropriate message display
4. **Loading States**: Loading display during API calls
5. **Validation**: Form validation for required fields
6. **Direct API Integration**: API calls integrated directly in component, no service layer needed

## Advantages of Direct Integration

1. **Simplification**: No separate service file needed
2. **Easy Maintenance**: All API logic in one file
3. **Reduced Dependencies**: Fewer files, easier management
4. **Performance**: No additional module imports needed

## Troubleshooting

### Common Issues:

1. **401 Unauthorized**: Check token and admin role
2. **404 Not Found**: Check if API endpoint is correct
3. **500 Server Error**: Check if backend is running

### Debug:
- Open Developer Tools (F12)
- Check Network tab for API calls
- Check Console tab for JavaScript errors

## Recent Updates

- ✅ Integrated all 5 API endpoints
- ✅ Replaced mock data with real API
- ✅ Added deactivate/restore coach functionality
- ✅ Improved UI/UX with English language
- ✅ Added validation and error handling
- ✅ Optimized performance with loading states
- ✅ Removed adminService.js, integrated API calls directly
- ✅ Simplified code structure 