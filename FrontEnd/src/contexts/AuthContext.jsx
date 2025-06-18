import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export { useAuth };

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is logged in when app loads - Kiểm tra user đã đăng nhập chưa khi load app
   useEffect(() => {
  const storedUser = localStorage.getItem('user');
  const token = localStorage.getItem('token');

  if (storedUser && token) {
    setUser(JSON.parse(storedUser));
    setLoading(false);
  } else {
    // Gọi backend để lấy user nếu chưa có local
    const fetchUser = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/user/me', {
          headers: {
            Authorization: `Bearer ${token}`, // ✅ QUAN TRỌNG
          },
        });

        if (!res.ok) throw new Error("Không lấy được user");

        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user)); // ✅ phải là data.user
      } catch (err) {
        console.error("❌ Lỗi khi gọi /api/user/me:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    }
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

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Login failed');
        }

        // Lưu token
        localStorage.setItem('token', data.token);

        // Gọi /api/user/me để lấy thông tin đầy đủ
        const userRes = await fetch('http://localhost:5000/api/user/me', {
            headers: {
                Authorization: `Bearer ${data.token}`
            }
        });

        const userData = await userRes.json();

        if (!userRes.ok || !userData.user) {
            throw new Error('Không lấy được thông tin chi tiết người dùng');
        }

        // Lưu đầy đủ user vào localStorage
        localStorage.setItem('user', JSON.stringify(userData.user));
        setUser(userData.user);

        return userData.user;
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

    console.log("👤 user in Profile.jsx:", user);
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 