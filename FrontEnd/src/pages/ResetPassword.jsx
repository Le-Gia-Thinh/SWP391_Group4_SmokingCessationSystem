import React from "react";
import { Form, Input, Button, Typography } from "antd";
import "./AuthFlow.css";

const { Title, Text } = Typography;

const ResetPassword = () => {
  const onFinish = (values) => {
    console.log("Mật khẩu mới:", values);
    // TODO: Gửi mật khẩu mới + token về backend để thay đổi mật khẩu
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
