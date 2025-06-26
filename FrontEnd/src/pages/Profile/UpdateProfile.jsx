import React, { useEffect, useState } from "react";
import { Form, Input, Button, DatePicker, Select, message, Typography, Card } from "antd";
import dayjs from "dayjs";
import { useAuth } from "../../contexts/AuthContext";
import Navbar from "../../layouts/Navbar";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;
const { Option } = Select;

const UpdateProfile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

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

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Cập nhật thất bại");
      }

      message.success("🎉 Cập nhật hồ sơ thành công!");

      // Lấy lại thông tin mới
      const refreshed = await fetch("http://localhost:5000/api/user/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const updatedUser = await refreshed.json();
      setUser({ ...updatedUser, role: updatedUser.user_role });

      // Delay ngắn giúp tránh update state và chuyển trang bị lệch nhau
      setTimeout(() => {
        navigate("/profile");
      }, 150);

    } catch (error) {
      message.error("❌ Lỗi khi cập nhật hồ sơ: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 600, margin: "40px auto" }}>
        <Card title={<Title level={3}>✏️ Chỉnh sửa thông tin</Title>} bordered style={{ borderRadius: 16 }}>
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
              <Button type="primary" htmlType="submit" loading={loading}>
                Cập nhật
              </Button>
              <Button onClick={() => navigate("/profile")} style={{ marginLeft: 12 }}>
                Hủy
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </>
  );
};

export default UpdateProfile;