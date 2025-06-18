import React, { useState } from "react";
import { Form, Input, Button, Typography, Divider } from "antd";
import { MailOutlined, PushpinOutlined, PushpinFilled } from "@ant-design/icons";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

import "./Login.css";

const { Text } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onFinish = async (values) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const user = await login(values.email, values.password);
      if (user.role === "admin") navigate("/admin-dashboard");
      else if (user.role === "coach") navigate("/coach-dashboard");
      else navigate("/");
    } catch {
      setErrorMessage("Sai email hoặc mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = () => setOpen(true);
  const handleMouseLeave = () => {
    if (!pinned) setOpen(false);
  };

  return (
    <div className="login-wrapper">
      <div
        className={`outer-box${open || pinned ? " open" : ""}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* animated border lines */}
        <span className="line top" />
        <span className="line right" />
        <span className="line bottom" />
        <span className="line left" />

        {/* pin icon outside the container box */}
        <span
          className="pin-icon"
          onClick={() => setPinned(!pinned)}
          style={{ position: 'absolute', top: 8, right: 8, cursor: 'pointer', fontSize: 18 }}
        >
          {pinned ? <PushpinFilled /> : <PushpinOutlined />}
        </span>

        <div className="login-container">
          <div className="login-title">🚭 Login</div>

          <div className="form-content">
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

              {errorMessage && (
                <Text type="danger" style={{ display: "block", marginBottom: 16 }}>
                  {errorMessage}
                </Text>
              )}

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
                icon={<img src="https://developers.google.com/identity/images/g-logo.png" alt="google" className="google-icon" />}
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
      </div>
    </div>
  );
};

export default Login;
