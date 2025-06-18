# Coach Dashboard - API Integration

## Overview

CoachDashboard has been updated to integrate with 5 API endpoints from the backend, providing full coaching session management functionality:

### 5 API Endpoints Integrated:

| STT | Chức năng                       | API / Mô tả                                                                       |
| --- | ------------------------------- | --------------------------------------------------------------------------------- |
| 1.  | Tạo lịch rảnh                   | `POST /api/schedule` → nhập `start_time`, `end_time`                              |
| 2.  | Cập nhật Google Meet            | `PUT /api/coach/meet-link` → cập nhật link cố định                                |
| 3.  | Xem các lịch hẹn đang chờ duyệt | `GET /api/appointment/pending`                                                    |
| 4.  | Duyệt lịch hẹn                  | `PUT /api/appointment/accept/:id` → Cập nhật trạng thái `accepted`, gán Meet link |
| 5.  | Từ chối lịch hẹn                | `PUT /api/appointment/reject/:id` → Trạng thái `rejected`, gửi tin nhắn từ chối   |

## Main Features

### 1. Dashboard Overview
- **Welcome Section**: Personalized greeting with coach name
- **Today's Statistics**: Quick overview of today's sessions, pending requests, and upcoming sessions
- **Google Meet Link Management**: Display and update coach's Meet link
- **Statistics Cards**: Total bookings, pending requests, confirmed sessions, completed sessions, average rating, and earnings
- **Quick Actions**: Easy access to review bookings and manage schedule

### 2. Schedule Management Tab
- **Create Schedule**: Add new available time slots
- **View Schedules**: See all created schedules with status (Available/Booked)
- **Delete Schedules**: Remove unbooked schedules
- **API Integration**: Uses `POST /api/schedule` endpoint

### 3. Booking Management Tab
- **Pending Requests**: View and manage booking requests from members
- **Accept/Reject**: Respond to booking requests with one click
- **Session Details**: View complete information about each session
- **Status Tracking**: Track session status (pending, confirmed, completed)
- **API Integration**: Uses `GET /api/appointment/pending`, `PUT /api/appointment/accept/:id`, `PUT /api/appointment/reject/:id`

### 4. Google Meet Link Management
- **Display Current Link**: Show current Meet link with copy functionality
- **Update Link**: Easy form to update Meet link
- **Automatic Sharing**: Link automatically shared when accepting bookings
- **API Integration**: Uses `PUT /api/coach/meet-link` endpoint

## File Structure

```
FrontEnd/
├── src/
│   ├── pages/
│   │   ├── CoachDashboard/
│   │   │   ├── CoachDashboard.jsx          # Main dashboard component
│   │   │   └── ScheduleManagement.jsx      # Schedule management tab
│   │   └── BookingManagement/
│   │       ├── BookingManagement.jsx       # Booking management tab
│   │       └── BookingManagement.css       # Styling for booking management
│   └── components/
│       └── ui/
│           ├── StatisticCard.jsx           # Reusable statistic card
│           ├── FormModal.jsx               # Reusable form modal
│           └── ActionButtonGroup.jsx       # Reusable action buttons
```

## API Integration Details

### 1. Create Schedule (`POST /api/schedule`)
```javascript
const scheduleData = {
    start_time: values.dateTime[0].format('YYYY-MM-DD HH:mm:ss'),
    end_time: values.dateTime[1].format('YYYY-MM-DD HH:mm:ss')
};

const response = await fetch(`${API_BASE_URL}/schedule`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(scheduleData)
});
```

### 2. Update Meet Link (`PUT /api/coach/meet-link`)
```javascript
const response = await fetch(`${API_BASE_URL}/coach/meet-link`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ meet_link: values.meetLink })
});
```

### 3. Get Pending Appointments (`GET /api/appointment/pending`)
```javascript
const response = await fetch(`${API_BASE_URL}/appointment/pending`, {
    headers: getAuthHeaders()
});
```

### 4. Accept Appointment (`PUT /api/appointment/accept/:id`)
```javascript
const response = await fetch(`${API_BASE_URL}/appointment/accept/${sessionId}`, {
    method: 'PUT',
    headers: getAuthHeaders()
});
```

### 5. Reject Appointment (`PUT /api/appointment/reject/:id`)
```javascript
const response = await fetch(`${API_BASE_URL}/appointment/reject/${sessionId}`, {
    method: 'PUT',
    headers: getAuthHeaders()
});
```

## Authentication

All API calls use JWT token authentication:
```javascript
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};
```

## Error Handling

- **API Failures**: Graceful handling when APIs fail with empty data sets
- **User Feedback**: Success/error messages for all actions
- **Loading States**: Loading indicators during API calls
- **Validation**: Form validation for required fields
- **No Mock Data**: Dashboard relies entirely on real API data

## How to Use

### 1. Access Coach Dashboard
- Login with coach account
- Navigate to `/coach-dashboard`

### 2. Manage Schedule
- Click "Schedule Management" tab
- Click "Create Schedule" to add new time slots
- Select date and time range
- Submit form to create schedule

### 3. Manage Bookings
- Click "Booking Management" tab
- View pending requests in the "Pending" tab
- Click "Accept" or "Reject" for each request
- View session details by clicking "View" button

### 4. Update Meet Link
- In Overview tab, click "Update Link" button
- Enter new Google Meet link
- Submit to update

### 5. View Statistics
- Overview tab shows real-time statistics
- Pending requests count updates automatically
- Quick access to all major functions

## Data Flow

1. **Schedule Creation**: Coach creates available time slots → Members can book these slots
2. **Booking Process**: Member books slot → Coach receives pending request → Coach accepts/rejects
3. **Meet Link**: When coach accepts, Meet link is automatically assigned to session
4. **Statistics**: Dashboard shows real-time counts from API data

## Responsive Design

- **Mobile Friendly**: All components work on mobile devices
- **Tablet Support**: Optimized layout for tablet screens
- **Desktop**: Full-featured interface for desktop users

## Performance Optimizations

- **Lazy Loading**: Components load only when needed
- **Caching**: API responses cached where appropriate
- **Error Recovery**: Graceful degradation when APIs fail
- **Loading States**: User feedback during operations

## Troubleshooting

### Common Issues:

1. **API Connection Failed**
   - Check if backend server is running
   - Verify API_BASE_URL is correct
   - Check network connectivity
   - Dashboard will show empty data if APIs are unavailable

2. **Authentication Errors**
   - Ensure user is logged in
   - Check if token is valid
   - Refresh page if token expired

3. **Schedule Creation Failed**
   - Verify date/time format is correct
   - Check if time slot conflicts with existing schedules
   - Ensure coach has proper permissions

4. **Booking Management Issues**
   - Refresh page to get latest data
   - Check if session still exists
   - Verify coach permissions for the session

5. **Empty Dashboard**
   - This is normal if no data exists yet
   - Create schedules to see them in Schedule Management
   - Accept/reject bookings to see them in Booking Management

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live updates
2. **Calendar Integration**: Google Calendar sync
3. **Advanced Scheduling**: Recurring schedules, bulk operations
4. **Analytics Dashboard**: Detailed performance metrics
5. **Notification System**: Push notifications for new requests

## Security Considerations

1. **Token Management**: Secure token storage and refresh
2. **Input Validation**: Server-side validation for all inputs
3. **Authorization**: Role-based access control
4. **Data Protection**: Secure transmission of sensitive data
5. **Session Management**: Proper session handling and timeout 