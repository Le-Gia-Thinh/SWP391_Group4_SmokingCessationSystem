import React, { useEffect, useState, useRef } from "react";
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
  const leaveTimerRef = useRef(null);

  const onFinish = async (values) => {
    try {
      await axios.post("http://localhost:5000/api/auth/register", values);
      navigate("/login");
    } catch (err) {
      alert("Đăng ký thất bại!");
    }
  };

  const handleMouseEnter = () => {
    // nếu có timer đang chờ thì hủy
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    // nếu đã pin thì không auto-close
    if (pinned) return;
    // sau 5s mới setOpen(false)
    leaveTimerRef.current = setTimeout(() => {
      setOpen(false);
      leaveTimerRef.current = null;
    }, 5000);
  };

  // cleanup khi unmount
  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

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

        {/* pin icon */}
        <span
          className="pin-icon-register"
          onClick={() => {
            setPinned((prev) => !prev);
            // nếu vừa unpin thì clear timer nếu có
            if (!pinned && leaveTimerRef.current) {
              clearTimeout(leaveTimerRef.current);
              leaveTimerRef.current = null;
            }
          }}
          style={{ position: "absolute", top: 8, right: 8, cursor: "pointer", fontSize: 18 }}
        >
          {pinned ? <PushpinFilled /> : <PushpinOutlined />}
        </span>

        <div className="register-container">
          <div className="register-title">📝 Đăng ký 💪</div>

          <div className="register-form-content">
            <Form layout="vertical" onFinish={onFinish}>
              <Form.Item
                label="Họ tên"
                name="name"
                rules={[{ required: true, message: "Vui lòng nhập họ tên của bạn!" }]}
              >
                <Input placeholder="Họ tên đầy đủ" suffix={<UserOutlined />} />
              </Form.Item>

              <Form.Item
                label="Số điện thoại"
                name="phone_number"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại của bạn!" },
                  { pattern: /^\d{10}$/, message: "Số điện thoại phải có đúng 10 chữ số." },
                ]}
              >
                <Input placeholder="0123456789" maxLength={10} suffix={<PhoneOutlined />} />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Vui lòng nhập email của bạn!" },
                  { type: "email", message: "Địa chỉ email không hợp lệ" },
                ]}
              >
                <Input placeholder="abc@gmail.com" type="email" suffix={<MailOutlined />} />
              </Form.Item>

              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[
                  { required: true, message: "Vui lòng nhập mật khẩu của bạn!" },
                  { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự." },
                ]}
              >
                <Input.Password placeholder="********" suffix={<LockOutlined />} />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block className="register-button">
                  Bắt đầu
                </Button>
              </Form.Item>

              <div className="signup-text">
                <Text>
                  Đã có tài khoản? <RouterLink to="/login">Đăng nhập</RouterLink>
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
