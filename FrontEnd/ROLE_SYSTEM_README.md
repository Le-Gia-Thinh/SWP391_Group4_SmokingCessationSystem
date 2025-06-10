# Role-Based Access Control System - Hệ thống Phân quyền

## Overview - Tổng quan

This system implements role-based access control with three main roles:
- **User**: Regular users who register themselves
- **Coach**: Certified coaches whose accounts are created by Admin
- **Admin**: System administrators who manage users and create coach accounts

Hệ thống này triển khai phân quyền với ba vai trò chính:
- **User**: Người dùng thường tự đăng ký
- **Coach**: Coach được chứng nhận, tài khoản được Admin tạo
- **Admin**: Quản trị viên hệ thống quản lý user và tạo tài khoản coach

## Account Creation Process - Quy trình tạo tài khoản

### User Accounts - Tài khoản User
- **Self-registration**: Users can register themselves through the normal registration process
- **Default role**: All new registrations start as "user" role
- **Access**: Can access user dashboard and basic user features

- **Tự đăng ký**: User có thể tự đăng ký qua quy trình đăng ký thông thường
- **Vai trò mặc định**: Tất cả đăng ký mới bắt đầu với vai trò "user"
- **Quyền truy cập**: Có thể truy cập dashboard user và các tính năng cơ bản

### Coach Accounts - Tài khoản Coach
- **Admin-created**: Coach accounts are created by Admin, not self-registered
- **Direct contact**: Coaches contact Admin via email to request account creation
- **Credential provision**: Admin creates account and provides login credentials to the coach
- **Verification**: Coaches are pre-verified by Admin before account creation
- **Access**: Can access coach dashboard and manage assigned users

- **Được Admin tạo**: Tài khoản Coach được Admin tạo, không phải tự đăng ký
- **Liên lạc trực tiếp**: Coach liên lạc với Admin qua email để yêu cầu tạo tài khoản
- **Cung cấp thông tin đăng nhập**: Admin tạo tài khoản và cung cấp thông tin đăng nhập cho coach
- **Xác minh**: Coach được Admin xác minh trước khi tạo tài khoản
- **Quyền truy cập**: Có thể truy cập dashboard coach và quản lý user được giao

### Admin Accounts - Tài khoản Admin
- **System accounts**: Created during system setup
- **Full access**: Can manage all users, create coach accounts, and access admin dashboard
- **Coach management**: Can create new coach accounts when contacted by coaches

- **Tài khoản hệ thống**: Được tạo trong quá trình thiết lập hệ thống
- **Quyền truy cập đầy đủ**: Có thể quản lý tất cả user, tạo tài khoản coach, và truy cập admin dashboard
- **Quản lý coach**: Có thể tạo tài khoản coach mới khi được coach liên lạc

## User Flow - Luồng người dùng

### For Regular Users - Cho User thường
1. **Register**: Self-register through normal registration process
2. **Login**: Access user dashboard
3. **Use Features**: Access basic user features and track progress

1. **Đăng ký**: Tự đăng ký qua quy trình đăng ký thông thường
2. **Đăng nhập**: Truy cập user dashboard
3. **Sử dụng tính năng**: Truy cập các tính năng cơ bản và theo dõi tiến độ

### For Coaches - Cho Coach
1. **Contact Admin**: Reach out to Admin via email to request account creation
2. **Account Creation**: Admin creates coach account and provides credentials
3. **First Login**: Coach logs in with provided credentials
4. **Password Change**: Coach should change password on first login
5. **Access Coach Dashboard**: Manage assigned users and coaching activities

1. **Liên lạc Admin**: Liên hệ Admin qua email để yêu cầu tạo tài khoản
2. **Tạo tài khoản**: Admin tạo tài khoản coach và cung cấp thông tin đăng nhập
3. **Đăng nhập lần đầu**: Coach đăng nhập với thông tin được cung cấp
4. **Đổi mật khẩu**: Coach nên đổi mật khẩu khi đăng nhập lần đầu
5. **Truy cập Coach Dashboard**: Quản lý user được giao và hoạt động coaching

### For Admins - Cho Admin
1. **System Access**: Login with admin credentials
2. **User Management**: View and manage all users
3. **Coach Requests**: Respond to coach account requests via email
4. **Create Coach Accounts**: Create new coach accounts and provide credentials
5. **System Monitoring**: Monitor system activity and statistics

1. **Truy cập hệ thống**: Đăng nhập với thông tin admin
2. **Quản lý User**: Xem và quản lý tất cả user
3. **Yêu cầu Coach**: Phản hồi yêu cầu tạo tài khoản coach qua email
4. **Tạo tài khoản Coach**: Tạo tài khoản coach mới và cung cấp thông tin đăng nhập
5. **Giám sát hệ thống**: Giám sát hoạt động hệ thống và thống kê

## Mock Credentials - Thông tin đăng nhập mẫu

### User Account - Tài khoản User
```
Email: user@example.com
Password: 123456
Role: user
Registration: Self-registered
```

### Coach Account - Tài khoản Coach
```
Email: coach@example.com
Password: 123456
Role: coach
Registration: Admin-created
Specialization: Smoking Cessation
Experience: 5 years
```

### Admin Account - Tài khoản Admin
```
Email: admin@example.com
Password: 123456
Role: admin
Registration: System account
```

## Features - Tính năng

### User Dashboard
- View personal smoking cessation progress
- Access basic user features
- View account information
- Track smoking cessation statistics

### Coach Dashboard
- Manage assigned users
- View coaching statistics
- Access coach-specific features
- Track user progress

### Admin Dashboard
- Create new coach accounts
- View system statistics
- Access system settings
- Monitor user and coach activities
- Manage coach account creation process

## Testing - Kiểm thử

### Test User Registration Flow
1. Register as a new user
2. Verify default role is "user"
3. Access user dashboard
4. Test basic user features

### Test Coach Account Creation
1. Login as Admin
2. Create a new coach account
3. Verify coach credentials are generated
4. Test coach login with provided credentials

### Test Role-Based Access
1. Test user access restrictions
2. Test coach access permissions
3. Test admin full access
4. Verify protected routes work correctly

## Implementation Notes - Ghi chú triển khai

### Frontend Components
- `AuthContext`: Manages authentication and role-based logic
- `ProtectedRoute`: Guards routes based on user roles
- `UserDashboard`: User-specific interface
- `CoachDashboard`: Coach-specific interface
- `AdminDashboard`: Admin management interface
- `AccessDenied`: Component for unauthorized access

### Key Functions
- `login()`: Handles user authentication
- `hasRole()`: Checks user permissions
- `createCoachAccount()`: Creates new coach accounts (Admin only)

### Security Considerations
- Role-based route protection
- Component-level access control
- Mock data for testing (replace with real API calls)
- Proper error handling for unauthorized access

## Coach Account Creation Process - Quy trình tạo tài khoản Coach

### Step 1: Coach Contact - Bước 1: Coach liên lạc
- Coach sends email to Admin requesting account creation
- Coach provides qualifications, experience, and contact information
- Admin reviews the request and coach qualifications

### Step 2: Account Creation - Bước 2: Tạo tài khoản
- Admin creates coach account in the system
- System generates temporary login credentials
- Admin sends credentials to coach via email

### Step 3: Coach Access - Bước 3: Coach truy cập
- Coach receives credentials and logs in for the first time
- Coach should change password on first login
- Coach can then access coach dashboard and features

## Future Enhancements - Cải tiến tương lai

1. **Real API Integration**: Replace mock data with actual backend API calls
2. **Email Integration**: Integrate email system for coach requests
3. **Password Reset**: Implement password reset functionality for coaches
4. **Audit Logging**: Track all admin actions and system changes
5. **Advanced Role Management**: Add sub-roles and granular permissions
6. **Two-Factor Authentication**: Add 2FA for admin accounts
7. **Bulk Operations**: Allow admin to perform bulk user/coach management
8. **Reporting**: Add comprehensive reporting and analytics features 