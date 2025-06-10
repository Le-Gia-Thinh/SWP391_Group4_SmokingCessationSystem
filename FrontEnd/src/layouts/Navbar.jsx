// FrontEnd/src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Avatar from "../components/Avatar";
import { useAuth } from "../contexts/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout, isCoach, isUser, isAdmin } = useAuth();

  // Handle logout - Xử lý đăng xuất
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-logo">
        <Link to="/" className="logo-text">
          QuitSmoking
        </Link>
      </div>

      <nav className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/ranking">Ranking</Link>
        <Link to="/blog">Blog</Link>
        <Link to="/membership">Membership</Link>

        {/* Show menu based on role - Hiển thị menu theo vai trò */}
        {isAdmin() && (
          <Link to="/admin-dashboard">Admin Dashboard</Link>
        )}

        {isCoach() && (
          <Link to="/coach-dashboard">Coach Dashboard</Link>
        )}

        {isUser() && (
          <Link to="/user-dashboard">User Dashboard</Link>
        )}

        <Link to="/coaches">Coaches</Link>
      </nav>

      <div className="navbar-actions">
        {!user ? (
          <>
            <Link to="/login" className="btn-outline">
              Sign in
            </Link>
            <Link to="/register" className="btn-solid">
              Sign up
            </Link>
          </>
        ) : (
          <>
            {/* Show role badge - Hiển thị badge vai trò */}
            <div className="role-badge" style={{
              background: user.role === 'admin' ? '#dc2626' :
                user.role === 'coach' ? '#10b981' : '#3b82f6',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              marginRight: '12px'
            }}>
              {user.role === 'admin' ? 'Admin' :
                user.role === 'coach' ? 'Coach' : 'User'}
            </div>

            {/* Avatar */}
            <Avatar name={user.name || user.email} avatarUrl={user.avatar} />

            {/* Logout button */}
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
