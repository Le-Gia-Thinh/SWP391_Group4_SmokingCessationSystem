import React, { useEffect } from "react";
import { Form, Input, Button, Typography } from "antd";
import { MailOutlined } from "@ant-design/icons";
import axios from "axios";

import "./ForgetPassword.css";

const { Title, Text } = Typography;

const ForgetPassword = () => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const onFinish = async (values) => {
    try {
      const res = await axios.post("https://your-api.com/api/forgot-password", {
        email: values.email,
      });
      console.log("Yêu cầu gửi email đặt lại mật khẩu:", res.data);
      alert("Email hướng dẫn đặt lại mật khẩu đã được gửi.");
    } catch (err) {
      console.error("Lỗi gửi email:", err.response?.data || err.message);
      alert("Gửi email thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="forget-outer-wrapper">
      <div className="forget-wrapper">
        <div className="forget-container">
          <Title level={2} className="forget-title">
            Forget password
          </Title>
          <Text className="forget-subtitle">
            Enter an email id associated with your account
          </Text>

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, message: "Please input your email!" }]}
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
                className="forget-button"
              >
                Reset password
              </Button>
            </Form.Item>

            <Text className="forget-note">
              You will shortly receive an email with further instructions
            </Text>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ForgetPassword;
