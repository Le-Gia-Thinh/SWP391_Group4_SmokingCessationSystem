import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Input, Button, Typography, message } from "antd";
import axios from "axios";

const { Title, Text } = Typography;

const ResetPassword = () => {
  const { token } = useParams(); // lấy token từ URL
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const res = await axios.post(
        `http://localhost:3000/api/reset-password/${token}`,
        { newPassword: values.newPassword }
      );

      message.success("Đặt lại mật khẩu thành công!");
      navigate("/login"); // về trang login
    } catch (err) {
      console.error("Lỗi reset password:", err.response?.data || err.message);
      message.error("Đặt lại mật khẩu thất bại.");
    }
  };

  return (
    <div className="auth-container">
      <Title level={2}>Reset Password</Title>
      <Text>Enter your new password</Text>

      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="newPassword"
          label="New Password"
          rules={[{ required: true, message: "Please input new password!" }]}
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
  );
};

export default ResetPassword;
