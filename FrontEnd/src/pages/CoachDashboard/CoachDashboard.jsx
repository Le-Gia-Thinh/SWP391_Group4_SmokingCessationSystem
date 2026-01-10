import React, { useState, useEffect } from "react";
import {
  Tabs,
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  Typography,
  Alert,
  Divider,
  message,
  Modal,
  Form,
  Input,
  Badge,
  Tag,
  Spin,
} from "antd";
import {
  UserOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  RiseOutlined,
  LinkOutlined,
  CopyOutlined,
  CheckOutlined,
  EditOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  SettingOutlined,
  BellOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import StatisticCard from "../../components/ui/StatisticCard";
import FormModal from "../../components/ui/FormModal";
import BookingManagement from "../BookingManagement/BookingManagement";
import CoachChat from "../CoachChat/CoachChat";
import Navbar from "../../layouts/Navbar";
import CoachScheduleTab from "./CoachScheduleTab";
import "./CoachDashboard.css";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const CoachDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [copied, setCopied] = useState(false);
  const [meetLink, setMeetLink] = useState("");
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Stats state
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedSessions: 0,
    averageRating: 0,
    totalEarnings: 0,
  });

  // Quick stats for today
  const [todayStats, setTodayStats] = useState({
    todaySessions: 0,
    pendingRequests: 0,
    upcomingSessions: 0,
  });

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

  useEffect(() => {
    const loadData = async () => {
      if (user && user.role === "coach") {
        await fetchCoachInfo();
      }
      await loadStats();
      await loadTodayStats();
      setInitialLoading(false);
    };
    loadData();
  }, [user]);

  const fetchCoachInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/coach/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMeetLink(data.data.google_meet_link || "");
      }
    } catch (err) {
      // fallback: không set meetLink
      console.error("Error fetching coach info:", err);
    }
  };

  const loadStats = async () => {
    try {
      // Load pending appointments count
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/appointment/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const pendingData = await response.json();
        const pendingCount = pendingData.length || 0;

        setStats({
          totalBookings: 0,
          pendingBookings: pendingCount,
          confirmedBookings: 0,
          completedSessions: 0,
          averageRating: 0,
          totalEarnings: 0,
        });
      } else {
        setStats({
          totalBookings: 0,
          pendingBookings: 0,
          confirmedBookings: 0,
          completedSessions: 0,
          averageRating: 0,
          totalEarnings: 0,
        });
      }
    } catch (error) {
      console.error("Error loading stats:", error);
      setStats({
        totalBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        completedSessions: 0,
        averageRating: 0,
        totalEarnings: 0,
      });
    }
  };

  const loadTodayStats = async () => {
    try {
      // Load pending appointments for today's stats
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/appointment/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const pendingData = await response.json();
        const pendingCount = pendingData.length || 0;

        setTodayStats({
          todaySessions: 0,
          pendingRequests: pendingCount,
          upcomingSessions: 0,
        });
      } else {
        setTodayStats({
          todaySessions: 0,
          pendingRequests: 0,
          upcomingSessions: 0,
        });
      }
    } catch (error) {
      console.error("Lỗi tải thống kê hôm nay:", error);
      setTodayStats({
        todaySessions: 0,
        pendingRequests: 0,
        upcomingSessions: 0,
      });
    }
  };

  const handleCopyMeetLink = () => {
    navigator.clipboard.writeText(meetLink);
    setCopied(true);
    message.success("Liên kết Meet đã được sao chép vào clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditMeetLink = () => {
    editForm.setFieldsValue({ meetLink });
    setIsEditModalVisible(true);
  };

  // Updated to use correct API endpoint
  const handleUpdateMeetLink = async (values) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/coach/update-meet-link`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ meet_link: values.meetLink }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể cập nhật liên kết Meet");
      }

      setIsEditModalVisible(false);
      message.success("Liên kết Meet đã được cập nhật thành công!");
      // Fetch lại link mới nhất từ backend
      fetchCoachInfo();
    } catch (error) {
      console.error("Error updating meet link:", error);
      message.error(error.message || "Failed to update meet link");
    } finally {
      setLoading(false);
    }
  };

  const OverviewTab = () => (
    <div style={{ padding: "24px 0" }}>
      {/* Header */}
      <Card
        className="coach-dashboard-welcome-card"
        style={{ marginBottom: 24 }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>Chào mừng trở lại, {user?.name}! 👋</Title>
            <Text type="secondary">
              Đây là những gì đang diễn ra với các buổi huấn luyện của bạn hôm
              nay.
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<BellOutlined />}
                onClick={() => setActiveTab("bookings")}
              >
                Xem lại yêu cầu
              </Button>
              <Button
                icon={<CalendarOutlined />}
                onClick={() => setActiveTab("schedule")}
              >
                Quản lý lịch trình
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Today's Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card
            className="coach-dashboard-stats-card"
            style={{ textAlign: "center", background: "#f6ffed" }}
          >
            <ClockCircleOutlined
              style={{ fontSize: 32, color: "#52c41a", marginBottom: 8 }}
            />
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#52c41a" }}>
              {todayStats.todaySessions}
            </div>
            <Text type="secondary">Buổi học hôm nay</Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            className="coach-dashboard-stats-card"
            style={{ textAlign: "center", background: "#fff7e6" }}
          >
            <TeamOutlined
              style={{ fontSize: 32, color: "#faad14", marginBottom: 8 }}
            />
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#faad14" }}>
              {todayStats.pendingRequests}
            </div>
            <Text type="secondary">Yêu cầu đang chờ</Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            className="coach-dashboard-stats-card"
            style={{ textAlign: "center", background: "#e6f7ff" }}
          >
            <CalendarOutlined
              style={{ fontSize: 32, color: "#1890ff", marginBottom: 8 }}
            />
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#1890ff" }}>
              {todayStats.upcomingSessions}
            </div>
            <Text type="secondary">Buổi học sắp tới</Text>
          </Card>
        </Col>
      </Row>

      {/* Google Meet Link Section */}
      <Card
        className="coach-dashboard-stats-card"
        title={
          <Space>
            <LinkOutlined style={{ color: "#52c41a" }} />
            <span>Liên kết Google Meet của bạn</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
        extra={
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={handleEditMeetLink}
          >
            Cập nhật liên kết
          </Button>
        }
      >
        <Alert
          message="Quản lý liên kết Meet"
          description="Liên kết này sẽ tự động được chia sẻ với thành viên khi bạn xác nhận yêu cầu đặt lịch của họ."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <div className="coach-dashboard-meet-link-section">
          <div style={{ flex: 1 }}>
            <LinkOutlined style={{ color: "#52c41a", marginRight: 8 }} />
            <Text code style={{ fontSize: "16px" }}>
              {meetLink}
            </Text>
          </div>
          <Button
            type="primary"
            icon={copied ? <CheckOutlined /> : <CopyOutlined />}
            onClick={handleCopyMeetLink}
            style={{ marginLeft: 16 }}
          >
            {copied ? "Đã sao chép!" : "Sao chép liên kết"}
          </Button>
        </div>

        <Divider />

        <div style={{ color: "#666", fontSize: "14px" }}>
          <Text strong>Cách hoạt động:</Text>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            <li>Thành viên đặt lịch với bạn qua hệ thống đặt lịch</li>
            <li>
              Khi bạn xác nhận một lịch đặt, liên kết Meet này sẽ tự động được
              gửi cho thành viên
            </li>
            <li>
              Thành viên có thể tham gia cuộc họp bằng liên kết này vào thời
              gian đã định
            </li>
            <li>
              Bạn có thể cập nhật liên kết này bất cứ lúc nào bằng nút Cập nhật
              liên kết
            </li>
          </ul>
        </div>
      </Card>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            className="coach-dashboard-stats-card"
            title="Tổng số lượt đặt"
            value={stats.totalBookings}
            prefix={<UserOutlined style={{ color: "#1890ff" }} />}
            valueStyle={{ color: "#1890ff" }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            className="coach-dashboard-stats-card"
            title="Yêu cầu đang chờ"
            value={stats.pendingBookings}
            prefix={<ClockCircleOutlined style={{ color: "#faad14" }} />}
            valueStyle={{ color: "#faad14" }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            className="coach-dashboard-stats-card"
            title="Buổi học đã xác nhận"
            value={stats.confirmedBookings}
            prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
            valueStyle={{ color: "#52c41a" }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            className="coach-dashboard-stats-card"
            title="Buổi học đã hoàn thành"
            value={stats.completedSessions}
            prefix={<TrophyOutlined style={{ color: "#722ed1" }} />}
            valueStyle={{ color: "#722ed1" }}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={12}>
          <StatisticCard
            className="coach-dashboard-stats-card"
            title="Đánh giá trung bình"
            value={stats.averageRating}
            prefix={<RiseOutlined style={{ color: "#faad14" }} />}
            valueStyle={{ color: "#faad14" }}
            precision={1}
            suffix="/ 5"
          />
        </Col>
        <Col xs={24} sm={12} lg={12}>
          <StatisticCard
            className="coach-dashboard-stats-card"
            title="Tổng thu nhập"
            value={stats.totalEarnings}
            prefix={<TrophyOutlined style={{ color: "#52c41a" }} />}
            valueStyle={{ color: "#52c41a" }}
            suffix="$"
          />
        </Col>
      </Row>
    </div>
  );

  if (initialLoading) {
    return (
      <>
        <Navbar />
        <div className="coach-dashboard-page">
          <div className="coach-dashboard-loading-container">
            <div className="text-center">
              <div className="loading-icon">
                <Spin size="large" style={{ color: "#52c41a" }} />
              </div>
              <div
                style={{
                  fontSize: 20,
                  color: "#2c3e50",
                  fontWeight: "600",
                  textShadow: "2px 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                🏃‍♂️ Đang tải bảng điều khiển...
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "#7f8c8d",
                  marginTop: 8,
                  fontStyle: "italic",
                }}
              >
                Chuẩn bị thông tin huấn luyện viên cho bạn
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="coach-dashboard-page">
        <div className="coach-dashboard-wrapper">
          <div className="coach-dashboard-container">
            {/* Header Section */}
            <div className="coach-dashboard-header-section">
              <h1 className="coach-dashboard-header-title">
                Bảng điều khiển huấn luyện viên
              </h1>
              <div className="coach-dashboard-header-badge">
                🏃‍♂️ Quản lý buổi huấn luyện
              </div>
              <p className="coach-dashboard-header-subtitle">
                Quản lý lịch trình, theo dõi tiến trình và tương tác với thành
                viên.
              </p>
            </div>

            <Card className="coach-dashboard-tabs">
              <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
                <TabPane
                  tab={
                    <span>
                      <UserOutlined />
                      Tổng quan
                    </span>
                  }
                  key="overview"
                >
                  <OverviewTab />
                </TabPane>
                <TabPane
                  tab={
                    <span>
                      <CalendarOutlined />
                      Quản lý lịch trình
                    </span>
                  }
                  key="schedule"
                >
                  <CoachScheduleTab />
                </TabPane>
                <TabPane
                  tab={
                    <span>
                      <CheckCircleOutlined />
                      Quản lý đặt lịch
                    </span>
                  }
                  key="bookings"
                >
                  <BookingManagement />
                </TabPane>
                <TabPane
                  tab={
                    <span>
                      <MessageOutlined />
                      Chat với Member
                    </span>
                  }
                  key="chat"
                >
                  <CoachChat />
                </TabPane>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Meet Link Modal */}
      <FormModal
        title="Cập nhật liên kết Google Meet"
        visible={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onSubmit={handleUpdateMeetLink}
        form={editForm}
        loading={loading}
      >
        <Form.Item
          name="meetLink"
          label="Google Meet Link"
          rules={[
            { required: true, message: "Vui lòng nhập liên kết Google Meet!" },
          ]}
        >
          <Input
            prefix={<LinkOutlined />}
            placeholder="https://meet.google.com/xxx-xxxx-xxx"
          />
        </Form.Item>
      </FormModal>
    </>
  );
};

export default CoachDashboard;
