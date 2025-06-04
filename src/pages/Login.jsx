import React, { useEffect } from "react";
import { Form, Input, Button, Typography, Divider } from "antd";
import { MailOutlined } from "@ant-design/icons";
import axios from "axios";
import { useNavigate, Link as RouterLink } from "react-router-dom";

import "./Login.css";

const { Title, Text, Link } = Typography;

const Login = () => {
  const navigate = useNavigate();
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);
  const onFinish = async (values) => {
    try {
      const res = await axios.get(
        "https://682d41af4fae188947555b7a.mockapi.io/users",
        {
          params: {
            email: values.email,
            password: values.password,
          },
        }
      );

      if (res.data.length > 0) {
        const user = res.data[0];
        console.log("Đăng nhập thành công:", user);

        // lưu thông tin user (nếu cần)
        localStorage.setItem("user", JSON.stringify(user));

        // chuyển về homepage
        navigate("/home");
      } else {
        alert("Sai email hoặc mật khẩu");
      }
    } catch (err) {
      console.error("Lỗi login:", err.response?.data || err.message);
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
            <Text>
              <RouterLink to="/ForgetPassword">Forget Password</RouterLink>
            </Text>
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
              Don’t have an account?{" "}
              <RouterLink to="/register">Sign up</RouterLink>
            </Text>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;
