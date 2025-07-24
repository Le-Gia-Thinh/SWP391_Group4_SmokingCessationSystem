import React, { useState, useEffect } from "react";
import AdminStatDashboard from "../AdminManageCoach/RevenueStats";
import AdminManageCoach from "../AdminManageCoach/AdminManageCoach";
import PostApprovalContent from "../PostApproval/PostApprovalContent";
import ScheduleManagement from "../ScheduleManagement/ScheduleManagement";
import PackageCrudPage from "./PackageCrudPage";
import AdminUserManager from "./AdminUserManager";
import AdminTaskManager from "./AdminTaskManager";
import {
  Layout,
  Menu,
  Typography,
  Card,
  Button,
  Space,
  Input,
  Divider,
  Dropdown,
  Avatar,
} from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  TrophyOutlined,
  FileTextOutlined,
  ScheduleOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  SearchOutlined,
  PlusOutlined,
  FilterOutlined,
  ExportOutlined,
  ShoppingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import "./AdminPage.css";

const { Sider, Content, Header } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

const AdminPage = () => {
  const [selectedKey, setSelectedKey] = useState("revenue");
  const [collapsed, setCollapsed] = useState(false);

  // Block browser back navigation to prevent going back to main site
  useEffect(() => {
    const handlePopState = (e) => {
      // Only block if trying to go back to previous site/page
      // Allow navigation within admin panel
      const currentUrl = window.location.href;
      const isAdminRoute = currentUrl.includes("/admin");

      if (isAdminRoute) {
        // Prevent default back behavior only for admin routes
        e.preventDefault();
        // Keep user on current admin page by pushing current state again
        window.history.pushState(null, "", window.location.href);
      }
    };

    // Clear existing history and add current state to history stack
    window.history.replaceState(null, "", window.location.href);
    window.history.pushState(null, "", window.location.href);

    // Listen for back button events
    window.addEventListener("popstate", handlePopState);

    // Cleanup listeners on component unmount
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []); // Run on every mount, including route changes

  // Menu items configuration
  const menuItems = [
    {
      key: "revenue",
      icon: <BarChartOutlined />,
      label: "Thống kê",
      title: "Thống kê",
    },
    {
      key: "users",
      icon: <UserOutlined />,
      label: "Quản lý người dùng",
      title: "Quản lý người dùng",
    },
    {
      key: "coaches",
      icon: <TeamOutlined />,
      label: "Quản lý huấn luyện viên",
      title: "Quản lý huấn luyện viên",
    },
    {
      key: "packages",
      icon: <ShoppingOutlined />,
      label: "Quản lý gói",
      title: "Quản lý gói",
    },
    {
      key: "tasks",
      icon: <TrophyOutlined />,
      label: "Quản lý nhiệm vụ",
      title: "Quản lý nhiệm vụ",
    },
    {
      key: "posts",
      icon: <FileTextOutlined />,
      label: "Quản lý bài viết",
      title: "Quản lý bài viết",
    },
    {
      key: "schedules",
      icon: <ScheduleOutlined />,
      label: "Quản lý lịch trình",
      title: "Quản lý lịch trình",
    },
  ];

  const handleMenuClick = (e) => {
    setSelectedKey(e.key);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const getCurrentTitle = () => {
    const currentItem = menuItems.find((item) => item.key === selectedKey);
    return currentItem ? currentItem.title : "Thống kê doanh thu";
  };

  const renderContent = () => {
    switch (selectedKey) {
      case "revenue":
        return <AdminStatDashboard />;

      case "users":
        return <AdminUserManager />;

      case "coaches":
        return <AdminManageCoach />;

      case "packages":
        return <PackageCrudPage />;

      case "tasks":
        return <AdminTaskManager />;

      case "posts":
        return <PostApprovalContent />;

      case "schedules":
        return <ScheduleManagement />;

      default:
        return (
          <div>
            <Card>
              <Title level={3}>Trang không tồn tại</Title>
              <Text>Vui lòng chọn một mục từ menu bên trái.</Text>
            </Card>
          </div>
        );
    }
  };

  return (
    <Layout className="admin-page" style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={280}
        className="admin-sidebar admin-sidebar-enhanced"
        trigger={null} // Hide default trigger
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
          boxShadow: "4px 0 20px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Logo/Brand */}
        <div className="admin-logo">
          <div className="logo-container">
            {!collapsed ? (
              <div className="logo-full">
                <div className="logo-icon">
                  <DashboardOutlined />
                </div>
                <div className="logo-text">
                  <Title level={4} style={{ color: "#fff", margin: 0 }}>
                    QuitSmoking
                  </Title>
                  <Text
                    style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}
                  >
                    Admin Panel
                  </Text>
                </div>
              </div>
            ) : (
              <div className="logo-collapsed">
                <DashboardOutlined
                  style={{ fontSize: "24px", color: "#fff" }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={handleMenuClick}
          className="admin-menu admin-menu-animated"
          style={{
            background: "transparent",
            borderRight: 0,
            paddingTop: "20px",
            paddingBottom: "20px",
          }}
        >
          {menuItems.map((item, index) => (
            <Menu.Item
              key={item.key}
              icon={item.icon}
              className="menu-item admin-menu-item-enhanced"
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {item.label}
            </Menu.Item>
          ))}

          <Menu.Divider style={{ backgroundColor: "rgba(255,255,255,0.2)" }} />

          <Menu.Item
            key="logout"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            className="menu-item logout-item admin-logout-enhanced"
          >
            Đăng xuất
          </Menu.Item>

          {/* Custom Collapse Button */}
          <div className="admin-collapse-button-container">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="admin-custom-collapse-btn"
              style={{
                width: "100%",
                height: "48px",
                color: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
                marginTop: "8px",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {!collapsed && "Thu gọn"}
            </Button>
          </div>
        </Menu>
      </Sider>

      <Layout
        style={{
          marginLeft: collapsed ? 80 : 280,
          transition: "all 0.3s ease",
          backgroundColor: "#f5f7fa",
        }}
      >
        {/* Header */}
        <Header className="admin-header">
          <div className="header-content">
            <div className="header-left">
              <Title level={3} style={{ margin: 0, color: "#1890ff" }}>
                {getCurrentTitle()}
              </Title>
            </div>

            <div className="header-right">
              <Space size="large">
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: "profile",
                        icon: <UserOutlined />,
                        label: "Hồ sơ",
                      },
                      {
                        type: "divider",
                      },
                      {
                        key: "logout",
                        icon: <LogoutOutlined />,
                        label: "Đăng xuất",
                        onClick: handleLogout,
                      },
                    ],
                    onClick: ({ key }) => {
                      if (key === "profile") {
                        window.location.href = "/profile";
                      }
                    },
                  }}
                >
                  <div className="user-info">
                    <Avatar
                      style={{
                        backgroundColor: "#1890ff",
                        cursor: "pointer",
                      }}
                      icon={<UserOutlined />}
                    />
                    <div className="user-details">
                      <Text strong style={{ color: "#1890ff" }}>
                        Admin
                      </Text>
                      <Text
                        type="secondary"
                        style={{ fontSize: "12px", display: "block" }}
                      >
                        Quản trị viên
                      </Text>
                    </div>
                  </div>
                </Dropdown>
              </Space>
            </div>
          </div>
        </Header>

        {/* Main Content */}
        <Content className="admin-content admin-content-animated">
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminPage;
