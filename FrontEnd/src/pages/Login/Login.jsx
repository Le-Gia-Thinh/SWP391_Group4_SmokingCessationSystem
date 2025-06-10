// FrontEnd/src/pages/Login.jsx
import React, { useState } from "react";
import { Form, Input, Button, Typography, Divider, message } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

import "./Login.css";

const { Title, Text } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Use AuthContext to login with MockData - Sử dụng AuthContext để đăng nhập với MockData
      const user = await login(values.email, values.password);

      // Redirect based on role - Chuyển hướng dựa trên vai trò
      if (user.role === 'admin') {
        navigate("/admin-dashboard");
      } else if (user.role === 'coach') {
        navigate("/coach-dashboard");
      } else {
        navigate("/user-dashboard");
      }

      message.success("Login successful!");
    } catch (error) {
      message.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <Title level={2} className="login-title">
          Login
        </Title>

        {/* Demo credentials - Thông tin đăng nhập demo */}
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <Text strong style={{ color: '#0c4a6e' }}>Demo Credentials:</Text>
          <br />
          <Text style={{ color: '#0369a1' }}>
            User: user@example.com / 123456
          </Text>
          <br />
          <Text style={{ color: '#0369a1' }}>
            Coach: coach@example.com / 123456
          </Text>
          <br />
          <Text style={{ color: '#0369a1' }}>
            Admin: admin@example.com / 123456
          </Text>
        </div>

        <Form name="login" layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: "Please enter your email!" }]}
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
            rules={[{ required: true, message: "Please enter your password!" }]}
          >
            <Input.Password placeholder="•••••••" />
          </Form.Item>

          <div className="forgot-password">
            <RouterLink to="/ForgetPassword">Forgot password?</RouterLink>
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              className="login-button"
              loading={loading}
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
                style={{ width: 20, marginRight: 8 }}
              />
            }
            block
            className="google-button"
            onClick={() => {
              window.location.href = "http://localhost:5000/api/auth/google";
            }}
          >
            Google
          </Button>

          <div className="signup-text">
            <Text>
              Don't have an account? <RouterLink to="/register">Sign up</RouterLink>
            </Text>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;
