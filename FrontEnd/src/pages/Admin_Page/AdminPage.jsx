import React, { useState } from "react";
import {
  Layout,
  Menu,
  Typography,
  Card,
  Button,
  Space,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Avatar,
  List,
  Badge,
  Dropdown,
  Input,
  DatePicker,
  Switch,
  Tooltip,
  Divider,
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
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  UsergroupAddOutlined,
  SearchOutlined,
  MoreOutlined,
  CalendarOutlined,
  FireOutlined,
  RiseOutlined,
  PlusOutlined,
  FilterOutlined,
  ExportOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import "./AdminPage.css";

const { Sider, Content, Header } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const { RangePicker } = DatePicker;

const AdminPage = () => {
  const [selectedKey, setSelectedKey] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  // Sample data for dashboard
  const dashboardStats = [
    {
      title: "Tổng người dùng",
      value: 3456,
      prefix: <UsergroupAddOutlined />,
      suffix: "người",
      trend: "up",
      trendValue: 12.5,
      color: "#1890ff",
      bgColor: "#e6f7ff",
    },
    {
      title: "Doanh thu",
      value: 45200,
      prefix: <DollarOutlined />,
      suffix: "VNĐ",
      trend: "up",
      trendValue: 8.2,
      color: "#52c41a",
      bgColor: "#f6ffed",
    },
    {
      title: "Đơn hàng",
      value: 2450,
      prefix: <ShoppingCartOutlined />,
      suffix: "đơn",
      trend: "up",
      trendValue: 5.9,
      color: "#fa8c16",
      bgColor: "#fff7e6",
    },
    {
      title: "Lượt xem",
      value: 145600,
      prefix: <EyeOutlined />,
      suffix: "lượt",
      trend: "down",
      trendValue: -2.3,
      color: "#722ed1",
      bgColor: "#f9f0ff",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      user: "Nguyễn Văn A",
      action: "Đăng ký tài khoản mới",
      time: "2 phút trước",
      type: "user",
      status: "success",
    },
    {
      id: 2,
      user: "Trần Thị B",
      action: "Hoàn thành nhiệm vụ",
      time: "5 phút trước",
      type: "task",
      status: "success",
    },
    {
      id: 3,
      user: "Lê Văn C",
      action: "Thanh toán thất bại",
      time: "10 phút trước",
      type: "payment",
      status: "error",
    },
    {
      id: 4,
      user: "Phạm Thị D",
      action: "Đặt lịch hẹn",
      time: "15 phút trước",
      type: "appointment",
      status: "warning",
    },
  ];

  const topPerformers = [
    {
      name: "Nguyễn Minh Tuấn",
      role: "Huấn luyện viên",
      score: 98,
      avatar: null, // Sử dụng avatar mặc định
      growth: 15,
    },
    {
      name: "Trần Thị Lan",
      role: "Huấn luyện viên",
      score: 95,
      avatar: null, // Sử dụng avatar mặc định
      growth: 12,
    },
    {
      name: "Lê Văn Hùng",
      role: "Huấn luyện viên",
      score: 92,
      avatar: null, // Sử dụng avatar mặc định
      growth: 8,
    },
    {
      name: "Phạm Thị Mai",
      role: "Huấn luyện viên",
      score: 88,
      avatar: null, // Sử dụng avatar mặc định
      growth: 5,
    },
  ];

  const salesData = [
    {
      key: "1",
      product: "Gói Premium",
      sales: 142,
      revenue: 14200000,
      change: "+12%",
      trend: "up",
    },
    {
      key: "2",
      product: "Gói Standard",
      sales: 98,
      revenue: 4900000,
      change: "+8%",
      trend: "up",
    },
    {
      key: "3",
      product: "Gói Basic",
      sales: 86,
      revenue: 1720000,
      change: "-3%",
      trend: "down",
    },
    {
      key: "4",
      product: "Tư vấn 1-1",
      sales: 64,
      revenue: 3200000,
      change: "+5%",
      trend: "up",
    },
  ];

  const salesColumns = [
    {
      title: "Sản phẩm",
      dataIndex: "product",
      key: "product",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Số lượng",
      dataIndex: "sales",
      key: "sales",
      render: (value) => <span>{value.toLocaleString()}</span>,
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      render: (value) => <span>{value.toLocaleString()} VNĐ</span>,
    },
    {
      title: "Thay đổi",
      dataIndex: "change",
      key: "change",
      render: (value, record) => (
        <span style={{ color: record.trend === "up" ? "#52c41a" : "#f5222d" }}>
          {record.trend === "up" ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          {value}
        </span>
      ),
    },
  ];

  // Menu items configuration
  const menuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      title: "Dashboard - Tổng quan",
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
      key: "revenue",
      icon: <BarChartOutlined />,
      label: "Thống kê doanh thu",
      title: "Thống kê doanh thu",
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
    return currentItem ? currentItem.title : "Dashboard";
  };

  const renderContent = () => {
    switch (selectedKey) {
      case "dashboard":
        return (
          <div className="dashboard-container">
            {/* Header với search và actions */}
            <div className="dashboard-header">
              <Row gutter={[16, 16]} align="middle">
                <Col flex="auto">
                  <Title level={2} style={{ margin: 0, color: "#1890ff" }}>
                    <DashboardOutlined style={{ marginRight: 8 }} />
                    Dashboard Overview
                  </Title>
                  <Text type="secondary">Tổng quan về hoạt động hệ thống</Text>
                </Col>
                <Col>
                  <Space wrap>
                    <Search
                      placeholder="Tìm kiếm..."
                      style={{ width: 200 }}
                      prefix={<SearchOutlined />}
                    />
                    <RangePicker size="middle" />
                    <Button icon={<FilterOutlined />} size="middle">
                      Lọc
                    </Button>
                    <Button icon={<ExportOutlined />} size="middle">
                      Xuất
                    </Button>
                    <Button
                      type="primary"
                      icon={<SyncOutlined />}
                      size="middle"
                    >
                      Làm mới
                    </Button>
                  </Space>
                </Col>
              </Row>
            </div>

            {/* Stats Cards */}
            <Row gutter={[24, 24]} className="stats-row">
              {dashboardStats.map((stat, index) => (
                <Col xs={24} sm={12} lg={6} key={index}>
                  <Card className="stat-card" hoverable>
                    <div className="stat-content">
                      <div
                        className="stat-icon"
                        style={{ backgroundColor: stat.bgColor }}
                      >
                        <span style={{ color: stat.color, fontSize: "24px" }}>
                          {stat.prefix}
                        </span>
                      </div>
                      <div className="stat-info">
                        <Text className="stat-title">{stat.title}</Text>
                        <div className="stat-value">
                          <Statistic
                            value={stat.value}
                            suffix={stat.suffix}
                            valueStyle={{
                              color: stat.color,
                              fontSize: "24px",
                              fontWeight: "bold",
                            }}
                          />
                        </div>
                        <div className="stat-trend">
                          <span className={`trend-indicator ${stat.trend}`}>
                            {stat.trend === "up" ? (
                              <ArrowUpOutlined />
                            ) : (
                              <ArrowDownOutlined />
                            )}
                            {stat.trendValue}%
                          </span>
                          <Text type="secondary" style={{ marginLeft: 8 }}>
                            so với tháng trước
                          </Text>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Main Content Area */}
            <Row gutter={[24, 24]} style={{ marginTop: 20 }}>
              {/* Sales Performance */}
              <Col xs={24} lg={16}>
                <Card
                  title={
                    <div className="card-header">
                      <span>
                        <BarChartOutlined style={{ marginRight: 8 }} />
                        Hiệu suất bán hàng
                      </span>
                      <Space>
                        <Button size="small" icon={<ExportOutlined />}>
                          Xuất
                        </Button>
                        <Dropdown
                          menu={{
                            items: [
                              { key: "1", label: "Xem chi tiết" },
                              { key: "2", label: "Tùy chỉnh" },
                              { key: "3", label: "Chia sẻ" },
                            ],
                          }}
                        >
                          <Button size="small" icon={<MoreOutlined />} />
                        </Dropdown>
                      </Space>
                    </div>
                  }
                  className="sales-card"
                >
                  <Table
                    dataSource={salesData}
                    columns={salesColumns}
                    pagination={false}
                    size="small"
                    className="sales-table"
                  />
                </Card>
              </Col>

              {/* Top Performers */}
              <Col xs={24} lg={8}>
                <Card
                  title={
                    <div className="card-header">
                      <span>
                        <TrophyOutlined style={{ marginRight: 8 }} />
                        Xuất sắc nhất
                      </span>
                      <Button
                        size="small"
                        type="text"
                        icon={<MoreOutlined />}
                      />
                    </div>
                  }
                  className="performers-card"
                >
                  <List
                    dataSource={topPerformers}
                    renderItem={(item, index) => (
                      <List.Item className="performer-item">
                        <List.Item.Meta
                          avatar={
                            <Badge
                              count={index + 1}
                              style={{
                                backgroundColor:
                                  index === 0
                                    ? "#faad14"
                                    : index === 1
                                    ? "#52c41a"
                                    : "#1890ff",
                              }}
                            >
                              <Avatar
                                src={item.avatar}
                                size={40}
                                style={{
                                  backgroundColor:
                                    index === 0
                                      ? "#faad14"
                                      : index === 1
                                      ? "#52c41a"
                                      : "#1890ff",
                                  fontSize: "16px",
                                }}
                              >
                                {!item.avatar && item.name.charAt(0)}
                              </Avatar>
                            </Badge>
                          }
                          title={
                            <div className="performer-info">
                              <Text strong>{item.name}</Text>
                              <Progress
                                percent={item.score}
                                size="small"
                                strokeColor={
                                  item.score > 95
                                    ? "#52c41a"
                                    : item.score > 90
                                    ? "#faad14"
                                    : "#1890ff"
                                }
                                showInfo={false}
                              />
                            </div>
                          }
                          description={
                            <div className="performer-meta">
                              <Text type="secondary">{item.role}</Text>
                              <span className="growth-indicator">
                                <RiseOutlined style={{ color: "#52c41a" }} />+
                                {item.growth}%
                              </span>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>

            {/* Recent Activities */}
            <Row gutter={[24, 24]} style={{ marginTop: 20 }}>
              <Col xs={24} lg={16}>
                <Card
                  title={
                    <div className="card-header">
                      <span>
                        <ClockCircleOutlined style={{ marginRight: 8 }} />
                        Hoạt động gần đây
                      </span>
                      <Button size="small" type="primary" ghost>
                        Xem tất cả
                      </Button>
                    </div>
                  }
                  className="activities-card"
                >
                  <List
                    dataSource={recentActivities}
                    renderItem={(item) => (
                      <List.Item className="activity-item">
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              style={{
                                backgroundColor:
                                  item.type === "user"
                                    ? "#1890ff"
                                    : item.type === "task"
                                    ? "#52c41a"
                                    : item.type === "payment"
                                    ? "#f5222d"
                                    : "#faad14",
                              }}
                              icon={
                                item.type === "user" ? (
                                  <UserOutlined />
                                ) : item.type === "task" ? (
                                  <CheckCircleOutlined />
                                ) : item.type === "payment" ? (
                                  <DollarOutlined />
                                ) : (
                                  <CalendarOutlined />
                                )
                              }
                            />
                          }
                          title={
                            <div className="activity-info">
                              <Text strong>{item.user}</Text>
                              <Tag
                                color={
                                  item.status === "success"
                                    ? "success"
                                    : item.status === "error"
                                    ? "error"
                                    : "warning"
                                }
                                style={{ marginLeft: 8 }}
                              >
                                {item.status === "success"
                                  ? "Thành công"
                                  : item.status === "error"
                                  ? "Lỗi"
                                  : "Chờ xử lý"}
                              </Tag>
                            </div>
                          }
                          description={
                            <div className="activity-meta">
                              <Text>{item.action}</Text>
                              <Text
                                type="secondary"
                                style={{ marginLeft: "auto" }}
                              >
                                {item.time}
                              </Text>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>

              {/* Quick Actions */}
              <Col xs={24} lg={8}>
                <Card
                  title={
                    <div className="card-header">
                      <span>
                        <FireOutlined style={{ marginRight: 8 }} />
                        Thao tác nhanh
                      </span>
                    </div>
                  }
                  className="quick-actions-card"
                >
                  <div className="quick-actions">
                    <Button
                      type="primary"
                      block
                      size="large"
                      icon={<PlusOutlined />}
                      className="action-btn"
                    >
                      Thêm người dùng
                    </Button>
                    <Button
                      block
                      size="large"
                      icon={<TeamOutlined />}
                      className="action-btn"
                    >
                      Quản lý HLV
                    </Button>
                    <Button
                      block
                      size="large"
                      icon={<BellOutlined />}
                      className="action-btn"
                    >
                      Gửi thông báo
                    </Button>
                    <Button
                      block
                      size="large"
                      icon={<BarChartOutlined />}
                      className="action-btn"
                    >
                      Xem báo cáo
                    </Button>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        );

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
        return (
          <div className="coaches-container">
            <Card>
              <div className="page-header">
                <Title level={3}>
                  <TeamOutlined style={{ marginRight: 8 }} />
                  Quản lý huấn luyện viên
                </Title>
                <Space>
                  <Search
                    placeholder="Tìm kiếm HLV..."
                    style={{ width: 300 }}
                  />
                  <Button icon={<FilterOutlined />}>Lọc</Button>
                  <Button type="primary" icon={<PlusOutlined />}>
                    Thêm HLV
                  </Button>
                </Space>
              </div>
              <Divider />
              <Text>
                Tính năng quản lý huấn luyện viên sẽ được triển khai ở đây.
              </Text>
            </Card>
          </div>
        );

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
        return (
          <div className="posts-container">
            <Card>
              <div className="page-header">
                <Title level={3}>
                  <FileTextOutlined style={{ marginRight: 8 }} />
                  Quản lý bài viết
                </Title>
                <Space>
                  <Search
                    placeholder="Tìm kiếm bài viết..."
                    style={{ width: 300 }}
                  />
                  <Button icon={<FilterOutlined />}>Lọc</Button>
                  <Button type="primary" icon={<PlusOutlined />}>
                    Thêm bài viết
                  </Button>
                </Space>
              </div>
              <Divider />
              <Text>Tính năng quản lý bài viết sẽ được triển khai ở đây.</Text>
            </Card>
          </div>
        );

      case "schedules":
        return (
          <div className="schedules-container">
            <Card>
              <div className="page-header">
                <Title level={3}>
                  <ScheduleOutlined style={{ marginRight: 8 }} />
                  Quản lý lịch trình
                </Title>
                <Space>
                  <Search
                    placeholder="Tìm kiếm lịch trình..."
                    style={{ width: 300 }}
                  />
                  <Button icon={<FilterOutlined />}>Lọc</Button>
                  <Button type="primary" icon={<PlusOutlined />}>
                    Thêm lịch trình
                  </Button>
                </Space>
              </div>
              <Divider />
              <Text>
                Tính năng quản lý lịch trình sẽ được triển khai ở đây.
              </Text>
            </Card>
          </div>
        );

      case "revenue":
        return (
          <div className="revenue-container">
            <Card>
              <div className="page-header">
                <Title level={3}>
                  <BarChartOutlined style={{ marginRight: 8 }} />
                  Thống kê doanh thu
                </Title>
                <Space>
                  <RangePicker />
                  <Button icon={<FilterOutlined />}>Lọc</Button>
                  <Button icon={<ExportOutlined />}>Xuất báo cáo</Button>
                </Space>
              </div>
              <Divider />
              <Text>
                Tính năng thống kê doanh thu sẽ được triển khai ở đây.
              </Text>
            </Card>
          </div>
        );

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
