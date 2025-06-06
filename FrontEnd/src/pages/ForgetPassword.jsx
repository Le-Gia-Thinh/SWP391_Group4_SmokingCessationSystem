import React from "react";
import { Form, Input, Button, Typography } from "antd";
import { MailOutlined } from "@ant-design/icons";
import axios from "axios";

import "./AuthFlow.css";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const ForgetPassword = () => {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      // Gửi API đến backend
      const res = await axios.post(
        "http://localhost:3000/api/forgot-password",
        {
          email: values.email,
        }
      );

      console.log("Yêu cầu gửi email đặt lại mật khẩu:", res.data);

      // Lưu email để dùng ở bước sau (verify/reset)
      localStorage.setItem("resetEmail", values.email);

      alert("Email hướng dẫn đặt lại mật khẩu đã được gửi.");

      // 👉 Điều hướng sang bước tiếp theo (ví dụ: /verify-code hoặc /reset-password)
      navigate("/verify-code"); // bạn có thể đổi sang "/reset-password" nếu không dùng mã xác nhận
    } catch (err) {
      console.error("Lỗi gửi email:", err.response?.data || err.message);
      alert("Gửi email thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="auth-outer-wrapper">
      <div className="auth-wrapper">
        <div className="auth-container">
          <Title level={2} className="auth-title">
            Forget password
          </Title>
          <Text className="auth-subtitle">
            Enter an email id associated with your account
          </Text>

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please input your email!" },
                { type: "email", message: "Email không hợp lệ!" },
              ]}
            >
              <Input
                placeholder="abc@gmail.com"
                type="email"
                suffix={<MailOutlined />}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                className="auth-button"
              >
                Reset Password
              </Button>
            </Form.Item>

            <Text className="auth-note">
              You will shortly receive an email with further instructions
            </Text>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ForgetPassword;
