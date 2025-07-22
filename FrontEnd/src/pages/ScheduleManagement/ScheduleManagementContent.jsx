// ScheduleManagementContent.jsx - Content-only version for AdminPage integration
import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  message,
  Space,
  Tag,
  Spin,
  Row,
  Col,
  Typography,
  Checkbox,
  Alert,
  Statistic,
  Avatar,
  Divider,
  Empty,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  UserOutlined,
  TeamOutlined,
  ScheduleOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import "./ScheduleManagement.css";
import dayjs from "dayjs";

const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ScheduleManagementContent = () => {
  const [coaches, setCoaches] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchCoaches = async () => {
    try {
      // Mock data for demonstration
      setCoaches([
        { id: 1, name: "Nguyễn Văn A", email: "nguyenvana@example.com" },
        { id: 2, name: "Trần Thị B", email: "tranthib@example.com" },
        { id: 3, name: "Lê Văn C", email: "levanc@example.com" },
      ]);
    } catch (err) {
      console.error("Error fetching coaches:", err);
      message.error("Không thể tải danh sách coach");
    }
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration
      setSchedules([
        {
          id: 1,
          title: "Tư vấn cai thuốc lá",
          coach: "Nguyễn Văn A",
          date: "2024-01-15",
          time: "10:00",
          duration: 60,
          status: "active",
          participants: 5,
        },
        {
          id: 2,
          title: "Nhóm hỗ trợ",
          coach: "Trần Thị B",
          date: "2024-01-16",
          time: "14:00",
          duration: 90,
          status: "completed",
          participants: 8,
        },
      ]);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      message.error("Không thể tải danh sách lịch trình");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoaches();
    fetchSchedules();
  }, []);

  const handleCreateSchedule = async (values) => {
    try {
      console.log("Create schedule:", values);
      message.success("Tạo lịch trình thành công");
      setModalVisible(false);
      form.resetFields();
      fetchSchedules();
    } catch (err) {
      console.error("Error creating schedule:", err);
      message.error("Có lỗi xảy ra khi tạo lịch trình");
    }
  };

  const handleDeleteSchedule = async (id) => {
    try {
      console.log("Delete schedule:", id);
      message.success("Xóa lịch trình thành công");
      fetchSchedules();
    } catch (err) {
      console.error("Error deleting schedule:", err);
      message.error("Có lỗi xảy ra khi xóa lịch trình");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "green";
      case "completed":
        return "blue";
      case "cancelled":
        return "red";
      default:
        return "default";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "active":
        return "Đang hoạt động";
      case "completed":
        return "Đã hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return "Không xác định";
    }
  };

  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Huấn luyện viên",
      dataIndex: "coach",
      key: "coach",
      render: (coach) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text>{coach}</Text>
        </Space>
      ),
    },
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Thời gian",
      dataIndex: "time",
      key: "time",
    },
    {
      title: "Thời lượng",
      dataIndex: "duration",
      key: "duration",
      render: (duration) => `${duration} phút`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: "Người tham gia",
      dataIndex: "participants",
      key: "participants",
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => console.log("View schedule:", record)}
          />
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => console.log("Edit schedule:", record)}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteSchedule(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="schedule-management-container">
      {/* Header with Stats */}
      <div className="schedule-management-header">
        <Row gutter={[24, 24]} align="middle">
          <Col span={12}>
            <Title level={3} style={{ margin: 0, color: "#1890ff" }}>
              <ScheduleOutlined style={{ marginRight: 8 }} />
              Quản lý lịch trình
            </Title>
            <Text type="secondary">
              Quản lý và theo dõi lịch trình huấn luyện viên
            </Text>
          </Col>
          <Col span={12}>
            <Row gutter={16} justify="end">
              <Col>
                <Statistic
                  title="Tổng lịch trình"
                  value={schedules.length}
                  prefix={<CalendarOutlined />}
                />
              </Col>
              <Col>
                <Statistic
                  title="Đang hoạt động"
                  value={schedules.filter((s) => s.status === "active").length}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <div className="schedule-management-content">
        <Card>
          <div className="schedule-header">
            <Space style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setModalVisible(true)}
              >
                Tạo lịch trình mới
              </Button>
              <Button icon={<ReloadOutlined />} onClick={fetchSchedules}>
                Làm mới
              </Button>
              <Button icon={<FilterOutlined />}>Lọc</Button>
            </Space>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "50px" }}>
              <Spin size="large" />
            </div>
          ) : schedules.length === 0 ? (
            <Empty
              description="Chưa có lịch trình nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table
              columns={columns}
              dataSource={schedules}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} lịch trình`,
              }}
            />
          )}
        </Card>
      </div>

      {/* Create Schedule Modal */}
      <Modal
        title="Tạo lịch trình mới"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateSchedule}>
          <Form.Item
            label="Tiêu đề"
            name="title"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input placeholder="Nhập tiêu đề lịch trình" />
          </Form.Item>

          <Form.Item
            label="Huấn luyện viên"
            name="coachId"
            rules={[
              { required: true, message: "Vui lòng chọn huấn luyện viên" },
            ]}
          >
            <Select placeholder="Chọn huấn luyện viên">
              {coaches.map((coach) => (
                <Option key={coach.id} value={coach.id}>
                  {coach.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Ngày"
                name="date"
                rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Thời gian"
                name="time"
                rules={[{ required: true, message: "Vui lòng chọn thời gian" }]}
              >
                <TimePicker style={{ width: "100%" }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Thời lượng (phút)"
            name="duration"
            rules={[{ required: true, message: "Vui lòng nhập thời lượng" }]}
          >
            <Input type="number" placeholder="60" />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={4} placeholder="Nhập mô tả lịch trình" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Tạo lịch trình
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ScheduleManagementContent;
