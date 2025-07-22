import React, { useState } from "react";
import AdminStatDashboard from "../AdminManageCoach/RevenueStats";
import AdminManageCoach from "../adminManageCoach/adminManageCoach";
import PostApprovalContent from "../PostApproval/PostApprovalContent";
import ScheduleManagementContent from "../ScheduleManagement/ScheduleManagementContent";
import {
  Layout,
  Menu,
  Typography,
  Card,
  Button,
  Space,
  Input,
  DatePicker,
  Switch,
  Tooltip,
  Divider,
  Badge,
  Dropdown,
  Avatar,
  Row,
  Col,
} from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  TrophyOutlined,
  FileTextOutlined,
  ScheduleOutlined,
  BarChartOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  SearchOutlined,
  PlusOutlined,
  FilterOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import "./AdminPage.css";

const { Sider, Content, Header } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

const AdminPage = () => {
  const [selectedKey, setSelectedKey] = useState("revenue");
  const [collapsed, setCollapsed] = useState(false);

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
    {
      key: "notifications",
      icon: <BellOutlined />,
      label: "Thông báo",
      title: "Quản lý thông báo",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Cài đặt",
      title: "Cài đặt hệ thống",
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
        return (
          <div className="users-container">
            <Card>
              <div className="page-header">
                <Title level={3}>
                  <UserOutlined style={{ marginRight: 8 }} />
                  Quản lý người dùng
                </Title>
                <Space>
                  <Search
                    placeholder="Tìm kiếm người dùng..."
                    style={{ width: 300 }}
                  />
                  <Button icon={<FilterOutlined />}>Lọc</Button>
                  <Button type="primary" icon={<PlusOutlined />}>
                    Thêm người dùng
                  </Button>
                </Space>
              </div>
              <Divider />
              <Text>
                Tính năng quản lý người dùng sẽ được triển khai ở đây.
              </Text>
            </Card>
          </div>
        );

      case "coaches":
        return <AdminManageCoach />;

      case "tasks":
        return (
          <div className="tasks-container">
            <Card>
              <div className="page-header">
                <Title level={3}>
                  <TrophyOutlined style={{ marginRight: 8 }} />
                  Quản lý nhiệm vụ
                </Title>
                <Space>
                  <Search
                    placeholder="Tìm kiếm nhiệm vụ..."
                    style={{ width: 300 }}
                  />
                  <Button icon={<FilterOutlined />}>Lọc</Button>
                  <Button type="primary" icon={<PlusOutlined />}>
                    Thêm nhiệm vụ
                  </Button>
                </Space>
              </div>
              <Divider />
              <div style={{ marginTop: "20px" }}>
                <Space>
                  <Button type="primary">Thêm nhiệm vụ</Button>
                  <Button>Sửa nhiệm vụ</Button>
                  <Button danger>Xóa nhiệm vụ</Button>
                </Space>
              </div>
            </Card>
          </div>
        );

      case "posts":
        return <PostApprovalContent />;

      case "schedules":
        return <ScheduleManagementContent />;

      case "notifications":
        return (
          <div className="notifications-container">
            <Card>
              <div className="page-header">
                <Title level={3}>
                  <BellOutlined style={{ marginRight: 8 }} />
                  Quản lý thông báo
                </Title>
                <Space>
                  <Search
                    placeholder="Tìm kiếm thông báo..."
                    style={{ width: 300 }}
                  />
                  <Button icon={<FilterOutlined />}>Lọc</Button>
                  <Button type="primary" icon={<PlusOutlined />}>
                    Tạo thông báo
                  </Button>
                </Space>
              </div>
              <Divider />
              <Text>Tính năng quản lý thông báo sẽ được triển khai ở đây.</Text>
            </Card>
          </div>
        );

      case "settings":
        return (
          <div className="settings-container">
            <Card>
              <div className="page-header">
                <Title level={3}>
                  <SettingOutlined style={{ marginRight: 8 }} />
                  Cài đặt hệ thống
                </Title>
              </div>
              <Divider />
              <div className="settings-content">
                <Row gutter={[24, 24]}>
                  <Col xs={24} md={12}>
                    <Card size="small" title="Cài đặt chung">
                      <div className="setting-item">
                        <div className="setting-label">
                          <Text strong>Chế độ bảo trì</Text>
                          <Text type="secondary" style={{ display: "block" }}>
                            Tạm thời ngừng hoạt động hệ thống
                          </Text>
                        </div>
                        <Switch />
                      </div>
                      <div className="setting-item">
                        <div className="setting-label">
                          <Text strong>Thông báo email</Text>
                          <Text type="secondary" style={{ display: "block" }}>
                            Gửi thông báo qua email
                          </Text>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card size="small" title="Bảo mật">
                      <div className="setting-item">
                        <div className="setting-label">
                          <Text strong>Xác thực 2 bước</Text>
                          <Text type="secondary" style={{ display: "block" }}>
                            Bảo mật tài khoản admin
                          </Text>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="setting-item">
                        <div className="setting-label">
                          <Text strong>Tự động đăng xuất</Text>
                          <Text type="secondary" style={{ display: "block" }}>
                            Đăng xuất sau 30 phút không hoạt động
                          </Text>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </Card>
                  </Col>
                </Row>
              </div>
            </Card>
          </div>
        );

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
        className="admin-sidebar"
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
          className="admin-menu"
          style={{
            background: "transparent",
            borderRight: 0,
            paddingTop: "20px",
            paddingBottom: "20px",
          }}
        >
          {menuItems.map((item) => (
            <Menu.Item key={item.key} icon={item.icon} className="menu-item">
              {item.label}
            </Menu.Item>
          ))}

          <Menu.Divider style={{ backgroundColor: "rgba(255,255,255,0.2)" }} />

          <Menu.Item
            key="logout"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            className="menu-item logout-item"
          >
            Đăng xuất
          </Menu.Item>
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
              <Text type="secondary" style={{ fontSize: "14px" }}>
                Quản lý và điều hành hệ thống
              </Text>
            </div>

            <div className="header-right">
              <Space size="large">
                <Tooltip title="Thông báo">
                  <Badge count={5} size="small">
                    <Button
                      type="text"
                      icon={<BellOutlined />}
                      size="large"
                      className="header-btn"
                    />
                  </Badge>
                </Tooltip>

                <Tooltip title="Cài đặt">
                  <Button
                    type="text"
                    icon={<SettingOutlined />}
                    size="large"
                    className="header-btn"
                  />
                </Tooltip>

                <Divider type="vertical" style={{ height: "30px" }} />

                <Dropdown
                  menu={{
                    items: [
                      {
                        key: "profile",
                        icon: <UserOutlined />,
                        label: "Hồ sơ",
                      },
                      {
                        key: "settings",
                        icon: <SettingOutlined />,
                        label: "Cài đặt",
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
        <Content className="admin-content">{renderContent()}</Content>
      </Layout>
    </Layout>
  );
};

export default AdminPage;
