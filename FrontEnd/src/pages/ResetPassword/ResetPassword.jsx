import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Input, Button, Typography, message } from "antd";
import axios from "axios";

const { Title, Text } = Typography;

const ResetPassword = () => {
  const { token } = useParams(); // lấy token từ URL
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, {
        newPassword: values.newPassword
      });

      message.success("Đặt lại mật khẩu thành công!");
      navigate("/login"); // về trang login
    } catch (err) {
      console.error("Lỗi reset password:", err.response?.data || err.message);
      message.error("Đặt lại mật khẩu thất bại.");
    }
  };

  return (
    <div className="auth-outer-wrapper">
      <div className="auth-wrapper">
        <div className="auth-container">
          <Title className="auth-title" level={2}>Đặt lại mật khẩu</Title>
          <Text className="auth-subtitle">Nhập mật khẩu mới của bạn</Text>

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="newPassword"
              label="Mật khẩu mới"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu mới!" }]}
            >
              <Input.Password placeholder="Mật khẩu mới" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu của bạn!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Mật khẩu không khớp!"));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Xác nhận mật khẩu" />
            </Form.Item>

            <Form.Item>
              <Button className="auth-button" type="primary" htmlType="submit" block>
                Đặt lại mật khẩu
              </Button>
            </Form.Item>
          </Form>
          <Text className="auth-note">Quay lại đăng nhập nếu bạn nhớ mật khẩu</Text>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
