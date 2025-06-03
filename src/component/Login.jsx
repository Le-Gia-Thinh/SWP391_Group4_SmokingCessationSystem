import React from "react";
import { Form, Input, Button, Typography, Divider } from "antd";
import { MailOutlined } from "@ant-design/icons";
import axios from "axios";
import { Link as RouterLink } from "react-router-dom"; // đổi tên để tránh trùng
import "./Login.css";

const { Title, Text, Link } = Typography;

const Login = () => {
  const onFinish = async (values) => {
    try {
      const res = await axios.post("http://localhost:3000/api/login", values);
      console.log("Đăng nhập thành công:", res.data);
    } catch (err) {
      console.error("Đăng nhập thất bại:", err.response?.data || err.message);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <Title level={2} className="login-title">
          Login
        </Title>

        <Form name="login" layout="vertical" onFinish={onFinish}>
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

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password placeholder="**********" />
          </Form.Item>

          <div className="forgot-password">
            <Link href="#">Forget password?</Link>
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              className="login-button"
            >
              Login
            </Button>
          </Form.Item>

          <Divider>or continue with</Divider>

          <Button
            icon={
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="google"
                className="google-icon"
              />
            }
            block
            className="google-button"
          >
            Google
          </Button>

          <div className="signup-text">
            <Text>
              Don’t have an account? <RouterLink to="/register">Sign up</RouterLink>
            </Text>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;
