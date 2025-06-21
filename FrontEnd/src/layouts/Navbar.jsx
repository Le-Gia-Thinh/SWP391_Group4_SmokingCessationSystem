import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Space,
  Badge,
  Drawer,
} from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  TrophyOutlined,
  BookOutlined,
  TeamOutlined,
  ContactsOutlined,
  CalendarOutlined,
  BellOutlined,
  MenuOutlined,    // ← hamburger
  MoreOutlined,    // ← overflow indicator
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import "./Navbar.css";

const { Header } = Layout;

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isCoach, isAdmin } = useAuth();

  // Logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Planning click
  const handlePlanClick = async () => {
    if (!user) return navigate("/login");
    try {
      const { data } = await axios.get(
        `http://localhost:5000/api/ftnd/exists/${user.id}`,
        { withCredentials: true }
      );
      navigate(data.exists ? "/QuitPlanCalendar" : "/FtndTest");
    } catch {
      navigate("/FtndTest");
    }
  };

  // Build menu items
  const getMenuItems = () => {
    const items = [
      { key: "/", icon: <HomeOutlined />, label: "Home", onClick: () => navigate("/") },
      { key: "/plan", icon: <CalendarOutlined />, label: "Planning", onClick: handlePlanClick },
      { key: "/RankingBoard", icon: <TrophyOutlined />, label: "Ranking", onClick: () => navigate("/RankingBoard") },
      { key: "/blog", icon: <BookOutlined />, label: "Blog", onClick: () => navigate("/blog") },
      { key: "/membership", icon: <TeamOutlined />, label: "Membership", onClick: () => navigate("/membership") },
    ];

    if (!isCoach() && !isAdmin()) {
      items.push({
        key: "/book-coach",
        icon: <ContactsOutlined />,
        label: "Book Coach",
        onClick: () => navigate("/book-coach"),
      });
      if (user?.role === "member") {
        items.push({
          key: "/my-bookings",
          icon: <CalendarOutlined />,
          label: "My Bookings",
          onClick: () => navigate("/my-bookings"),
        });
      }
    }
    if (isAdmin()) {
      items.push({
        key: "/admin-dashboard",
        icon: <UserOutlined />,
        label: "Admin Dashboard",
        onClick: () => navigate("/admin-dashboard"),
      });
    }
    if (isCoach()) {
      items.push({
        key: "/coach-dashboard",
        icon: <UserOutlined />,
        label: "Coach Dashboard",
        onClick: () => navigate("/coach-dashboard"),
      });
    }
    return items;
  };

  // Active key
  const selectedKey = /^\/(QuitPlanCalendar|FtndTest|quit-plan-detail)/.test(
    location.pathname
  )
    ? "/plan"
    : location.pathname;

  return (
    <Header className="navbar">
      <div className="navbar-content">
        {/* Logo */}
        <div className="navbar-logo" onClick={() => navigate("/")}>
          <span className="logo-text">QuitSmoking</span>
        </div>

        {/* Desktop Menu */}
        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={getMenuItems()}
          className="navbar-menu"
          overflowedIndicator={<MoreOutlined />}  // ← 3 chấm ngang
        />

        {/* Hamburger (mobile only) */}
        <Button
          className="mobile-menu-button"
          type="text"
          icon={<MenuOutlined />}            // ← hamburger icon
          onClick={() => setDrawerOpen(true)}
        />

        {/* Actions */}
        <div className="navbar-actions">
          {!user ? (
            <Space>
              <Button type="link" onClick={() => navigate("/login")}>
                Sign in
              </Button>
              <Button type="primary" onClick={() => navigate("/register")}>
                Sign up
              </Button>
            </Space>
          ) : (
            <Space wrap={false}>
              <Button
                type="text"
                icon={
                  <BellOutlined style={{ fontSize: 20, color: "#52c41a" }} />
                }
                onClick={() => navigate("/notifications")}
                style={{ marginRight: 4 }}
              />
              <Badge
                count={
                  user.role === "admin"
                    ? "Admin"
                    : user.role === "coach"
                      ? "Coach"
                      : "Member"
                }
                style={{
                  backgroundColor:
                    user.role === "admin" ? "#ff4d4f" : "#52c41a",
                }}
              />
              <Avatar
                icon={<UserOutlined />}
                style={{
                  backgroundColor:
                    user.role === "admin" ? "#ff4d4f" : "#52c41a",
                  cursor: "pointer",
                }}
                onClick={() => navigate("/profile")}
              />
              <span className="username-text">
                {user.name || user.email}
              </span>
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

      {/* Drawer cho mobile */}
      <Drawer
        title="Menu"
        placement="left"
        onClose={() => setDrawerOpen(false)}
        visible={drawerOpen}
        bodyStyle={{ padding: 0 }}
      >
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={getMenuItems()}
          style={{ borderRight: 0 }}
        />
      </Drawer>
    </Header>
  );
}
