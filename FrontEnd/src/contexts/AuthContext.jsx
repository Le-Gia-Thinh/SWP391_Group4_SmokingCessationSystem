import React, { createContext, useContext, useState, useEffect } from 'react';

// MockData for User and Coach - Dữ liệu mẫu cho User và Coach
// Note: 
// - User accounts: Self-registered by users
// - Coach accounts: Created by Admin and provided to coaches
// - Admin accounts: System accounts
// Lưu ý:
// - Tài khoản User: Tự đăng ký bởi user
// - Tài khoản Coach: Được Admin tạo và cung cấp cho coach
// - Tài khoản Admin: Tài khoản hệ thống
const mockUsers = {
    user: {
        id: 1,
        email: 'user@example.com',
        name: 'John Doe',
        role: 'user',
        coach_id: null,
        account_status: 'active',
        registration_type: 'self', // User tự đăng ký
        created_at: '2024-01-01'
    },
    coach: {
        id: 2,
        email: 'coach@example.com',
        name: 'Coach Sarah Wilson',
        role: 'coach',
        coach_id: 1,
        account_status: 'active',
        registration_type: 'admin_created', // Được Admin tạo
        created_by_admin: 'admin@example.com',
        created_at: '2024-01-05',
        specialization: 'Smoking Cessation',
        experience_years: 5,
        verified: true,
        // Admin provided these credentials to the coach
        // Admin đã cung cấp thông tin đăng nhập này cho coach
        provided_credentials: {
            email: 'coach@example.com',
            temporary_password: 'Coach123!' // Coach sẽ đổi mật khẩu lần đầu đăng nhập
        }
    },
    admin: {
        id: 3,
        email: 'admin@example.com',
        name: 'System Administrator',
        role: 'admin',
        coach_id: null,
        account_status: 'active',
        registration_type: 'system', // Tài khoản hệ thống
        created_at: '2024-01-01'
    }
};

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is logged in when app loads - Kiểm tra user đã đăng nhập chưa khi load app
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    // Login with MockData - Đăng nhập với dữ liệu mẫu
    const login = async (email, password) => {
        // Simulate API call delay - Giả lập độ trễ API
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock login logic - Logic đăng nhập mẫu
        let userData = null;

        if (email === 'user@example.com' && password === '123456') {
            userData = mockUsers.user;
        } else if (email === 'coach@example.com' && password === '123456') {
            userData = mockUsers.coach;
        } else if (email === 'admin@example.com' && password === '123456') {
            userData = mockUsers.admin;
        } else {
            throw new Error('Invalid email or password');
        }

        // Save user to localStorage - Lưu user vào localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        return userData;
    };

    // Logout - Đăng xuất
    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    // Check permissions - Kiểm tra quyền
    const hasRole = (allowedRoles) => {
        if (!user) return false;
        return allowedRoles.includes(user.role);
    };

    // Check if is regular User - Kiểm tra là User thường
    const isUser = () => hasRole(['user', 'coach', 'admin']);

    // Check if is Coach - Kiểm tra là Coach
    const isCoach = () => hasRole(['coach']);

    // Check if is Admin - Kiểm tra là Admin
    const isAdmin = () => hasRole(['admin']);

    // Admin function: Create coach account - Hàm Admin: Tạo tài khoản coach
    const createCoachAccount = async (coachData) => {
        // Simulate API call to create coach account
        await new Promise(resolve => setTimeout(resolve, 1000));

        // In real system, this would create a new coach account
        // Trong hệ thống thực tế, điều này sẽ tạo tài khoản coach mới
        console.log('Creating coach account:', coachData);

        return {
            success: true,
            message: 'Coach account created successfully. Credentials have been sent to the coach.',
            coachCredentials: {
                email: coachData.email,
                temporaryPassword: 'Coach' + Math.random().toString(36).substr(2, 6) + '!'
            }
        };
    };

    const value = {
        user,
        login,
        logout,
        hasRole,
        isUser,
        isCoach,
        isAdmin,
        createCoachAccount,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 