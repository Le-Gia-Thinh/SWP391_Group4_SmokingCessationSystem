// FrontEnd/src/pages/Login.jsx
import React from "react";
import { Form, Input, Button, Typography, Divider } from "antd";
import { MailOutlined } from "@ant-design/icons";
import axios from "axios";
import { useNavigate, Link as RouterLink } from "react-router-dom";

import "./Login.css";

const { Title, Text } = Typography;

const Login = () => {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      // Gửi POST lên server
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email: values.email,
        password: values.password
      });

      // Nếu login thành công
      if (res.data.success) {
        const { token, user } = res.data;
        // Lưu user + token vào localStorage
        localStorage.setItem("user", JSON.stringify({ ...user, token }));
        navigate("/home");
      } else {
        alert("Email hoặc mật khẩu không đúng");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Đăng nhập thất bại");
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
            <Input.Password placeholder="•••••••" />
          </Form.Item>

          <div className="forgot-password">
            <RouterLink to="/ForgetPassword">Forget password?</RouterLink>
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
              Don’t have an account? <RouterLink to="/register">Sign up</RouterLink>
            </Text>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;
  