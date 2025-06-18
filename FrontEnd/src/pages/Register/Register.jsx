import React, { useEffect, useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { Form, Input, Button, Typography } from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  LockOutlined,
  PushpinOutlined,
  PushpinFilled,
} from "@ant-design/icons";
import axios from "axios";
import "./Register.css";

const { Text } = Typography;

const Register = () => {
  // Disable page scroll while register open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);

  const onFinish = async (values) => {
    try {
      await axios.post("http://localhost:5000/api/auth/register", values);
      navigate("/login");
    } catch (err) {
      alert("Đăng ký thất bại!");
    }
  };

  const handleMouseEnter = () => setOpen(true);
  const handleMouseLeave = () => {
    if (!pinned) setOpen(false);
  };

  return (
    <div className="register-wrapper">
      <div
        className={`register-outer-box${open || pinned ? " open" : ""}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* animated border lines */}
        <span className="line top" />
        <span className="line right" />
        <span className="line bottom" />
        <span className="line left" />

        {/* pin icon outside */}
        <span
          className="pin-icon-register"
          onClick={() => setPinned(!pinned)}
          style={{ position: 'absolute', top: 8, right: 8, cursor: 'pointer', fontSize: 18 }}
        >
          {pinned ? <PushpinFilled /> : <PushpinOutlined />}
        </span>

        <div className="register-container">
          <div className="register-title">📝 Sign up 💪</div>

          <div className="register-form-content">
            <Form layout="vertical" onFinish={onFinish}>
              <Form.Item
                label="Name"
                name="name"
                rules={[{ required: true, message: "Please enter your name!" }]}
              >
                <Input placeholder="Your full name" suffix={<UserOutlined />} />
              </Form.Item>

              <Form.Item
                label="Mobile no."
                name="phone_number"
                rules={[
                  { required: true, message: "Please enter your phone number!" },
                  { pattern: /^\d{10}$/, message: "Phone number must be exactly 10 digits." },
                ]}
              >
                <Input placeholder="0123456789" maxLength={10} suffix={<PhoneOutlined />} />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Please enter your email!" },
                  { type: "email", message: "Invalid email address" },
                ]}
              >
                <Input placeholder="abc@gmail.com" type="email" suffix={<MailOutlined />} />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: "Please enter your password!" },
                  { min: 6, message: "Password must be at least 6 characters." },
                ]}
              >
                <Input.Password placeholder="********" suffix={<LockOutlined />} />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block className="register-button">
                  Get started
                </Button>
              </Form.Item>

              <div className="signup-text">
                <Text>
                  Already have an account? <RouterLink to="/login">Sign in</RouterLink>
                </Text>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
