// FrontEnd/src/components/Navbar.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Button, Avatar, Space, Badge } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  TrophyOutlined,
  BookOutlined,
  TeamOutlined,
  ContactsOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import "./Navbar.css";

const { Header } = Layout;

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isCoach, isAdmin } = useAuth();

  // Logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Khi click Plan: nếu chưa login → /login, nếu đã login check FTND → điều hướng
  const handlePlanClick = async () => {
    if (!user) {
      return navigate("/login");
    }
    try {
      const res = await axios.get(
        `http://localhost:5000/api/ftnd/exists/${user.id}`,
        { withCredentials: true }
      );
      if (res.data.exists) {
        navigate("/QuitPlanCalendar");
      } else {
        navigate("/FtndTest");
      }
    } catch (err) {
      console.error(err);
      navigate("/FtndTest");
    }
  };

  // Các mục menu
  const getMenuItems = () => {
    const items = [
      {
        key: "/",
        icon: <HomeOutlined />,
        label: "Home",
        onClick: () => navigate("/"),
      },
      {
        key: "/plan",
        icon: <CalendarOutlined />,
        label: "Planing",
        onClick: handlePlanClick,
      },
      {
        key: "/RankingBoard",
        icon: <TrophyOutlined />,
        label: "Ranking",
        onClick: () => navigate("/RankingBoard"),
      },
      {
        key: "/blog",
        icon: <BookOutlined />,
        label: "Blog",
        onClick: () => navigate("/blog"),
      },
      {
        key: "/membership",
        icon: <TeamOutlined />,
        label: "Membership",
        onClick: () => navigate("/membership"),
      },
    ];

    // Chỉ hiển thị "Book Coach" nếu không phải là Coach
    if (!isCoach()) {
      items.push({
        key: "/book-coach",
        icon: <ContactsOutlined />,
        label: "Book Coach",
        onClick: () => navigate("/book-coach"),
      });
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
    items.push({
      key: "/coaches",
      icon: <TeamOutlined />,
      label: "Coaches",
      onClick: () => navigate("/coaches"),
    });

    return items;
  };

  return (
    <Header className="navbar">
      <div className="navbar-content">
        <div className="navbar-logo">
          <div className="logo-text">
            <span>QuitSmoking</span>
          </div>
        </div>

        <Menu
          mode="horizontal"
          selectedKeys={[
            /^\/(QuitPlanCalendar|FtndTest|quit-plan-detail)/.test(
              location.pathname
            )
              ? "/plan"
              : location.pathname,
          ]}
          items={getMenuItems()}
          className="navbar-menu"
        />

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
                }}
              />
              <span className="username-text">{user.name || user.email}</span>
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
}
