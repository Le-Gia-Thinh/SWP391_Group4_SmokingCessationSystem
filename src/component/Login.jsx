import React from "react";
import { Form, Input, Button, Typography, Divider } from "antd";
import { MailOutlined, LockOutlined, GoogleOutlined } from "@ant-design/icons";
import axios from "axios";

//Rút gọn gọi Typography.Title thành Title, Text, Link
const { Title, Text, Link } = Typography;

const Login = () => {
  const onFinish = async (values) => {
    try {
      const res = await axios.post("http://localhost:3000/api/login", values);

      console.log("Đăng nhập thành công:", res.data);
      // TODO: lưu token, điều hướng sang dashboard,...
    } catch (err) {
      console.error("Đăng nhập thất bại:", err.response?.data || err.message);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#fff",
      }}
    >
      <div style={{ width: 350 }}>
        <Title level={2} style={{ textAlign: "center" }}>
          Login
        </Title>

        <Form name="login" layout="vertical" onFinish={onFinish}>
          {/* Email Field */}
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

          {/* Password Field */}
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password placeholder="**********" />
          </Form.Item>

          <div style={{ textAlign: "right", marginBottom: 16 }}>
            <Link href="#">Forget password?</Link>
          </div>

          {/* Login Button */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              style={{
                backgroundColor: "#4BAC4F",
                borderColor: "#4BAC4F",
                color: "#fff",
                fontWeight: "500",
                height: 40,
                borderRadius: 8,
              }}
            >
              Login
            </Button>
          </Form.Item>

          {/* Divider */}
          <Divider>or continue with</Divider>

          {/* Google login button */}
          <Button
            icon={
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="google"
                style={{ width: 18, height: 18 }}
              />
            }
            block
            style={{
              backgroundColor: "#f2fef2",
              borderColor: "#d0f0d0",
              color: "#333",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 10,
              height: 40,
            }}
          >
            Google
          </Button>

          {/* Sign Up */}
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <Text>
              Don’t have an account? <Link href="#">Sign up</Link>
            </Text>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;
