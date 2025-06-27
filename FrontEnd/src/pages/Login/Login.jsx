import React, { useState, useRef, useEffect } from "react";
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

  // ref để giữ timer
  const leaveTimerRef = useRef(null);

  const onFinish = async (values) => {    // bỏ đi ": any"
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

  const handleMouseEnter = () => {
    // nếu có timer, hủy nó
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    if (pinned) return; // nếu đã pin thì không đóng
    // đặt timer 5s sau mới đóng
    leaveTimerRef.current = setTimeout(() => {
      setOpen(false);
      leaveTimerRef.current = null;
    }, 5000);
  };

  useEffect(() => {
    // cleanup khi unmount
    return () => {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="login-wrapper">
      <div
        className={`outer-box${open || pinned ? " open" : ""}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="line top" />
        <span className="line right" />
        <span className="line bottom" />
        <span className="line left" />

        <span
          className="pin-icon"
          onClick={() => {
            // khi nhấn pin, đảo trạng thái pinned
            setPinned(prev => !prev);
            // nếu mới được unpin thì hủy timer nếu có
            if (!pinned && leaveTimerRef.current) {
              clearTimeout(leaveTimerRef.current);
              leaveTimerRef.current = null;
            }
          }}
          style={{ position: 'absolute', top: 8, right: 8, cursor: 'pointer', fontSize: 18 }}
        >
          {pinned ? <PushpinFilled /> : <PushpinOutlined />}
        </span>

        <div className="login-container">
          <div className="login-title">🚭 Đăng nhập</div>

          <div className="form-content">
            <Form name="login" layout="vertical" onFinish={onFinish}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, message: "Vui lòng nhập email của bạn!" }]}
              >
                <Input placeholder="abc@gmail.com" type="email" suffix={<MailOutlined />} />
              </Form.Item>

              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[{ required: true, message: "Vui lòng nhập mật khẩu của bạn!" }]}
              >
                <Input.Password placeholder="•••••••" />
              </Form.Item>

              {errorMessage && (
                <Text type="danger" style={{ display: "block", marginBottom: 16 }}>
                  {errorMessage}
                </Text>
              )}

              <div className="forgot-password">
                <RouterLink to="/ForgetPassword">Quên mật khẩu?</RouterLink>
              </div>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  className="login-button"
                  loading={loading}
                >
                  Đăng nhập
                </Button>
              </Form.Item>

              <Divider>hoặc tiếp tục với</Divider>

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
                onClick={() => {
                  window.location.href = "http://localhost:5000/api/auth/google";
                }}
              >
                Google
              </Button>

              <div className="signup-text">
                <Text>
                  Chưa có tài khoản? <RouterLink to="/register">Đăng ký</RouterLink>
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
