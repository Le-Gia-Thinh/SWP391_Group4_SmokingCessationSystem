import React, { createContext, useContext, useState, useEffect } from 'react';

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

    // Login with real API - Đăng nhập với API thực tế
    const login = async (email, password) => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            if (!data.success) {
                throw new Error(data.message || 'Login failed');
            }

            // Save user to localStorage - Lưu user vào localStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            setUser(data.user);

            return data.user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    // Logout - Đăng xuất
    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
    };

    // Check permissions - Kiểm tra quyền
    const hasRole = (allowedRoles) => {
        if (!user) return false;
        return allowedRoles.includes(user.role);
    };

    // Check if is regular User - Kiểm tra là User thường
    const isUser = () => hasRole(['member', 'coach', 'admin']);

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