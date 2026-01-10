import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Table,
  Tag,
  message,
  Avatar,
  Space,
  Typography,
  Spin,
  Row,
  Col,
  Alert,
  Popconfirm,
  Tooltip,
  Modal,
  Form,
  Input,
} from "antd";
import {
  CloseOutlined,
  ReloadOutlined,
  UserOutlined,
  CalendarOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import Navbar from "../../layouts/Navbar";
import "./MemberBookings.css";
import moment from "moment-timezone";

const { Title, Text } = Typography;

const MemberBookings = () => {
  const { user: _user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [reportCoachModal, setReportCoachModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

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

  const loadMyBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/appointment/my-bookings`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Không thể tải lịch đặt");
      }

      const data = await response.json();
      if (data.success) {
        setBookings(data.data);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Lỗi tải lịch đặt:", error);
      message.error("Không thể tải lịch đặt");
      setBookings([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyBookings();
  }, [loadMyBookings]);

  const handleCancelAppointment = async (sessionId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/appointment/${sessionId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể hủy cuộc hẹn");
      }

      message.success("Hủy cuộc hẹn thành công!");
      loadMyBookings(); // Reload to get updated data
    } catch (error) {
      console.error("Lỗi hủy cuộc hẹn:", error);
      message.error(error.message || "Không thể hủy cuộc hẹn");
    } finally {
      setLoading(false);
    }
  };

  const canCancelAppointment = (scheduledTime) => {
    const now = moment();
    const scheduledDateTime = moment.parseZone(scheduledTime);
    const hoursDifference = scheduledDateTime.diff(now, "hours", true);
    return hoursDifference >= 2;
  };

  const getCancelButtonTooltip = (scheduledTime) => {
    if (!canCancelAppointment(scheduledTime)) {
      const now = moment();
      const scheduledDateTime = moment.parseZone(scheduledTime);
      const hoursDifference = scheduledDateTime.diff(now, "hours", true);
      if (hoursDifference < 0) {
        return "Không thể hủy lịch hẹn đã qua";
      } else {
        return `Chỉ có thể hủy trước 2 giờ. Còn ${Math.ceil(
          hoursDifference
        )} giờ`;
      }
    }
    return "Hủy cuộc hẹn";
  };

  const handleOpenReportCoachModal = (sessionId) => {
    setCurrentSessionId(sessionId);
    setReportReason("");
    setReportCoachModal(true);
  };

  const handleReportMissingCoach = async () => {
    setModalLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/appointment/report-missing-coach`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            session_id: currentSessionId,
            reason: reportReason,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Không thể báo cáo huấn luyện viên vắng mặt"
        );
      }

      message.success("Đã báo cáo huấn luyện viên vắng mặt!");
      setReportCoachModal(false);
      loadMyBookings();
    } catch (error) {
      message.error(
        error.message || "Không thể báo cáo huấn luyện viên vắng mặt"
      );
    } finally {
      setModalLoading(false);
    }
  };

  const canReportMissingCoach = (scheduledTime) => {
    const now = moment();
    const scheduledDateTime = moment.parseZone(scheduledTime);
    return now.isSameOrAfter(scheduledDateTime);
  };

  const getReportCoachButtonTooltip = (scheduledTime) => {
    const now = moment();
    const scheduledDateTime = moment.parseZone(scheduledTime);
    if (now.isBefore(scheduledDateTime)) {
      return "Chỉ được báo cáo sau giờ hẹn";
    }
    return "Báo cáo huấn luyện viên vắng mặt";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "orange";
      case "accepted":
        return "green";
      case "rejected":
        return "red";
      case "canceled_by_member":
        return "gray";
      case "completed":
        return "blue";
      default:
        return "default";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Đang chờ";
      case "accepted":
        return "Đã chấp nhận";
      case "rejected":
        return "Đã từ chối";
      case "canceled_by_member":
        return "Đã hủy";
      case "completed":
        return "Đã hoàn thành";
      default:
        return status;
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return { date: "", time: "" };
    const local = moment.parseZone(dateTimeString);
    return {
      date: local.format("DD/MM/YYYY"),
      time: local.format("HH:mm"),
    };
  };

  const isActionable = (status) => ["pending", "accepted"].includes(status);

  const columns = [
    {
      title: "Huấn luyện viên",
      key: "coach",
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: "bold" }}>{record.coach_name}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              {record.coach_email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Thời gian dự kiến",
      key: "scheduled_time",
      render: (_, record) => {
        const { date, time } = formatDateTime(record.scheduled_time);
        return (
          <div>
            <div style={{ fontWeight: "bold" }}>{date}</div>
            <div style={{ color: "#666" }}>{time}</div>
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      key: "session_status",
      render: (_, record) => (
        <Tag color={getStatusColor(record.session_status)}>
          {getStatusText(record.session_status)}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) =>
        isActionable(record.session_status) ? (
          <Space>
            {record.session_status === "pending" && (
              <Popconfirm
                title={getCancelButtonTooltip(record.scheduled_time)}
                description="Bạn có chắc chắn muốn hủy cuộc hẹn này không? Hành động này không thể hoàn tác."
                onConfirm={() => handleCancelAppointment(record.session_id)}
                okText="Có, hủy"
                okType="danger"
                cancelText="Không"
                disabled={!canCancelAppointment(record.scheduled_time)}
              >
                <Tooltip title={getCancelButtonTooltip(record.scheduled_time)}>
                  <Button
                    type="default"
                    icon={<CloseOutlined />}
                    danger
                    loading={loading}
                    disabled={!canCancelAppointment(record.scheduled_time)}
                    style={{
                      opacity: canCancelAppointment(record.scheduled_time)
                        ? 1
                        : 0.5,
                    }}
                  />
                </Tooltip>
              </Popconfirm>
            )}
            {record.session_status === "accepted" &&
              record.google_meet_link && (
                <Tooltip title="Tham gia Google Meet">
                  <Button
                    type="primary"
                    onClick={() => {
                      // Tự cập nhật từ state (dữ liệu mới nhất từ backend)
                      const currentSession = bookings.find(
                        (a) => a.session_id === record.session_id
                      );
                      const latestLink = currentSession?.google_meet_link;

                      if (!latestLink) {
                        message.error("Không tìm thấy link cuộc họp.");
                        return;
                      }

                      window.open(
                        latestLink.startsWith("http")
                          ? latestLink
                          : `https://${latestLink}`,
                        "_blank"
                      );
                    }}
                  >
                    Tham gia cuộc họp
                  </Button>
                </Tooltip>
              )}
            {record.session_status === "accepted" && (
              <Tooltip
                title={getReportCoachButtonTooltip(record.scheduled_time)}
              >
                <Button
                  type="default"
                  icon={
                    <WarningOutlined
                      style={{
                        color: canReportMissingCoach(record.scheduled_time)
                          ? "red"
                          : "#d9d9d9",
                      }}
                    />
                  }
                  onClick={() => handleOpenReportCoachModal(record.session_id)}
                  disabled={!canReportMissingCoach(record.scheduled_time)}
                  style={{
                    opacity: canReportMissingCoach(record.scheduled_time)
                      ? 1
                      : 0.5,
                  }}
                />
              </Tooltip>
            )}
          </Space>
        ) : null,
    },
  ];

  if (initialLoading) {
    return (
      <>
        <Navbar />
        <div className="member-bookings-page">
          <div className="member-bookings-loading-container">
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
                📅 Đang tải cuộc hẹn...
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "#7f8c8d",
                  marginTop: 8,
                  fontStyle: "italic",
                }}
              >
                Chuẩn bị danh sách cuộc hẹn cho bạn
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
      <div className="member-bookings-page">
        <div className="member-bookings-wrapper">
          <div className="member-bookings-container">
            {/* Header Section */}
            <div className="member-bookings-header-section">
              <h1 className="member-bookings-header-title">
                Các cuộc hẹn của tôi
              </h1>
              <div className="member-bookings-header-badge">
                📅 Quản lý lịch hẹn huấn luyện
              </div>
              <p className="member-bookings-header-subtitle">
                Xem và quản lý các cuộc hẹn huấn luyện của bạn.
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Title level={2} style={{ display: "none" }}>
                    <CalendarOutlined /> Các cuộc hẹn của tôi
                  </Title>
                  <Text type="secondary" style={{ display: "none" }}>
                    Xem và quản lý các cuộc hẹn huấn luyện của bạn.
                  </Text>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={loadMyBookings}
                    loading={loading}
                  >
                    Làm mới
                  </Button>
                </Col>
              </Row>
            </div>

            {bookings.length === 0 ? (
              <Alert
                message="Không tìm thấy cuộc hẹn nào"
                description="Bạn chưa có cuộc hẹn huấn luyện nào. Hãy đặt lịch với một huấn luyện viên để bắt đầu hành trình bỏ thuốc của bạn!"
                type="info"
                showIcon
                action={
                  <Button size="small" type="primary" href="/book-coach">
                    Đặt lịch ngay
                  </Button>
                }
              />
            ) : (
              <Table
                columns={columns}
                dataSource={bookings}
                rowKey="session_id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} của ${total} cuộc hẹn`,
                }}
              />
            )}
          </div>
        </div>
      </div>
      {/* Modal báo cáo coach vắng mặt */}
      <Modal
        title="Báo cáo huấn luyện viên vắng mặt"
        open={reportCoachModal}
        onCancel={() => setReportCoachModal(false)}
        onOk={handleReportMissingCoach}
        confirmLoading={modalLoading}
        okText="Báo cáo"
        cancelText="Hủy"
      >
        <Form layout="vertical">
          <Form.Item label="Lý do vắng mặt" required>
            <Input.TextArea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Nhập lý do huấn luyện viên vắng mặt..."
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default MemberBookings;
