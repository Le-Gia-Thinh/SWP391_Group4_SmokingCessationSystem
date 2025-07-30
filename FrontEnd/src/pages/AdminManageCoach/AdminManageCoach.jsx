import React, { useState, useEffect } from "react";
import {
  Layout,
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Statistic,
  Row,
  Col,
  Space,
  Tag,
  Avatar,
  Typography,
  message,
  Popconfirm,
  Tooltip,
  Divider,
  DatePicker,
  Tabs,
  Badge,
} from "antd";
import {
  UserOutlined,
  TeamOutlined,
  UserAddOutlined,
  SafetyCertificateOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  CopyOutlined,
  CheckOutlined,
  SearchOutlined,
  FilterOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import StatisticCard from "../../components/ui/StatisticCard";
import DataTable from "../../components/ui/DataTable";
import FormModal from "../../components/ui/FormModal";
import ActionButtonGroup from "../../components/ui/ActionButtonGroup";
import moment from "moment-timezone";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
const { TextArea } = Input;

const AdminDashboard = () => {
  // State management
  const [coaches, setCoaches] = useState([]);
  const [filteredCoaches, setFilteredCoaches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createCoachModal, setCreateCoachModal] = useState(false);
  const [editCoachModal, setEditCoachModal] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [viewCoachModal, setViewCoachModal] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState(false);
  const [newCoachCredentials, setNewCoachCredentials] = useState(null);
  const [copiedField, setCopiedField] = useState("");
  const [coachViolations, setCoachViolations] = useState([]);
  const [memberNoShows, setMemberNoShows] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [coachBadgeCount, setCoachBadgeCount] = useState(0);
  const [memberBadgeCount, setMemberBadgeCount] = useState(0);
  const [activeTab, setActiveTab] = useState("coaches");

  // Cho phép background scroll khi modal mở
  useEffect(() => {
    const anyModalOpen =
      createCoachModal || editCoachModal || viewCoachModal || credentialsModal;
    if (anyModalOpen) {
      document.body.style.overflow = "unset";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [createCoachModal, editCoachModal, viewCoachModal, credentialsModal]);

  // Search and filter states
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Form instances
  const [coachForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // API Base URL
  const API_BASE_URL = "http://localhost:5000/api";

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // Helper function to handle API responses
  const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "API request failed");
    }
    return data;
  };

  // Load coaches on component mount
  useEffect(() => {
    loadCoaches();
    loadCoachViolations();
    loadMemberNoShows();
  }, []);

  // Filter coaches based on search and filters
  useEffect(() => {
    filterCoaches();
  }, [coaches, searchText, statusFilter]);

  useEffect(() => {
    setCoachBadgeCount(coachViolations.length);
  }, [coachViolations]);

  useEffect(() => {
    setMemberBadgeCount(memberNoShows.length);
  }, [memberNoShows]);

  const filterCoaches = () => {
    let filtered = [...coaches];

    // Search filter
    if (searchText) {
      filtered = filtered.filter(
        (coach) =>
          coach.full_name?.toLowerCase().includes(searchText.toLowerCase()) ||
          coach.email?.toLowerCase().includes(searchText.toLowerCase()) ||
          coach.phone_number
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          coach.specialization?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (coach) => coach.account_status === statusFilter
      );
    }

    setFilteredCoaches(filtered);
  };

  const clearFilters = () => {
    setSearchText("");
    setStatusFilter("all");
  };

  const loadCoaches = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/get-coaches`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const data = await handleResponse(response);
      setCoaches(data.data || []);
      message.success("Danh sách huấn luyện viên đã được tải thành công!");
    } catch (error) {
      console.error("Error loading coaches:", error);
      message.error("Không thể tải danh sách huấn luyện viên");
    } finally {
      setLoading(false);
    }
  };

  const loadCoachViolations = async () => {
    setReportLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/feedbacks/coach-violations`,
        {
          headers: getAuthHeaders(),
        }
      );
      const data = await response.json();
      setCoachViolations(data.data || []);
    } catch (error) {
      console.error("Error loading coach violations:", error);
      setCoachViolations([]);
    } finally {
      setReportLoading(false);
    }
  };

  const loadMemberNoShows = async () => {
    setReportLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/reports/member-no-shows`,
        {
          headers: getAuthHeaders(),
        }
      );
      const data = await response.json();
      setMemberNoShows(data.data || []);
    } catch (error) {
      console.error("Error loading member no-shows:", error);
      setMemberNoShows([]);
    } finally {
      setReportLoading(false);
    }
  };

  // Create coach account
  const handleCreateCoach = async (values) => {
    try {
      setLoading(true);

      // Format date for backend
      const coachData = {
        username: values.email.split("@")[0], // Generate username from email
        full_name: values.full_name,
        email: values.email,
        phone_number: values.phone_number || "",
        date_of_birth:
          values.date_of_birth?.format("YYYY-MM-DD") || "1990-01-01",
        password: values.password || "123456",
        google_meet_link: values.google_meet_link || "",
      };

      const response = await fetch(`${API_BASE_URL}/admin/create-coach`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(coachData),
      });
      await handleResponse(response);

      // Set credentials for modal
      setNewCoachCredentials({
        name: values.full_name,
        email: values.email,
        password: coachData.password,
      });

      setCreateCoachModal(false);
      setCredentialsModal(true);
      coachForm.resetFields();

      // Reload coaches list
      await loadCoaches();

      message.success("Tài khoản huấn luyện viên đã được tạo thành công!");
    } catch (error) {
      console.error("Error creating coach:", error);
      message.error(error.message || "Không thể tạo tài khoản huấn luyện viên");
    } finally {
      setLoading(false);
    }
  };

  // Edit coach
  const handleEditCoach = (coach) => {
    setSelectedCoach(coach);
    setEditCoachModal(true);
    setTimeout(() => {
      editForm.setFieldsValue({
        full_name: coach.full_name || "",
        email: coach.email || "",
        phone_number: coach.phone_number || "",
        account_status: coach.account_status || "",
        specialization: coach.specialization || "",
        bio: coach.bio || "",
        experience_years: coach.experience_years !== undefined && coach.experience_years !== null ? coach.experience_years : "",
        google_meet_link: coach.google_meet_link || "",
        coach_status: coach.coach_status || "",
      });
    }, 0);
  };

  // Update coach
  const handleUpdateCoach = async (values) => {
    try {
      setLoading(true);

      const updateData = {
        full_name: values.full_name,
        phone_number: values.phone_number,
        account_status: values.account_status,
        specialization: values.specialization,
        bio: values.bio,
        experience_years: values.experience_years,
        google_meet_link: values.google_meet_link,
        coach_status: values.coach_status,
      };

      const response = await fetch(
        `${API_BASE_URL}/admin/update-coach/${selectedCoach.coach_id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(updateData),
        }
      );
      await handleResponse(response);

      message.success("Huấn luyện viên đã được cập nhật thành công!");
      setEditCoachModal(false);
      setSelectedCoach(null);
      editForm.resetFields();

      // Reload coaches list
      await loadCoaches();
    } catch (error) {
      console.error("Error updating coach:", error);
      message.error(error.message || "Không thể cập nhật huấn luyện viên");
    } finally {
      setLoading(false);
    }
  };

  // Delete coach (deactivate)
  const handleDeleteCoach = async (coachId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/admin/delete-coach/${coachId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );
      await handleResponse(response);
      message.success("Huấn luyện viên đã được vô hiệu hóa thành công!");
      await loadCoaches();
    } catch (error) {
      console.error("Error deleting coach:", error);
      message.error(error.message || "Không thể vô hiệu hóa huấn luyện viên");
    } finally {
      setLoading(false);
    }
  };

  // Restore coach
  const handleRestoreCoach = async (coachId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/admin/restore-coach/${coachId}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );
      await handleResponse(response);
      message.success("Huấn luyện viên đã được khôi phục thành công!");
      await loadCoaches();
    } catch (error) {
      console.error("Error restoring coach:", error);
      message.error(error.message || "Không thể khôi phục huấn luyện viên");
    } finally {
      setLoading(false);
    }
  };

  // View coach details
  const handleViewCoach = (coach) => {
    setSelectedCoach(coach);
    setViewCoachModal(true);
  };

  const handleCopy = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      message.success("Đã sao chép vào clipboard!");
      setTimeout(() => setCopiedField(""), 2000);
    } catch (error) {
      message.error("Không thể sao chép");
      console.error("Copy error:", error);
    }
  };

  const handleCopyAll = async () => {
    const credentialsText = `Name: ${newCoachCredentials.name}\nEmail: ${newCoachCredentials.email}\nPassword: ${newCoachCredentials.password}`;
    try {
      await navigator.clipboard.writeText(credentialsText);
      message.success(
        "Tất cả thông tin đăng nhập đã được sao chép vào clipboard!"
      );
    } catch (error) {
      message.error("Không thể sao chép thông tin đăng nhập");
      console.error("Copy all error:", error);
    }
  };

  // Calculate statistics based on filtered coaches
  const stats = {
    totalCoaches: filteredCoaches.length,
    activeCoaches: filteredCoaches.filter(
      (coach) => coach.account_status === "active"
    ).length,
    inactiveCoaches: filteredCoaches.filter(
      (coach) => coach.account_status === "inactive"
    ).length,
    totalUsers: filteredCoaches.length, // For compatibility with existing UI
  };

  // Table columns
  const columns = [
    {
      title: "Huấn luyện viên",
      key: "coach",
      render: (_, record) => (
        <Space>
          <Avatar size="large" style={{ backgroundColor: "#52c41a" }}>
            {record.full_name?.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: "bold" }}>{record.full_name}</div>
            <Text type="secondary">{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Chuyên môn",
      key: "specialization",
      render: (_, record) => (
        <Text>{record.specialization || "Chưa cập nhật"}</Text>
      ),
    },
    {
      title: "Kinh nghiệm",
      key: "experience",
      render: (_, record) => (
        <Text>
          {record.experience_years
            ? `${record.experience_years} năm`
            : "Chưa cập nhật"}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, record) => {
        // Hiệu ứng giống AdminUserManager
        const statusConfig = {
          active: {
            color: "success",
            text: "Hoạt động",
            gradient: "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)",
            icon: "🟢",
          },
          inactive: {
            color: "warning",
            text: "Không hoạt động",
            gradient: "linear-gradient(135deg, #faad14 0%, #ffc53d 100%)",
            icon: "🟡",
          },
        };
        const config = statusConfig[record.account_status] || {
          color: "default",
          text: record.account_status,
          gradient: "linear-gradient(135deg, #d9d9d9 0%, #f0f0f0 100%)",
          icon: "⚪",
        };
        return (
          <Tag
            className="px-3 py-1 rounded-pill fw-bold position-relative"
            style={{
              background: config.gradient,
              border: "none",
              color: "white",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              animation: "pulse 2s infinite",
            }}
          >
            <span className="me-1">{config.icon}</span>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: "Ngày đăng ký",
      key: "registration",
      render: (_, record) => (
        <Text>
          {record.registration_date
            ? new Date(record.registration_date).toLocaleDateString()
            : "N/A"}
        </Text>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Space className="d-flex justify-content-center">
          <Tooltip title="Xem chi tiết">
            <Button
              type="primary"
              size="middle"
              shape="circle"
              icon={<EyeOutlined />}
              onClick={() => handleViewCoach(record)}
              className="aum-action-btn aum-view-btn"
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="primary"
              size="middle"
              shape="circle"
              icon={<EditOutlined />}
              onClick={() => handleEditCoach(record)}
              className="aum-action-btn aum-edit-btn"
            />
          </Tooltip>
          {record.account_status === "active" ? (
            <Popconfirm
              title="Vô hiệu hóa huấn luyện viên"
              description="Bạn có chắc chắn muốn vô hiệu hóa huấn luyện viên này?"
              onConfirm={() => handleDeleteCoach(record.coach_id)}
              okText="Có"
              cancelText="Không"
            >
              <Tooltip title="Vô hiệu hóa">
                <Button
                  danger
                  type="primary"
                  size="middle"
                  shape="circle"
                  icon={<DeleteOutlined />}
                  className="aum-action-btn aum-delete-btn"
                />
              </Tooltip>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Khôi phục huấn luyện viên"
              description="Bạn có chắc chắn muốn khôi phục huấn luyện viên này?"
              onConfirm={() => handleRestoreCoach(record.coach_id)}
              okText="Có"
              cancelText="Không"
            >
              <Tooltip title="Khôi phục">
                <Button
                  type="primary"
                  size="middle"
                  shape="circle"
                  icon={<UndoOutlined />}
                  className="aum-action-btn aum-unlock-btn"
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Layout className="admin-dashboard" style={{ background: "none" }}>
      <Content style={{ padding: 0, minHeight: "calc(100vh - 64px)" }}>
        {/* Header */}
        <div
          style={{ marginBottom: "24px", width: "100%", background: "none" }}
        >
          <Title
            level={2}
            style={{ margin: 0, color: "#52c41a", textAlign: "center" }}
          >
            Quản lý huấn luyện viên
          </Title>
          <Text
            type="secondary"
            style={{ display: "block", textAlign: "center" }}
          >
            Tạo và quản lý tài khoản huấn luyện viên
          </Text>
        </div>

        {/* Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
          <Col xs={24} sm={12} lg={6}>
            <StatisticCard
              title="Tổng số huấn luyện viên"
              value={stats.totalCoaches}
              prefix={<TeamOutlined style={{ color: "#1890ff" }} />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatisticCard
              title="Huấn luyện viên hoạt động"
              value={stats.activeCoaches}
              prefix={<UserOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatisticCard
              title="Huấn luyện viên không hoạt động"
              value={stats.inactiveCoaches}
              prefix={<UserAddOutlined style={{ color: "#faad14" }} />}
              valueStyle={{ color: "#faad14" }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatisticCard
              title="Tổng số người dùng"
              value={stats.totalUsers}
              prefix={
                <SafetyCertificateOutlined style={{ color: "#ff4d4f" }} />
              }
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Col>
        </Row>

        {/* Search and Filter Controls */}
        <div className="filter-controls" style={{ marginBottom: "16px" }}>
          <Row gutter={[16, 16]} align="middle">
            <Col
              xs={24}
              sm={12}
              md={12}
              lg={8}
              xl={7}
              xxl={6}
              style={{ minWidth: 320, maxWidth: 520 }}
            >
              <Search
                placeholder="Tìm kiếm"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                className="admin-search-large"
                style={{
                  width: "100%",
                  minWidth: 220,
                  maxWidth: 520,
                  height: 48,
                }}
              />
            </Col>
            <Col
              xs={24}
              sm={12}
              md={8}
              lg={4}
              xl={3}
              xxl={3}
              style={{ minWidth: 180, maxWidth: 260 }}
            >
              <Select
                placeholder="Lọc theo trạng thái"
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: "100%" }}
                allowClear
              >
                <Option value="all">Tất cả trạng thái</Option>
                <Option value="active">Hoạt động</Option>
                <Option value="inactive">Không hoạt động</Option>
              </Select>
            </Col>
          </Row>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            if (key === "coach-violations") setCoachBadgeCount(0);
            if (key === "member-no-shows") setMemberBadgeCount(0);
          }}
          tabBarStyle={{ margin: 0, padding: 0 }}
        >
          <Tabs.TabPane tab={<span>Quản lý HLV</span>} key="coaches">
            <div
              style={{ width: "100%", overflowX: "auto", background: "none" }}
            >
              <DataTable
                title="Danh sách huấn luyện viên"
                columns={columns}
                dataSource={filteredCoaches}
                loading={loading}
                rowKey="coach_id"
                extra={
                  <Space>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={loadCoaches}
                      loading={loading}
                    >
                      Làm mới
                    </Button>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setCreateCoachModal(true);
                        coachForm.setFieldsValue({ password: "Coach@123" });
                      }}
                    >
                      Tạo huấn luyện viên
                    </Button>
                  </Space>
                }
                tableProps={{
                  style: { width: "100%" },
                  pagination: {
                    position: ["bottomCenter"],
                    pageSize: 10,
                    showSizeChanger: false,
                  },
                  rowClassName: () => "admin-table-row-center",
                }}
              />
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane
            tab={
              <span>
                Báo cáo HLV vắng mặt <Badge count={coachBadgeCount} />
              </span>
            }
            key="coach-violations"
          >
            <Card title="Báo cáo HLV vắng mặt" style={{ marginTop: 24 }}>
              <div style={{ marginBottom: 16, textAlign: "right" }}>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={loadCoachViolations}
                  loading={reportLoading}
                >
                  Làm mới
                </Button>
              </div>
              <Table
                dataSource={coachViolations}
                rowKey="feedback_id"
                loading={reportLoading}
                columns={[
                  {
                    title: "ID",
                    dataIndex: "feedback_id",
                    key: "id",
                    width: 80,
                  },
                  {
                    title: "Người báo cáo",
                    dataIndex: "reporter_name",
                    key: "reporter_name",
                  },
                  {
                    title: "Nội dung",
                    dataIndex: "content",
                    key: "content",
                    ellipsis: true,
                  },
                  {
                    title: "Ngày gửi",
                    dataIndex: "submitted_at",
                    key: "submitted_at",
                    render: (v) => (v ? new Date(v).toLocaleString() : ""),
                  },
                ]}
                pagination={{ pageSize: 10, showSizeChanger: false }}
              />
            </Card>
          </Tabs.TabPane>
          <Tabs.TabPane
            tab={
              <span>
                Báo cáo thành viên vắng mặt <Badge count={memberBadgeCount} />
              </span>
            }
            key="member-no-shows"
          >
            <Card title="Báo cáo thành viên vắng mặt" style={{ marginTop: 24 }}>
              <div style={{ marginBottom: 16, textAlign: "right" }}>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={loadMemberNoShows}
                  loading={reportLoading}
                >
                  Làm mới
                </Button>
              </div>
              <Table
                dataSource={memberNoShows}
                rowKey="session_id"
                loading={reportLoading}
                columns={[
                  {
                    title: "ID phiên",
                    dataIndex: "session_id",
                    key: "session_id",
                    width: 100,
                  },
                  {
                    title: "Thành viên",
                    dataIndex: "member_name",
                    key: "member_name",
                  },
                  { title: "HLV", dataIndex: "coach_name", key: "coach_name" },
                  {
                    title: "Lý do",
                    dataIndex: "session_notes",
                    key: "session_notes",
                    ellipsis: true,
                  },
                  {
                    title: "Thời gian",
                    dataIndex: "scheduled_time",
                    key: "scheduled_time",
                    render: (v) =>
                      v ? moment.parseZone(v).format("HH:mm DD/MM/YYYY") : "",
                  },
                ]}
                pagination={{ pageSize: 10, showSizeChanger: false }}
              />
            </Card>
          </Tabs.TabPane>
        </Tabs>
      </Content>

      {/* Create Coach Modal */}
      <FormModal
        title="Tạo tài khoản huấn luyện viên"
        visible={createCoachModal}
        onCancel={() => setCreateCoachModal(false)}
        onSubmit={handleCreateCoach}
        form={coachForm}
        loading={loading}
        width={700}
        centered
        style={{ top: "35%", transform: "translateY(-35%)" }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="full_name"
              label="Họ tên đầy đủ"
              rules={[
                { required: true, message: "Vui lòng nhập họ tên đầy đủ!" },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Nhập họ tên đầy đủ"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Vui lòng nhập email!" },
                { type: "email", message: "Vui lòng nhập email hợp lệ!" },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Nhập địa chỉ email"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="phone_number" label="Số điện thoại">
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="date_of_birth" label="Ngày sinh">
              <DatePicker
                style={{ width: "100%" }}
                placeholder="Chọn ngày sinh"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="password"
              label="Mật khẩu"
              initialValue="T123456" //hiện password cố định
            >
              <Input.Password
                readOnly
                style={{
                  backgroundColor: "#f5f5f5", // xám nhạt
                  cursor: "not-allowed", // hiển thị dấu cấm khi rê chuột
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="google_meet_link" label="Liên kết Google Meet">
              <Input placeholder="Nhập liên kết Google Meet" />
            </Form.Item>
          </Col>
        </Row>

        <div
          style={{
            background: "#f6ffed",
            border: "1px solid #b7eb8f",
            borderRadius: "6px",
            padding: "12px",
            marginBottom: "16px",
          }}
        >
          <Text style={{ color: "#52c41a", fontWeight: "500" }}>
            📝 Lưu ý: Huấn luyện viên sẽ nhận thông tin đăng nhập sau khi tạo
            tài khoản thành công
          </Text>
        </div>
      </FormModal>

      {/* Edit Coach Modal */}
      <FormModal
        title="Chỉnh sửa thông tin huấn luyện viên"
        visible={editCoachModal}
        onCancel={() => setEditCoachModal(false)}
        onSubmit={handleUpdateCoach}
        form={editForm}
        loading={loading}
        width={700}
        centered
        style={{ top: "35%", transform: "translateY(-35%)" }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="full_name"
              label="Họ tên đầy đủ"
              rules={[
                { required: true, message: "Vui lòng nhập họ tên đầy đủ!" },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Nhập họ tên đầy đủ"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="email" label="Email">
              <Input
                prefix={<UserOutlined />}
                placeholder="Nhập địa chỉ email"
                disabled
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="phone_number" label="Số điện thoại">
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="account_status"
              label="Trạng thái tài khoản"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}
            >
              <Select placeholder="Chọn trạng thái">
                <Option value="active">Hoạt động</Option>
                <Option value="inactive">Không hoạt động</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="specialization" label="Chuyên môn">
              <Input placeholder="Nhập chuyên môn" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="experience_years" label="Số năm kinh nghiệm">
              <Input type="number" placeholder="Nhập số năm kinh nghiệm" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="bio" label="Tiểu sử">
          <TextArea rows={3} placeholder="Nhập tiểu sử" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="google_meet_link" label="Liên kết Google Meet">
              <Input placeholder="Nhập liên kết Google Meet" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="coach_status" label="Trạng thái huấn luyện viên">
              <Select placeholder="Chọn trạng thái">
                <Option value="active">Hoạt động</Option>
                <Option value="inactive">Không hoạt động</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </FormModal>

      {/* View Coach Modal */}
      <Modal
        title="Chi tiết huấn luyện viên"
        open={viewCoachModal}
        onCancel={() => {
          setViewCoachModal(false);
          setSelectedCoach(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setViewCoachModal(false);
              setSelectedCoach(null);
            }}
          >
            Đóng
          </Button>,
        ]}
        width={600}
        centered
        style={{ top: "35%", transform: "translateY(-35%)" }}
      >
        {selectedCoach && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <Avatar size={80} style={{ backgroundColor: "#52c41a" }}>
                    {selectedCoach.full_name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Title level={3} style={{ marginTop: "10px" }}>
                    {selectedCoach.full_name}
                  </Title>
                </div>
              </Col>
            </Row>

            <Divider />

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>Email:</Text>
                <br />
                <Text>{selectedCoach.email}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Số điện thoại:</Text>
                <br />
                <Text>{selectedCoach.phone_number || "N/A"}</Text>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: "16px" }}>
              <Col span={12}>
                <Text strong>Chuyên môn:</Text>
                <br />
                <Text>{selectedCoach.specialization || "Chưa cập nhật"}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Kinh nghiệm:</Text>
                <br />
                <Text>
                  {selectedCoach.experience_years
                    ? `${selectedCoach.experience_years} năm`
                    : "Chưa cập nhật"}
                </Text>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: "16px" }}>
              <Col span={12}>
                <Text strong>Trạng thái tài khoản:</Text>
                <br />
                <Tag
                  color={
                    selectedCoach.account_status === "active"
                      ? "green"
                      : "orange"
                  }
                  style={{ textTransform: "capitalize" }}
                >
                  {selectedCoach.account_status === "active"
                    ? "Hoạt động"
                    : "Không hoạt động"}
                </Tag>
              </Col>
              <Col span={12}>
                <Text strong>Trạng thái huấn luyện viên:</Text>
                <br />
                <Tag
                  color={
                    selectedCoach.coach_status === "active" ? "green" : "orange"
                  }
                  style={{ textTransform: "capitalize" }}
                >
                  {selectedCoach.coach_status === "active"
                    ? "Hoạt động"
                    : "Không hoạt động"}
                </Tag>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: "16px" }}>
              <Col span={12}>
                <Text strong>Ngày đăng ký:</Text>
                <br />
                <Text>
                  {selectedCoach.registration_date
                    ? new Date(
                      selectedCoach.registration_date
                    ).toLocaleDateString()
                    : "N/A"}
                </Text>
              </Col>
              <Col span={12}>
                <Text strong>Liên kết Google Meet:</Text>
                <br />
                <Text>{selectedCoach.google_meet_link || "Chưa cập nhật"}</Text>
              </Col>
            </Row>

            {selectedCoach.bio && (
              <Row gutter={[16, 16]} style={{ marginTop: "16px" }}>
                <Col span={24}>
                  <Text strong>Tiểu sử:</Text>
                  <br />
                  <Text>{selectedCoach.bio}</Text>
                </Col>
              </Row>
            )}
          </div>
        )}
      </Modal>

      {/* Credentials Modal */}
      <Modal
        title={
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>🎉</div>
            <div>Tài khoản huấn luyện viên đã được tạo thành công!</div>
          </div>
        }
        open={credentialsModal}
        onCancel={() => {
          setCredentialsModal(false);
          setNewCoachCredentials(null);
          setCopiedField("");
        }}
        footer={[
          <Button
            key="copyAll"
            type="primary"
            icon={<CopyOutlined />}
            onClick={handleCopyAll}
            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
          >
            Sao chép tất cả thông tin đăng nhập
          </Button>,
          <Button
            key="close"
            onClick={() => {
              setCredentialsModal(false);
              setNewCoachCredentials(null);
              setCopiedField("");
            }}
          >
            Đóng
          </Button>,
        ]}
        width={500}
        className="admin-user-manager-modal"
        style={{
          top: "50%",
          transform: "translateY(-50%)",
          maxWidth: "95vw",
          padding: 0,
        }}
        styles={{
          padding: 24,
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        afterOpenChange={(open) => {
          document.body.style.overflow = open ? "unset" : "";
        }}
      >
        {newCoachCredentials && (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                background: "#f6ffed",
                border: "1px solid #b7eb8f",
                borderRadius: "8px",
                padding: "20px",
                marginBottom: "20px",
              }}
            >
              <Title
                level={4}
                style={{ color: "#52c41a", marginBottom: "16px" }}
              >
                📋 Thông tin đăng nhập tài khoản
              </Title>
              <Space
                direction="vertical"
                size="large"
                style={{ width: "100%" }}
              >
                {/* Name */}
                <div
                  style={{
                    background: "white",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #d9d9d9",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ textAlign: "left" }}>
                    <Text strong>Tên:</Text>
                    <br />
                    <Text>{newCoachCredentials.name}</Text>
                  </div>
                  <Button
                    type="text"
                    icon={
                      copiedField === "name" ? (
                        <CheckOutlined />
                      ) : (
                        <CopyOutlined />
                      )
                    }
                    onClick={() => handleCopy(newCoachCredentials.name, "name")}
                    style={{
                      color: copiedField === "name" ? "#52c41a" : "#666",
                    }}
                  />
                </div>
                {/* Email */}
                <div
                  style={{
                    background: "white",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #d9d9d9",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ textAlign: "left" }}>
                    <Text strong>Email:</Text>
                    <br />
                    <Text>{newCoachCredentials.email}</Text>
                  </div>
                  <Button
                    type="text"
                    icon={
                      copiedField === "email" ? (
                        <CheckOutlined />
                      ) : (
                        <CopyOutlined />
                      )
                    }
                    onClick={() =>
                      handleCopy(newCoachCredentials.email, "email")
                    }
                    style={{
                      color: copiedField === "email" ? "#52c41a" : "#666",
                    }}
                  />
                </div>
                {/* Password */}
                <div
                  style={{
                    background: "white",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #d9d9d9",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ textAlign: "left" }}>
                    <Text strong>Mật khẩu:</Text>
                    <br />
                    <Text code style={{ fontSize: "16px" }}>
                      {newCoachCredentials.password}
                    </Text>
                  </div>
                  <Button
                    type="text"
                    icon={
                      copiedField === "password" ? (
                        <CheckOutlined />
                      ) : (
                        <CopyOutlined />
                      )
                    }
                    onClick={() =>
                      handleCopy(newCoachCredentials.password, "password")
                    }
                    style={{
                      color: copiedField === "password" ? "#52c41a" : "#666",
                    }}
                  />
                </div>
              </Space>
            </div>
            <div
              style={{
                background: "#fff7e6",
                border: "1px solid #ffd591",
                borderRadius: "6px",
                padding: "12px",
              }}
            >
              <Text style={{ color: "#d48806" }}>
                ⚠️ Vui lòng lưu thông tin đăng nhập này một cách an toàn. Huấn
                luyện viên sẽ cần chúng để đăng nhập.
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default AdminDashboard;
