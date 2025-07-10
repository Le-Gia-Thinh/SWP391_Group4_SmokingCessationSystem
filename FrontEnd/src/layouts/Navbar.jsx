// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
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
  MenuOutlined,
  MoreOutlined,
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

const { Header } = Layout;

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false); // trạng thái mở Drawer (menu mobile)
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isCoach, isAdmin } = useAuth();
  const [membership, setMembership] = useState(null); // lưu subscription hiện tại

  // Hàm logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Khi user thay đổi, gọi API lấy subscription active
  useEffect(() => {
    if (!user) {
      setMembership(null);
      return;
    }
    const token = localStorage.getItem("token");
    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    axios
      .get(`${baseURL}/api/subscriptions/current`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => setMembership(data.subscription))
      .catch(() => setMembership(null));
  }, [user]);

  // Hàm xử lý khi click “Lập kế hoạch”
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

  // Tạo danh sách các mục menu
  const getMenuItems = () => {
    const items = [
      { key: "/", icon: <HomeOutlined />, label: "Trang chủ", onClick: () => navigate("/") },
      { key: "/plan", icon: <CalendarOutlined />, label: "Lập kế hoạch", onClick: handlePlanClick },
      { key: "/RankingBoard", icon: <TrophyOutlined />, label: "Xếp hạng", onClick: () => navigate("/RankingBoard") },
      { key: "/blog", icon: <BookOutlined />, label: "Blog", onClick: () => navigate("/blog") },
      { key: "/chat", icon: <MessageOutlined />, label: "Chat", onClick: () => navigate("/chat") },
      { key: "/user/stats", icon: <BarChartOutlined />, label: "Thống kê", onClick: () => navigate("/user/stats") },
    ];

    // Nếu user là member thì thêm mục “Thành viên”
    if (user && user.role === 'member') {
      items.push({
        key: "/membership",
        icon: <TeamOutlined />,
        label: "Thành viên",
        onClick: () => navigate("/membership"),
      });
    }

    // Các menu chung cho tất cả user (ngoại trừ coach/admin)
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

    // Menu riêng cho admin
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

    // Menu riêng cho coach
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

  // Xác định mục đang active dựa trên URL
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

        {/* Menu chính (desktop) */}
        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={getMenuItems()}
          className="navbar-menu"
          overflowedIndicator={<MoreOutlined />}
        />

        {/* Nút hamburger (mobile) */}
        <Button
          className="mobile-menu-button"
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setDrawerOpen(true)}
        />

        {/* Khu vực user actions */}
        <div className="navbar-actions">
          {!user ? (
            // Nếu chưa đăng nhập
            <Space>
              <Button type="link" onClick={() => navigate("/login")}>Đăng nhập</Button>
              <Button type="primary" onClick={() => navigate("/register")}>Đăng ký</Button>
            </Space>
          ) : (
            // Nếu đã đăng nhập
            <Space wrap={false}>
              {/* Thông báo */}
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: 20, color: "#52c41a" }} />}
                onClick={() => navigate("/notifications")}
                style={{ marginRight: 4 }}
              />

              {/* Hiển thị badge gói thành viên */}
              <Badge
                count={
                  membership
                    // Nếu có gói active, show “Premium X tháng”
                    ? `Premium ${Math.ceil(
                      (new Date(membership.end_date) - new Date()) /
                      (1000 * 60 * 60 * 24 * 30)
                    )} tháng`
                    // Ngược lại show role mặc định
                    : user.role === "admin"
                      ? "Quản trị viên"
                      : user.role === "coach"
                        ? "Huấn luyện viên"
                        : "Thành viên"
                }
                style={{
                  backgroundColor: membership
                    ? "#52c41a"
                    : user.role === "admin"
                      ? "#ff4d4f"
                      : "#52c41a",
                }}
              />

              {/* Avatar + dropdown */}
              <Dropdown popupRender={() => <UserDropdownMenu />} placement="bottomRight" trigger={["click"]}>
                <Avatar
                  src={user.avatar_url}
                  icon={!user.avatar_url && <UserOutlined />}
                  style={{
                    backgroundColor: user.role === "admin" ? "#ff4d4f" : "#52c41a",
                    cursor: "pointer",
                  }}
                />
              </Dropdown>

              {/* Tên người dùng */}
              <span className="username-text">{user.name || user.email}</span>

              {/* Nút Logout */}
              <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} danger>
                Logout
              </Button>
            </Space>
          )}
        </div>
      </div>

      {/* Drawer (menu mobile) */}
      <Drawer
        title="Menu"
        placement="left"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
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