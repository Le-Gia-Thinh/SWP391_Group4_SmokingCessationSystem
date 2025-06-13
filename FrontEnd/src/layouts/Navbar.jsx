// FrontEnd/src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Button, Avatar, Space, Typography, Badge } from "antd";
import { UserOutlined, LogoutOutlined, HomeOutlined, TrophyOutlined, BookOutlined, TeamOutlined, CalendarOutlined } from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import "./Navbar.css";

const { Header } = Layout;
const { Text } = Typography;

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isCoach, isAdmin } = useAuth();

  // Handle logout - Xử lý đăng xuất
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Menu items based on user role
  const getMenuItems = () => {
    const items = [
      {
        key: '/',
        icon: <HomeOutlined />,
        label: <Link to="/">Home</Link>,
      },
      {
        key: '/ranking',
        icon: <TrophyOutlined />,
        label: <Link to="/ranking">Ranking</Link>,
      },
      {
        key: '/blog',
        icon: <BookOutlined />,
        label: <Link to="/blog">Blog</Link>,
      },
      {
        key: '/membership',
        icon: <TeamOutlined />,
        label: <Link to="/membership">Membership</Link>,
      },
    ];

    // Only show "Book Coach" if user is not a coach
    if (!isCoach()) {
      items.push({
        key: '/book-coach',
        icon: <CalendarOutlined />,
        label: <Link to="/book-coach">Book Coach</Link>,
      });
    }

    // Add role-specific items
    if (isAdmin()) {
      items.push({
        key: '/admin-dashboard',
        icon: <UserOutlined />,
        label: <Link to="/admin-dashboard">Admin Dashboard</Link>,
      });
    }

    if (isCoach()) {
      items.push({
        key: '/coach-dashboard',
        icon: <UserOutlined />,
        label: <Link to="/coach-dashboard">Coach Dashboard</Link>,
      });
    }

    items.push({
      key: '/coaches',
      icon: <TeamOutlined />,
      label: <Link to="/coaches">Coaches</Link>,
    });

    return items;
  };

  return (
    <Header className="navbar">
      <div className="navbar-content">
        <div className="navbar-logo">
          <div className="logo-text">
            <span>
              QuitSmoking
            </span>
          </div>
        </div>

        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          className="navbar-menu"
        />

        <div className="navbar-actions">
          {!user ? (
            <Space>
              <Button type="link">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button type="primary">
                <Link to="/register" style={{ color: 'white' }}>Sign up</Link>
              </Button>
            </Space>
          ) : (
            <Space wrap={false}>
              {/* Show role badge */}
              <Badge
                count={user.role === 'admin' ? 'Admin' : user.role === 'coach' ? 'Coach' : 'Member'}
                style={{
                  backgroundColor: user.role === 'admin' ? '#ff4d4f' :
                    user.role === 'coach' ? '#52c41a' : '#52c41a',
                }}
              />

              {/* Avatar */}
              <Avatar
                icon={<UserOutlined />}
                style={{
                  backgroundColor: user.role === 'admin' ? '#ff4d4f' :
                    user.role === 'coach' ? '#52c41a' : '#52c41a',
                }}
              />

              <span className="username-text">{user.name || user.email}</span>

              {/* Logout button */}
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                danger
              >
                Logout
              </Button>
            </Space>
          )}
        </div>
      </div>
    </Header>
  );
};

export default Navbar;
