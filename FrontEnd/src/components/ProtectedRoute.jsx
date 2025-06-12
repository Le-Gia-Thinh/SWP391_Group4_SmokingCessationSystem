import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AccessDenied from './AccessDenied';

const ProtectedRoute = ({
    children,
    allowedRoles = [],
    redirectTo = '/login',
    requireAuth = true
}) => {
    const { user, loading, hasRole } = useAuth();

    // Show loading while checking authentication - Hiển thị loading khi kiểm tra xác thực
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // If no auth required and user is logged in, redirect to home - Nếu không yêu cầu auth và user đã đăng nhập, chuyển về trang chủ
    if (!requireAuth && user) {
        return <Navigate to="/" replace />;
    }

    // If auth required but not logged in - Nếu yêu cầu auth nhưng chưa đăng nhập
    if (requireAuth && !user) {
        return <Navigate to={redirectTo} replace />;
    }

    // If specific role required - Nếu yêu cầu vai trò cụ thể
    if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
        return (
            <AccessDenied
                requiredRole={allowedRoles.join(' or ')}
                currentRole={user?.role}
            />
        );
    }

    return children;
};

export default ProtectedRoute; 