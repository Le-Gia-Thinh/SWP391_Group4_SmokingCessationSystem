import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Space,
  Popover,
  Descriptions,
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
} from "@ant-design/icons";
import axios from "axios";
import "./Navbar.css";

const { Header } = Layout;

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  // 📌 Fetch user info
  const fetchUser = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/user/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        withCredentials: true,
      });
      setUser(res.data);
    } catch (err) {
      console.error("❌ Lỗi fetch /me:", err);
      setUser(null);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  const isAdmin = () => user?.role === "admin";
  const isCoach = () => user?.role === "coach";

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

    if (!isCoach()) {
      items.push({
        key: "/book-coach",
        icon: <ContactsOutlined />,
        label: "Book Coach",
        onClick: () => navigate("/book-coach"),
      });

      // Add "My Bookings" for members
      if (user && user.role === "member") {
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

    items.push({
      key: "/coaches",
      icon: <TeamOutlined />,
      label: "Coaches",
      onClick: () => navigate("/coaches"),
    });

    return items;
  };

  const userInfoPopover = (
    <Descriptions
      title={user?.name || user?.username || "Người dùng"}
      size="small"
      column={1}
      bordered
      labelStyle={{ fontWeight: 600 }}
    >
      <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
      <Descriptions.Item label="SĐT">{user?.phone_number}</Descriptions.Item>
      <Descriptions.Item label="Ngày đăng ký">
        {user?.registration_date?.slice(0, 10)}
      </Descriptions.Item>
      <Descriptions.Item label="Vai trò">{user?.role}</Descriptions.Item>
      <Descriptions.Item label="FTND Level">
        {user?.ftnd_level}
      </Descriptions.Item>
      <Descriptions.Item label="Tổng điểm">
        {user?.total_points} 🪙
      </Descriptions.Item>
      <Descriptions.Item label="Cấp độ">
        {user?.current_level}
      </Descriptions.Item>
      <Descriptions.Item label="Thao tác">
        <Button icon={<LogoutOutlined />} danger type="text" onClick={logout}>
          Đăng xuất
        </Button>
      </Descriptions.Item>
    </Descriptions>
  );

  return (
    <Header className="navbar">
      <div className="navbar-content">
        <div
          className="navbar-logo"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
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
          {!user?.id ? (
            <Space>
              <Button type="link" onClick={() => navigate("/login")}>
                Sign in
              </Button>
              <Button type="primary" onClick={() => navigate("/register")}>
                Sign up
              </Button>
            </Space>
          ) : (
            <Popover
              content={userInfoPopover}
              trigger="click"
              placement="bottomRight"
            >
              <Space wrap={false} align="center" style={{ cursor: "pointer" }}>
                <Avatar
                  icon={<UserOutlined />}
                  style={{ backgroundColor: "#52c41a" }}
                />
                <span
                  style={{
                    fontWeight: 600,
                    marginLeft: 8,
                    fontSize: 15,
                    color: "#fff",
                  }}
                >
                  {user?.name || user?.email || "Người dùng"}
                </span>
              </Space>
            </Popover>
          )}
        </div>
      </div>
    </Header>
  );
}
