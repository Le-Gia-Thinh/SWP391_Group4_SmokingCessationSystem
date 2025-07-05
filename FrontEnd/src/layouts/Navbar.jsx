import React, { useState } from "react";
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
  MenuOutlined, // ← hamburger
  MoreOutlined, // ← overflow indicator
  ScheduleOutlined,
  FileDoneOutlined,
  MessageOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import "./Navbar.css";
import { Dropdown } from "antd";
import UserDropdownMenu from "../components/UserDropdownMenu";
import { Link } from "react-router-dom";

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
      {
        key: "/",
        icon: <HomeOutlined />,
        label: "Trang chủ",
        onClick: () => navigate("/"),
      },
      {
        key: "/plan",
        icon: <CalendarOutlined />,
        label: "Lập kế hoạch",
        onClick: handlePlanClick,
      },
      {
        key: "/RankingBoard",
        icon: <TrophyOutlined />,
        label: "Xếp hạng",
        onClick: () => navigate("/RankingBoard"),
      },
      {
        key: "/blog",
        icon: <BookOutlined />,
        label: "Blog",
        onClick: () => navigate("/blog"),
      },
      {
        key: "/chat",
        icon: <MessageOutlined />,
        label: "Chat",
        onClick: () => navigate("/chat"),
      },
      {
        key: "/membership",
        icon: <TeamOutlined />,
        label: "Thành viên",
        onClick: () => navigate("/membership"),
      },
      {
        key: "/user/stats",
        icon: <BarChartOutlined />,
        label: "Thống kê",
        onClick: () => navigate("/user/stats"),
      },
    ];

    // // Chỉ hiển thị mục 'Thành viên' cho member
    // if (user && user.role === 'member') {
    //   items.push({ key: "/membership", icon: <TeamOutlined />, label: "Thành viên", onClick: () => navigate("/membership") });
    // }

    if (!isCoach() && !isAdmin()) {
      items.push({
        key: "/book-coach",
        icon: <ContactsOutlined />,
        label: "Đặt huấn luyện viên",
        onClick: () => navigate("/book-coach"),
      });
      if (user?.role === "member") {
        items.push({
          key: "/my-bookings",
          icon: <CalendarOutlined />,
          label: "Lịch đặt của tôi",
          onClick: () => navigate("/my-bookings"),
        });
      }
    }
    if (isAdmin()) {
      items.push({
        key: "/admin-dashboard",
        icon: <UserOutlined />,
        label: "Bảng điều khiển Admin",
        onClick: () => navigate("/admin-dashboard"),
      });
      items.push({
        key: "/schedule-management",
        icon: <ScheduleOutlined />,
        label: "Quản lý Lịch",
        onClick: () => navigate("/schedule-management"),
      });
      items.push({
        key: "/post-approval",
        icon: <FileDoneOutlined />,
        label: "Quản lý Bài Viết",
        onClick: () => navigate("/post-approval"),
      });
    }
    if (isCoach()) {
      items.push({
        key: "/coach-dashboard",
        icon: <UserOutlined />,
        label: "Bảng điều khiển Huấn luyện viên",
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
          overflowedIndicator={<MoreOutlined />} // ← 3 chấm ngang
        />

        {/* Hamburger (mobile only) */}
        <Button
          className="mobile-menu-button"
          type="text"
          icon={<MenuOutlined />} // ← hamburger icon
          onClick={() => setDrawerOpen(true)}
        />

        {/* Actions */}
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
                style={{ marginRight: 4 }}
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
                  src={user.avatar_url} // ✅ truyền link avatar
                  icon={!user.avatar_url && <UserOutlined />} // fallback nếu không có ảnh
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
      </div>

      {/* Drawer cho mobile */}
      <Drawer
        title="Menu"
        placement="left"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen} // ✅ Thay visible bằng open
        styles={{ body: { padding: 0 } }} // ✅ Thay bodyStyle bằng styles.body
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
