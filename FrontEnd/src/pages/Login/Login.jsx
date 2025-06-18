import React, { useState } from "react";
import { Form, Input, Button, Typography, Divider, message } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

import "./Login.css";

const { Text } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false); // ← state điều khiển hover/open

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const user = await login(values.email, values.password);
      if (user.role === "admin") navigate("/admin-dashboard");
      else if (user.role === "coach") navigate("/coach-dashboard");
      else navigate("/");
      message.success("Login successful!");
    } catch (error) {
      message.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div
        className={`outer-box${open ? " open" : ""}`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <span className="line top"></span>
        <span className="line right"></span>
        <span className="line bottom"></span>
        <span className="line left"></span>

        <div className="login-container">
          <div className="login-title">🚭 Login</div>
          <div className="form-content">
            <Form name="login" layout="vertical" onFinish={onFinish}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please enter your email!" },
                ]}
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
                rules={[
                  { required: true, message: "Please enter your password!" },
                ]}
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
                  Don't have an account?{" "}
                  <RouterLink to="/register">Sign up</RouterLink>
                </Text>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
