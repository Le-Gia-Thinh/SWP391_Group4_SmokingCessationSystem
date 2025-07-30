import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AccessDenied from "./AccessDenied";
import PremiumConfirmationModal from "./PremiumConfirmationModal";

const ProtectedRoute = ({
  children,
  allowedRoles = [],
  redirectTo = "/login",
  requireAuth = true,
  requirePremium = false,
}) => {
  const { user, loading, hasRole, isPremium } = useAuth();
  const navigate = useNavigate();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If no auth required and user is logged in, redirect to home
  if (!requireAuth && user) {
    return <Navigate to="/" replace />;
  }

  // If auth required but not logged in
  if (requireAuth && !user) {
    return <Navigate to={redirectTo} replace />;
  }

  // If specific role required
  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return (
      <AccessDenied
        requiredRole={allowedRoles.join(" or ")}
        currentRole={user?.role}
      />
    );
  }

  // Check for premium requirement
  if (requirePremium && user.role === "member" && !isPremium) {
    return (
      <>
        <PremiumConfirmationModal
          visible={true}
          onConfirm={() => {
            navigate("/checkout");
          }}
          onCancel={() => {
            // Navigate back to home page or previous safe page
            navigate("/", { replace: true });
          }}
        />
        {/* Show a loading state while modal is displayed */}
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang kiểm tra quyền truy cập...</p>
          </div>
        </div>
      </>
    );
  }

  return children;
};

export default ProtectedRoute;