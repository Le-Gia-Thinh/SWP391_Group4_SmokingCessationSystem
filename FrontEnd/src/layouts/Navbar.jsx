import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Button, Avatar, Space, Badge, Drawer } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  TrophyOutlined,
  TeamOutlined,
  CalendarOutlined,
  BarChartOutlined,
  ContactsOutlined,
  MenuOutlined,
  BellOutlined,
  ScheduleOutlined,
  FileDoneOutlined,
  MoreOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import "./Navbar.css";
import UserDropdownMenu from "../components/UserDropdownMenu";

const { Header } = Layout;

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isCoach, isAdmin } = useAuth();
  const [remainingDays, setRemainingDays] = useState(null);

  // Logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Lấy remaining_days từ /current
  useEffect(() => {
    if (!user) {
      setRemainingDays(null);
      return;
    }

    const token = localStorage.getItem("token");
    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";

    axios
      .get(`${baseURL}/api/subscriptions/current`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => {
        const sub = data.subscription;
        setRemainingDays(sub ? sub.remaining_days : 0);
      })
      .catch(() => setRemainingDays(null));
  }, [user]);

  // Kiểm tra FTND trước khi navigate đến QuitPlanCalendar
  const checkFTNDBeforeNavigation = async () => {
    console.log("🔍 Checking FTND before navigation...");

    if (!user?.id) {
      // User chưa đăng nhập -> yêu cầu đăng nhập trước
      console.log("❌ User chưa đăng nhập, chuyển đến login");
      navigate("/login");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      console.log("📡 Calling FTND API for user:", user.id);

      const response = await axios.get(
        `http://localhost:5000/api/customer/ftnd-level/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("📊 FTND API response:", response.data);

      if (response.data.ftnd_level) {
        // Đã có FTND test -> cho phép vào QuitPlanCalendar
        console.log("✅ FTND có rồi, chuyển đến QuitPlanCalendar");
        navigate("/QuitPlanCalendar");
      } else {
        // Chưa có FTND test -> chuyển đến FTND test
        console.log("⚠️ Chưa có FTND, chuyển đến FtndTest");
        navigate("/FtndTest");
      }
    } catch (error) {
      console.error("❌ Lỗi kiểm tra FTND:", error);
      // Nếu có lỗi, vẫn chuyển đến FTND test để user làm
      console.log("🔄 Có lỗi, chuyển đến FtndTest");
      navigate("/FtndTest");
    }
  };
  const getMenuItems = () => {
    
    if (!user) {
      // Chưa đăng nhập -> chỉ hiển thị trang chủ và đăng nhập
      return [
        {
          key: "/",
          icon: <HomeOutlined />,
          label: "Trang chủ",
          onClick: () => navigate("/"),
        },
        {
          key: "/QuitPlanCalendar",
          icon: <CalendarOutlined />,
          label: "Lộ trình cai thuốc",
          onClick: () => checkFTNDBeforeNavigation(),
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
    }
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
          key: "/checkout",
          icon: <TeamOutlined />,
          label: "Gói thành viên",
          onClick: () => navigate("/checkout"),
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
          key: "/admin/packages",
          icon: <BookOutlined />,
          label: "Quản lý gói",
          onClick: () => navigate("/admin/packages"),
        },
        {
          key: "/schedule-management",
          icon: <ScheduleOutlined />,
          label: "Quản lý lịch tư vấn",
          onClick: () => navigate("/schedule-management"),
        },
        {
          key: "/post-approval",
          icon: <FileDoneOutlined />,
          label: "Duyệt bài",
          onClick: () => navigate("/post-approval"),
        },
        {
          key: "/admin/revenue-stats",
          icon: <BarChartOutlined />,
          label: "Thống kê doanh thu",
          onClick: () => navigate("/admin/revenue-stats"),
        },
      ];
    }
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
    // Member thông thường
    return [
      {
        key: "/",
        icon: <HomeOutlined />,
        label: "Trang chủ",
        onClick: () => navigate("/"),
      },
      {
        key: "/QuitPlanCalendar",
        icon: <CalendarOutlined />,
        label: "Lộ trình cai thuốc",
        onClick: () => checkFTNDBeforeNavigation(),
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
        key: "/checkout",
        icon: <TeamOutlined />,
        label: "Gói thành viên",
        onClick: () => navigate("/checkout"),
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
  };

  // determine active key
  const selectedKey = location.pathname;

  // build badge text & color
  const badgeText =
    remainingDays && remainingDays > 0
      ? remainingDays < 30
        ? `Premium ${remainingDays} ngày`
        : `Premium ${Math.floor(remainingDays / 30)} tháng`
      : user?.role === "admin"
      ? "Quản trị viên"
      : user?.role === "coach"
      ? "Huấn luyện viên"
      : "Thành viên";
  const badgeColor =
    remainingDays && remainingDays > 0
      ? "#52c41a"
      : user?.role === "admin"
      ? "#ff4d4f"
      : "#52c41a";

  return (
    <Header className="navbar">
      <div className="navbar-content">
        <div className="navbar-logo" onClick={() => navigate("/")}>
          <span className="logo-text">QuitSmoking</span>
        </div>

        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={getMenuItems()}
          className="navbar-menu"
          overflowedIndicator={<MoreOutlined />}
        />

        <Button
          className="mobile-menu-button"
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setDrawerOpen(true)}
        />

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
              <Avatar
                icon={<UserOutlined />}
                style={{
                  backgroundColor:
                    user.role === "admin" ? "#ff4d4f" : "#52c41a",
                  cursor: "pointer",
                }}
              />
              <Badge
                count={badgeText}
                style={{ backgroundColor: badgeColor }}
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

      <Drawer
        title="Menu"
        placement="left"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
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
