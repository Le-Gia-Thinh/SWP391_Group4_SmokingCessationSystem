import React, { useEffect, useState } from "react";
import {
  Card,
  Avatar,
  Typography,
  Tag,
  Form,
  Input,
  DatePicker,
  Button,
  message,
  Row,
  App,
  Col,
  Layout,
} from "antd";
import { UserOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import styles from "./Profile.module.css";

const { Title, Text } = Typography;
const { Content } = Layout;

const ProfilePage = () => {
  const { user, setUser, refreshUser } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // Handle back navigation
  const handleGoBack = () => {
    window.history.back();
  };

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        phone_number: user.phone_number,
        date_of_birth: user.date_of_birth ? dayjs(user.date_of_birth) : null,
        email: user.email,
        ftnd_level: user.ftnd_level,
      });
    }
  }, [user, form]);

  const { message: messageApi } = App.useApp();

  const onFinish = async (values) => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...values,
          date_of_birth: values.date_of_birth?.format("YYYY-MM-DD"),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Cập nhật thất bại");
      }

      // ✅ Sử dụng messageApi
      messageApi.success("🎉 Cập nhật hồ sơ thành công!");

      // Cập nhật user state
      setUser(prevUser => ({
        ...prevUser,
        ...values,
        date_of_birth: values.date_of_birth?.format("YYYY-MM-DD"),
      }));

      // Refresh từ server
      try {
        const refreshRes = await fetch("http://localhost:5000/api/user/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setUser({ ...refreshData, role: refreshData.user_role });
          localStorage.setItem("user", JSON.stringify(refreshData));
        }
      } catch (refreshError) {
        console.error("Error refreshing user data:", refreshError);
      }

    } catch (err) {
      console.error("Error updating profile:", err);
      messageApi.error("❌ Lỗi khi cập nhật hồ sơ: " + err.message);
    } finally {
      setLoading(false);
    }
  };
  if (!user) {
    return (
      <div
        className={styles.profileLoadingContainer}
        style={{ height: "100vh" }}
      >
        <div style={{ textAlign: "center" }}>
          <Title level={3}>Vui lòng đăng nhập để xem thông tin cá nhân.</Title>
          <Button type="primary" onClick={() => navigate("/login")}>
            Đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <Content style={{ padding: 0 }}>
        {/* Header with back button */}
        <div className={styles.profileHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              size="large"
              onClick={handleGoBack}
              className={styles.profileBackBtn}
            >
              Quay lại
            </Button>
            <Title level={2} style={{ margin: 0, color: "#1890ff" }}>
              Thông tin cá nhân
            </Title>
          </div>
        </div>

        {/* Main content */}
        <div className={styles.profileContent}>
          <div
            style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 16px" }}
          >
            <Row gutter={[24, 24]} justify="center">
              {/* Profile Information Card */}
              <Col xs={24} lg={10} xl={8}>
                <Card
                  className={styles.profileInfoCard}
                  style={{
                    borderRadius: 16,
                    textAlign: "center",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    border: "none",
                    height: "100%",
                  }}
                >
                  <div className={styles.profileAvatarSection}>
                    <Avatar
                      size={120}
                      src={user.avatar_url}
                      icon={<UserOutlined />}
                      style={{
                        backgroundColor: "#52c41a",
                        marginBottom: 16,
                        border: "4px solid #fff",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      }}
                    />
                    <Title
                      level={3}
                      style={{ marginBottom: 8, color: "#262626" }}
                    >
                      {user.full_name || user.email}
                    </Title>
                    <Text type="secondary" style={{ fontSize: "16px" }}>
                      {user.email}
                    </Text>
                  </div>

                  <div className={styles.profileRoleSection}>
                    <Tag
                      color={
                        user.role === "admin"
                          ? "red"
                          : user.role === "coach"
                            ? "blue"
                            : "green"
                      }
                      style={{
                        fontSize: "14px",
                        padding: "4px 12px",
                        borderRadius: "16px",
                        fontWeight: "bold",
                      }}
                    >
                      {user.role?.toUpperCase()}
                    </Tag>
                  </div>

                  <div className={styles.profileDetailsSection}>
                    <div className={styles.profileDetailItem}>
                      <Text strong style={{ color: "#1890ff" }}>
                        📞 Số điện thoại:
                      </Text>
                      <br />
                      <Text style={{ fontSize: "16px" }}>
                        {user.phone_number || "Chưa cập nhật"}
                      </Text>
                    </div>

                    <div className={styles.profileDetailItem}>
                      <Text strong style={{ color: "#1890ff" }}>
                        📅 Ngày sinh:
                      </Text>
                      <br />
                      <Text style={{ fontSize: "16px" }}>
                        {user.date_of_birth
                          ? dayjs(user.date_of_birth).format("DD/MM/YYYY")
                          : "Chưa cập nhật"}
                      </Text>
                    </div>

                    {user.role === "member" && (
                      <>
                        <div className={styles.profileDetailItem}>
                          <Text strong style={{ color: "#1890ff" }}>
                            🎯 Mức độ FTND:
                          </Text>
                          <br />
                          <Text style={{ fontSize: "16px" }}>
                            {user.ftnd_level ?? "Chưa có"}
                          </Text>
                        </div>

                        <div className={styles.profileDetailItem}>
                          <Text strong style={{ color: "#1890ff" }}>
                            🗓️ Ngày đăng ký:
                          </Text>
                          <br />
                          <Text style={{ fontSize: "16px" }}>
                            {user.registration_date?.substring(0, 10)}
                          </Text>
                        </div>

                        <div className={styles.profileDetailItem}>
                          <Text strong style={{ color: "#1890ff" }}>
                            🏆 Thành tích:
                          </Text>
                          <br />
                          <Text style={{ fontSize: "16px" }}>
                            {user.total_points ?? 0} điểm – Cấp độ:{" "}
                            {user.current_level ?? "Mới"}
                          </Text>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              </Col>

              {/* Edit Form Card */}
              <Col xs={24} lg={14} xl={16}>
                <Card
                  className={styles.profileEditCard}
                  title={
                    <Title level={3} style={{ margin: 0, color: "#1890ff" }}>
                      ✏️ Chỉnh sửa thông tin
                    </Title>
                  }
                  style={{
                    borderRadius: 16,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    border: "none",
                  }}
                >
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    size="large"
                  >
                    <Row gutter={[16, 0]}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="avatar_url"
                          label={<Text strong>Link ảnh đại diện</Text>}
                        >
                          <Input placeholder="Nhập link ảnh đại diện" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item
                          name="phone_number"
                          label={<Text strong>Số điện thoại</Text>}
                        >
                          <Input placeholder="Nhập số điện thoại" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item
                          name="date_of_birth"
                          label={<Text strong>Ngày sinh</Text>}
                        >
                          <DatePicker
                            style={{ width: "100%" }}
                            placeholder="Chọn ngày sinh"
                            format="DD/MM/YYYY"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item label={<Text strong>Mật khẩu</Text>}>
                          <Button
                            type="default"
                            onClick={() => navigate("/ForgetPassword")}
                            style={{ width: "100%" }}
                          >
                            🔒 Đổi mật khẩu
                          </Button>
                        </Form.Item>
                      </Col>

                      <Col xs={24}>
                        <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
                          <div style={{ display: "flex", gap: "12px" }}>
                            <Button
                              type="primary"
                              htmlType="submit"
                              loading={loading}
                              size="large"
                              style={{ minWidth: "120px" }}
                            >
                              Cập nhật
                            </Button>
                            <Button
                              onClick={() => form.resetFields()}
                              size="large"
                              style={{ minWidth: "120px" }}
                            >
                              Hủy
                            </Button>
                          </div>
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>
                </Card>
              </Col>
            </Row>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default ProfilePage;
