import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Form, Input, Button, Typography } from "antd";
import {
    UserOutlined,
    PhoneOutlined,
    MailOutlined,
    LockOutlined,
} from "@ant-design/icons";
import axios from "axios";
import "./Register.css";

const { Title, Text, Link } = Typography;

const Register = () => {
    const onFinish = async (values) => {
        try {
            const res = await axios.post("http://localhost:3000/api/register", values);
            console.log("Đăng ký thành công:", res.data);
        } catch (err) {
            console.error("Đăng ký thất bại:", err.response?.data || err.message);
        }
    };

    return (
        <div className="register-wrapper">
            <div className="register-container">
                <Title level={2} style={{ textAlign: "center" }}>Sign up</Title>

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
                        name="mobile"
                        rules={[{ required: true, message: "Please enter your phone number!" }]}
                    >
                        <Input placeholder="0123456789" suffix={<PhoneOutlined />} />
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
                        rules={[{ required: true, message: "Please enter your password!" }]}
                    >
                        <Input.Password placeholder="********" />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            style={{
                                backgroundColor: "#4BAC4F",
                                borderColor: "#4BAC4F",
                                color: "#fff",
                                fontWeight: "500",
                                height: 40,
                                borderRadius: 8,
                            }}
                        >
                            Get started
                        </Button>
                    </Form.Item>

                    <div style={{ marginTop: 24, textAlign: "center" }}>
                        <Text>
                            Already have an account? <RouterLink to="/login">Sign in</RouterLink>
                        </Text>
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default Register;
