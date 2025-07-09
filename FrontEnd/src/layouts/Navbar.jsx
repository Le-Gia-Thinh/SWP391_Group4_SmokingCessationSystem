import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Button, Avatar, Space, Badge, Drawer } from "antd";
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
  MenuOutlined,
  MoreOutlined,
  ScheduleOutlined,
  FileDoneOutlined,
  MessageOutlined,
  BarChartOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import "./Navbar.css";
import { Dropdown } from "antd";
import UserDropdownMenu from "../components/UserDropdownMenu";

const { Header } = Layout;

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resizeKey, setResizeKey] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isCoach, isAdmin } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      setResizeKey((prev) => prev + 1);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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

  const getMenuItems = () => {
    // Nếu là member (không phải coach, không phải admin)
    if (!isCoach() && !isAdmin()) {
      const items = [
        {
          key: "/",
          icon: <HomeOutlined />,
          label: "Trang chủ",
          onClick: () => navigate("/"),
        },
        {
          key: "/plan",
          icon: <CalendarOutlined />,
          label: "Lộ trình cai thuốc", // hoặc "Lập kế hoạch cai"
          onClick: handlePlanClick,
        },
        {
          key: "/RankingBoard",
          icon: <TrophyOutlined />,
          label: "Bảng xếp hạng",
          onClick: () => navigate("/RankingBoard"),
        },
        {
          key: "/community",
          icon: <TeamOutlined />,
          label: "Cộng đồng",
          onClick: () => navigate("/community"),
        },
        {
          key: "/membership",
          icon: <UsergroupAddOutlined />,
          label: "Gói thành viên",
          onClick: () => navigate("/membership"),
        },
        {
          key: "/user/stats",
          icon: <BarChartOutlined />,
          label: "Bảng thống kê",
          onClick: () => navigate("/user/stats"),
        },
        {
          key: "/book-coach",
          icon: <ContactsOutlined />,
          label: "Đặt lịch tư vấn",
          onClick: () => navigate("/book-coach"),
        },
        {
          key: "/my-bookings",
          icon: <CalendarOutlined />,
          label: "Quản lý lịch",
          onClick: () => navigate("/my-bookings"),
        },
      ];
      return items;
    }

    // Nếu là admin
    if (isAdmin()) {
      return [
        {
          key: "/",
          icon: <HomeOutlined />,
          label: "Trang chủ",
          onClick: () => navigate("/"),
        },
        {
          key: "/RankingBoard",
          icon: <TrophyOutlined />,
          label: "Bảng xếp hạng",
          onClick: () => navigate("/RankingBoard"),
        },
        {
          key: "/community",
          icon: <TeamOutlined />,
          label: "Cộng đồng",
          onClick: () => navigate("/community"),
        },
        {
          key: "/membership",
          icon: <UsergroupAddOutlined />,
          label: "Gói thành viên",
          onClick: () => navigate("/membership"),
        },
        {
          key: "/user/stats",
          icon: <BarChartOutlined />,
          label: "Bảng thống kê",
          onClick: () => navigate("/user/stats"),
        },
        {
          key: "/admin-dashboard",
          icon: <UserOutlined />,
          label: "Quản lý Coach",
          onClick: () => navigate("/admin-dashboard"),
        },
        {
          key: "/schedule-management",
          icon: <ScheduleOutlined />,
          label: "Quản lý lịch tư vấn",
          onClick: () => navigate("/schedule-management"),
        },
      ];
    }

    // Nếu là coach
    if (isCoach()) {
      return [
        {
          key: "/",
          icon: <HomeOutlined />,
          label: "Trang chủ",
          onClick: () => navigate("/"),
        },
        {
          key: "/RankingBoard",
          icon: <TrophyOutlined />,
          label: "Bảng xếp hạng",
          onClick: () => navigate("/RankingBoard"),
        },
        {
          key: "/community",
          icon: <TeamOutlined />,
          label: "Cộng đồng",
          onClick: () => navigate("/community"),
        },
        {
          key: "/coach-dashboard",
          icon: <UserOutlined />,
          label: "Tổng quan Huấn luyện viên",
          onClick: () => navigate("/coach-dashboard"),
        },
      ];
    }

    // Nếu chưa đăng nhập
    return [
      {
        key: "/",
        icon: <HomeOutlined />,
        label: "Trang chủ",
        onClick: () => navigate("/"),
      },
      {
        key: "/plan",
        icon: <CalendarOutlined />,
        label: "Lộ trình cai thuốc",
        onClick: handlePlanClick,
      },
      {
        key: "/RankingBoard",
        icon: <TrophyOutlined />,
        label: "Bảng xếp hạng",
        onClick: () => navigate("/RankingBoard"),
      },
      {
        key: "/community",
        icon: <TeamOutlined />,
        label: "Cộng đồng",
        onClick: () => navigate("/community"),
      },
    ];
  };

  const selectedKey = /^\/(QuitPlanCalendar|FtndTest|quit-plan-detail)/.test(
    location.pathname
  )
    ? "/plan"
    : location.pathname;

  return (
    <Header className="navbar">
      <div className="navbar-content">
        <div className="navbar-left">
          <div className="navbar-logo" onClick={() => navigate("/")}>
            <span className="logo-text">QuitSmoking</span>
          </div>
          <Menu
            key={resizeKey}
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={getMenuItems()}
            className="navbar-menu"
            overflowedIndicator={<MoreOutlined />}
          />
        </div>

        <div className="navbar-actions">
          {!user ? (
            <Space>
              <Button type="link" onClick={() => navigate("/login")}>
                Đăng nhập
              </Button>
              <Button type="primary" onClick={() => navigate("/register")}>
                Đăng ký
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
              />
              <Badge
                count={
                  user.role === "admin"
                    ? "Quản trị viên"
                    : user.role === "coach"
                      ? "Huấn luyện viên"
                      : "Thành viên"
                }
                style={{
                  backgroundColor:
                    user.role === "admin" ? "#ff4d4f" : "#52c41a",
                }}
              />
              <Dropdown
                popupRender={() => <UserDropdownMenu />}
                placement="bottomRight"
                trigger={["click"]}
              >
                <Avatar
                  src={user.avatar_url}
                  icon={!user.avatar_url && <UserOutlined />}
                  style={{
                    backgroundColor:
                      user.role === "admin" ? "#ff4d4f" : "#52c41a",
                    cursor: "pointer",
                  }}
                />
              </Dropdown>
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

        <Button
          className="mobile-menu-button"
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setDrawerOpen(true)}
        />

        <Drawer
          title="Menu"
          placement="left"
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          styles={{ body: { padding: 0 } }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={getMenuItems()}
            style={{ borderRight: 0 }}
          />
        </Drawer>
      </div>
    </Header>
  );
}
