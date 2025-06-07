import React from "react";
import { Form, Input, Button, Typography } from "antd";
import axios from "axios";
import "./AuthFlow.css";
import { useNavigate, useLocation } from "react-router-dom";

const { Title, Text } = Typography;

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token");

  const onFinish = async (values) => {
    try {
      const res = await axios.post("http://localhost:3000/api/resetPassword", {
        token, // gửi kèm token xác minh
        newPassword: values.newPassword,
      });
      console.log("Đổi mật khẩu response:", res);

      alert("Mật khẩu đã được thay đổi thành công.");
      navigate("/login");
    } catch (err) {
      console.error("Lỗi đổi mật khẩu:", err.response?.data || err.message);
      alert("Đổi mật khẩu thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="auth-outer-wrapper">
      <div className="auth-wrapper">
        <div className="auth-container">
          <Title level={2}>Reset Password</Title>
          <Text>Enter your new password</Text>

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                { required: true, message: "Please input new password!" },
              ]}
            >
              <Input.Password placeholder="New password" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Please confirm your password!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match!"));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Confirm password" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Reset Password
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
