import React, { useEffect, useState } from "react";
import {
  Card,
  Avatar,
  Typography,
  Tag,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  message,
  Row,
  Col
} from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import Navbar from "../../layouts/Navbar";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      if (!res.ok || !data.success) throw new Error(data.message || "Cập nhật thất bại");

      message.success("🎉 Cập nhật hồ sơ thành công!");

      const refreshed = await fetch("http://localhost:5000/api/user/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const updatedUser = await refreshed.json();
      setUser({ ...updatedUser, role: updatedUser.user_role });

    } catch (err) {
      message.error("❌ Lỗi khi cập nhật hồ sơ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div style={{ textAlign: 'center', marginTop: 60 }}><Navbar />Vui lòng đăng nhập để xem thông tin cá nhân.</div>;

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: "40px auto" }}>
        <Row gutter={24}>
          {/* Cột trái: Thông tin cá nhân */}
          <Col span={12}>
            <Card style={{ borderRadius: 16, textAlign: "center" }} title={<Title level={4}>📋 Thông tin cá nhân</Title>}>
              <Avatar
                size={80}
                src={user.avatar_url}
                icon={<UserOutlined />}
                style={{ backgroundColor: '#52c41a', marginBottom: 16 }}
              />
              <Title level={4}>{user.full_name || user.email}</Title>
              <Text type="secondary">{user.email}</Text>
              <div style={{ margin: '16px 0' }}>
                <Tag color={user.role === 'admin' ? 'red' : user.role === 'coach' ? 'blue' : 'green'} style={{ fontSize: 15 }}>
                  {user.role}
                </Tag>
              </div>
              <Text>📞 SĐT: {user.phone_number || "Chưa cập nhật"}</Text><br />
              <Text>📅 Ngày sinh: {user.date_of_birth ? dayjs(user.date_of_birth).format("DD/MM/YYYY") : "Chưa cập nhật"}</Text><br />
              {user.role === 'member' && (
                <>
                  <Text>🎯 Mức độ FTND: {user.ftnd_level ?? "Chưa có"}</Text><br />
                  <Text>🗓️ Ngày đăng ký: {user.registration_date?.substring(0, 10)}</Text><br />
                  <Text>🏆 Điểm số: {user.total_points ?? 0} – Cấp độ: {user.current_level ?? "Mới"}</Text>
                </>
              )}
            </Card>
          </Col>

          {/* Cột phải: Form chỉnh sửa */}
          <Col span={12}>
            <Card title={<Title level={4}>✏️ Chỉnh sửa thông tin</Title>} style={{ borderRadius: 16 }}>
              <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item name="avatar_url" label="Link ảnh đại diện">
                  <Input />
                </Form.Item>
                <Form.Item name="phone_number" label="Số điện thoại">
                  <Input />
                </Form.Item>
                <Form.Item name="date_of_birth" label="Ngày sinh">
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item label="Mật khẩu mới">
                  <Button type="link" onClick={() => navigate('/ForgetPassword')}>
                    🔒 Đổi mật khẩu
                  </Button>
                </Form.Item>
                <Form.Item name="ftnd_level" label="Mức độ nghiện (FTND)">
                  <Select placeholder="Chọn mức độ">
                    <Option value="Low">Nhẹ</Option>
                    <Option value="Medium">Trung bình</Option>
                    <Option value="High">Nặng</Option>
                  </Select>
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading}>Cập nhật</Button>
                  <Button onClick={() => form.resetFields()} style={{ marginLeft: 12 }}>Hủy</Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default ProfilePage;
