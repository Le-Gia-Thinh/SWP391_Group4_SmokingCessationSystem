import React, { useEffect } from "react";
import { Form, Input, Button, Typography } from "antd";
import "./AuthFlow.css";

const { Title, Text } = Typography;

const VerifyCode = () => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);
  const onFinish = (values) => {
    console.log("Mã xác nhận:", values.code);
    // TODO: Gửi mã xác nhận tới backend để kiểm tra
  };

  return (
    <div className="auth-outer-wrapper">
      <div className="auth-wrapper">
        <div className="auth-container">
          <Title level={2}>Verify Code</Title>
          <Text>Please enter the verification code sent to your email</Text>

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="code"
              label="Verification Code"
              rules={[{ required: true, message: "Please enter the code!" }]}
            >
              <Input placeholder="6-digit code" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Verify
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default VerifyCode;
