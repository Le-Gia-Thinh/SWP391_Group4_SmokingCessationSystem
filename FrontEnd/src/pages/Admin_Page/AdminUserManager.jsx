import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Table,
  Button,
  Space,
  Popconfirm,
  Modal,
  Form,
  Input,
  message,
  Select,
  Card,
  Typography,
  Badge,
  Avatar,
  Tooltip,
  Tag,
  Row,
  Col,
  Divider,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  LockOutlined,
  UnlockOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import "./AdminPage.css";

const { Option } = Select;
const { Title, Text } = Typography;

export default function AdminUserManager() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ visible: false, record: null });
  const [searchText, setSearchText] = useState("");
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [form] = Form.useForm();

  // Cho phép scroll background khi modal mở
  useEffect(() => {
    if (modal.visible) {
      document.body.style.overflow = "unset";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modal.visible]);

  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );
  const baseURL = import.meta.env.VITE_API_URL || "";

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseURL}/api/admin/members`, { headers });
      setMembers(res.data.data);
      setFilteredMembers(res.data.data);
    } catch (error) {
      console.error("Error fetching members:", error);
      message.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  }, [baseURL, headers]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Search functionality
  useEffect(() => {
    const filtered = members.filter((member) =>
      Object.values(member).some((value) =>
        String(value).toLowerCase().includes(searchText.toLowerCase())
      )
    );
    setFilteredMembers(filtered);
  }, [members, searchText]);

  const openModal = (record) => {
    setModal({ visible: true, record });
    form.setFieldsValue(record);
  };

  const save = async (values) => {
    try {
      await axios.put(
        `${baseURL}/api/admin/members/${modal.record.user_id}`,
        values,
        { headers }
      );
      message.success("Cập nhật thành công");
      fetchMembers();
      setModal({ visible: false, record: null });
    } catch (error) {
      console.error("Error updating user:", error);
      message.error("Lỗi khi cập nhật người dùng");
    }
  };

  const lockUser = async (id) => {
    try {
      await axios.patch(
        `${baseURL}/api/admin/members/${id}/lock`,
        {},
        { headers }
      );
      message.success("Đã khóa tài khoản");
      fetchMembers();
    } catch (error) {
      console.error("Error locking user:", error);
      message.error("Lỗi khi khóa tài khoản");
    }
  };

  const unlockUser = async (id) => {
    try {
      await axios.patch(
        `${baseURL}/api/admin/members/${id}/unlock`,
        {},
        { headers }
      );
      message.success("Đã mở khóa tài khoản");
      fetchMembers();
    } catch (error) {
      console.error("Error unlocking user:", error);
      message.error("Lỗi khi mở khóa tài khoản");
    }
  };

  const deleteUser = async (id) => {
    try {
      await axios.delete(`${baseURL}/api/admin/members/${id}`, { headers });
      message.success("Đã xóa người dùng");
      fetchMembers();
    } catch (error) {
      console.error("Error deleting user:", error);
      message.error("Lỗi khi xóa người dùng");
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      active: {
        color: "success",
        text: "Hoạt động",
        gradient: "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)",
        icon: "🟢",
      },
      inactive: {
        color: "warning",
        text: "Tạm khóa",
        gradient: "linear-gradient(135deg, #faad14 0%, #ffc53d 100%)",
        icon: "🟡",
      },
      banned: {
        color: "error",
        text: "Bị cấm",
        gradient: "linear-gradient(135deg, #f5222d 0%, #ff7875 100%)",
        icon: "🔴",
      },
    };
    const config = statusConfig[status] || {
      color: "default",
      text: status,
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
  };

  return (
    <div className="admin-user-manager container-fluid px-0">
      {/* Modern Header Section */}
      <div className="row mb-4 mx-0">
        <div className="col-12">
          <div className="admin-user-manager-header">
            <div className="d-flex justify-content-between align-items-center flex-wrap">
              <div className="mb-3 mb-md-0">
                <Title level={3} className="mb-2 fw-bold">
                  <UserOutlined className="me-3" style={{ margin: 0 }} />
                  Quản lý người dùng
                </Title>
                <Text className="fs-6">
                  Quản lý thông tin và trạng thái tài khoản người dùng
                </Text>
              </div>
              <div className="d-flex gap-2">
                <Input
                  placeholder="Tìm kiếm người dùng..."
                  prefix={<SearchOutlined style={{ margin: 0 }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="admin-user-manager-search-input"
                  style={{ width: 300 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4 mx-0">
        <div className="col-md-3 mb-3">
          <Card className="admin-user-manager-stat-card h-100">
            <div className="d-flex align-items-center">
              <div className="bg-primary bg-opacity-10 rounded-3 p-3 me-3">
                <UserOutlined
                  className="fs-4 text-primary"
                  style={{ margin: 0 }}
                />
              </div>
              <div>
                <Text type="secondary" className="d-block mb-1">
                  Tổng người dùng
                </Text>
                <Title level={4} className="mb-0 text-primary">
                  {members.length}
                </Title>
              </div>
            </div>
          </Card>
        </div>
        <div className="col-md-3 mb-3">
          <Card className="admin-user-manager-stat-card h-100">
            <div className="d-flex align-items-center">
              <div className="bg-success bg-opacity-10 rounded-3 p-3 me-3">
                <UnlockOutlined
                  className="fs-4 text-success"
                  style={{ margin: 0 }}
                />
              </div>
              <div>
                <Text type="secondary" className="d-block mb-1">
                  Đang hoạt động
                </Text>
                <Title level={4} className="mb-0 text-success">
                  {members.filter((m) => m.account_status === "active").length}
                </Title>
              </div>
            </div>
          </Card>
        </div>
        <div className="col-md-3 mb-3">
          <Card className="admin-user-manager-stat-card h-100">
            <div className="d-flex align-items-center">
              <div className="bg-warning bg-opacity-10 rounded-3 p-3 me-3">
                <LockOutlined
                  className="fs-4 text-warning"
                  style={{ margin: 0 }}
                />
              </div>
              <div>
                <Text type="secondary" className="d-block mb-1">
                  Tạm khóa
                </Text>
                <Title level={4} className="mb-0 text-warning">
                  {
                    members.filter((m) => m.account_status === "inactive")
                      .length
                  }
                </Title>
              </div>
            </div>
          </Card>
        </div>
        <div className="col-md-3 mb-3">
          <Card className="admin-user-manager-stat-card h-100">
            <div className="d-flex align-items-center">
              <div className="bg-danger bg-opacity-10 rounded-3 p-3 me-3">
                <DeleteOutlined
                  className="fs-4 text-danger"
                  style={{ margin: 0 }}
                />
              </div>
              <div>
                <Text type="secondary" className="d-block mb-1">
                  Bị cấm
                </Text>
                <Title level={4} className="mb-0 text-danger">
                  {members.filter((m) => m.account_status === "banned").length}
                </Title>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Table */}
      <div className="row mx-0">
        <div className="col-12 px-0">
          <Table
            rowKey="user_id"
            loading={loading}
            dataSource={filteredMembers}
            className="admin-user-manager-table w-100"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showQuickJumper: false,
              showTotal: false,
              className: "admin-user-manager-pagination",
              size: "default",
            }}
            size="middle"
            bordered={true}
            columns={[
              {
                title: "Người dùng",
                key: "user_info",
                render: (_, record) => (
                  <div className="d-flex align-items-center py-2">
                    <Avatar
                      size={45}
                      icon={<UserOutlined style={{ margin: 0 }} />}
                      className="me-3 shadow-sm"
                      style={{
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        border: "3px solid white",
                        boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                      }}
                    />
                    <div className="flex-grow-1">
                      <div className="fw-bold text-dark mb-1 fs-6">
                        {record.full_name || record.username}
                      </div>
                      <Text type="secondary" className="small d-block">
                        @{record.username}
                      </Text>
                    </div>
                  </div>
                ),
              },
              {
                title: "Thông tin liên hệ",
                key: "contact_info",
                render: (_, record) => (
                  <div className="py-1">
                    <div className="d-flex align-items-center mb-2">
                      <MailOutlined
                        className="text-primary me-2 fs-6"
                        style={{ margin: 0 }}
                      />
                      <Text className="small fw-medium">{record.email}</Text>
                    </div>
                    {record.phone_number && (
                      <div className="d-flex align-items-center">
                        <PhoneOutlined
                          className="text-success me-2 fs-6"
                          style={{ margin: 0 }}
                        />
                        <Text className="small fw-medium">
                          {record.phone_number}
                        </Text>
                      </div>
                    )}
                  </div>
                ),
              },
              {
                title: "Ngày sinh",
                dataIndex: "date_of_birth",
                render: (date) => (
                  <div className="d-flex align-items-center py-1">
                    <CalendarOutlined
                      className="text-info me-2 fs-6"
                      style={{ margin: 0 }}
                    />
                    <Text className="small fw-medium">
                      {date ? dayjs(date).format("DD/MM/YYYY") : "—"}
                    </Text>
                  </div>
                ),
              },
              {
                title: "Ngày đăng ký",
                dataIndex: "registration_date",
                render: (date) => (
                  <div className="d-flex align-items-center py-1">
                    <CalendarOutlined className="text-warning me-2 fs-6" />
                    <Text className="small fw-medium">
                      {date ? dayjs(date).format("DD/MM/YYYY") : "—"}
                    </Text>
                  </div>
                ),
              },
              {
                title: "Trạng thái",
                dataIndex: "account_status",
                align: "center",
                render: (status) => (
                  <div className="d-flex justify-content-center">
                    {getStatusTag(status)}
                  </div>
                ),
              },
              {
                title: "Hành động",
                key: "actions",
                align: "center",
                render: (_, record) => (
                  <Space size="small" className="d-flex justify-content-center">
                    <Tooltip title="Chỉnh sửa thông tin">
                      <Button
                        type="primary"
                        size="middle"
                        shape="circle"
                        icon={<EditOutlined />}
                        onClick={() => openModal(record)}
                        className="aum-action-btn aum-edit-btn"
                        style={{
                          boxShadow: "0 2px 8px #1677ff33",

                          marginRight: 8,
                        }}
                      />
                    </Tooltip>

                    {record.account_status === "inactive" ? (
                      <Tooltip title="Mở khóa tài khoản">
                        <Button
                          type="default"
                          size="middle"
                          shape="circle"
                          icon={<UnlockOutlined />}
                          onClick={() => unlockUser(record.user_id)}
                          className="aum-action-btn aum-unlock-btn"
                          style={{
                            boxShadow: "0 2px 8px #52c41a33",
                            transition: "transform 0.2s",
                            marginRight: 8,
                          }}
                        />
                      </Tooltip>
                    ) : (
                      <Tooltip title="Khóa tài khoản">
                        <Button
                          type="default"
                          size="middle"
                          shape="circle"
                          icon={<LockOutlined />}
                          onClick={() => lockUser(record.user_id)}
                          className="aum-action-btn aum-lock-btn"
                          style={{
                            boxShadow: "0 2px 8px #faad1433",
                            transition: "transform 0.2s",
                            marginRight: 8,
                          }}
                        />
                      </Tooltip>
                    )}

                    <Popconfirm
                      title="Xác nhận xóa?"
                      description="Bạn có chắc chắn muốn cấm người dùng này không?"
                      onConfirm={() => deleteUser(record.user_id)}
                      okText="Có"
                      cancelText="Không"
                      okButtonProps={{
                        danger: true,
                        className: "rounded-pill fw-bold",
                      }}
                      cancelButtonProps={{ className: "rounded-pill fw-bold" }}
                    >
                      <Tooltip title="Cấm người dùng">
                        <Button
                          danger
                          type="primary"
                          size="middle"
                          shape="circle"
                          icon={<DeleteOutlined />}
                          className="aum-action-btn aum-delete-btn"
                          style={{
                            boxShadow: "0 2px 8px #ff4d4f33",
                            transition: "transform 0.2s",
                          }}
                        />
                      </Tooltip>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </div>
      </div>

      {/* Enhanced Modal */}
      <Modal
        open={modal.visible}
        title={
          <div className="d-flex align-items-center">
            <EditOutlined className="me-2 text-primary" />
            <span className="fw-bold">Chỉnh sửa thông tin người dùng</span>
          </div>
        }
        onCancel={() => {
          setModal({ visible: false, record: null });
          form.resetFields();
        }}
        onOk={() => form.validateFields().then(save)}
        okText="Cập nhật"
        cancelText="Hủy"
        width={600}
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
        okButtonProps={{
          className:
            "admin-user-manager-action-btn admin-user-manager-edit-btn px-4",
        }}
        cancelButtonProps={{
          className: "px-4",
        }}
      >
        <Divider className="my-3" />
        <Form form={form} layout="vertical" className="admin-user-manager-form">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="full_name"
                label={
                  <span className="fw-semibold">
                    <UserOutlined className="me-2" />
                    Họ tên
                  </span>
                }
                rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
              >
                <Input placeholder="Nhập họ tên" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label={
                  <span className="fw-semibold">
                    <MailOutlined className="me-2" />
                    Email
                  </span>
                }
                rules={[
                  { required: true, message: "Vui lòng nhập email" },
                  { type: "email", message: "Email không hợp lệ" },
                ]}
              >
                <Input placeholder="Nhập email" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone_number"
                label={
                  <span className="fw-semibold">
                    <PhoneOutlined className="me-2" />
                    Số điện thoại
                  </span>
                }
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="account_status"
                label={
                  <span className="fw-semibold">Trạng thái tài khoản</span>
                }
                rules={[
                  { required: true, message: "Vui lòng chọn trạng thái" },
                ]}
              >
                <Select placeholder="Chọn trạng thái">
                  <Option value="active">
                    <Badge color="green" className="me-2" />
                    Hoạt động
                  </Option>
                  <Option value="inactive">
                    <Badge color="orange" className="me-2" />
                    Tạm khóa
                  </Option>
                  <Option value="banned">
                    <Badge color="red" className="me-2" />
                    Cấm
                  </Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
