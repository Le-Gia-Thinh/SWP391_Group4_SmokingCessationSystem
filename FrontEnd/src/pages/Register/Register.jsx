import React, { useEffect, useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { Form, Input, Button, Typography, message } from "antd";
import {
    UserOutlined,
    PhoneOutlined,
    MailOutlined,
    LockOutlined,
} from "@ant-design/icons";
import axios from "axios";
import "./Register.css";

const { Text } = Typography;

const Register = () => {
    // khóa scroll khi modal hiển thị
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, []);

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            await axios.post("http://localhost:5000/api/auth/register", values);
            message.success("Đăng ký thành công!");
            navigate("/login");
        } catch (err) {
            console.error(err);
            message.error("Đăng ký thất bại!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-wrapper">
            <div className="outer-box">
                {/* 4 line animation */}
                <span className="line top" />
                <span className="line right" />
                <span className="line bottom" />
                <span className="line left" />

                <div className="register-container">
                    <div className="login-title">🚭 Sign up</div>
                    <div className="form-content">
                        <Form layout="vertical" onFinish={onFinish}>
                            <Form.Item
                                label="Name"
                                name="name"
                                rules={[{ required: true, message: "Please enter your name!" }]}
                            >
                                <Input suffix={<UserOutlined />} placeholder="Your full name" />
                            </Form.Item>

                            <Form.Item
                                label="Mobile no."
                                name="phone_number"
                                rules={[
                                    { required: true, message: "Please enter your phone number!" },
                                ]}
                            >
                                <Input
                                    suffix={<PhoneOutlined />}
                                    placeholder="0123456789"
                                />
                            </Form.Item>

                            <Form.Item
                                label="Email"
                                name="email"
                                rules={[
                                    { required: true, message: "Please enter your email!" },
                                    { type: "email", message: "Invalid email address" },
                                ]}
                            >
                                <Input
                                    suffix={<MailOutlined />}
                                    placeholder="abc@gmail.com"
                                    type="email"
                                />
                            </Form.Item>

                            <Form.Item
                                label="Password"
                                name="password"
                                rules={[
                                    { required: true, message: "Please enter your password!" },
                                ]}
                            >
                                <Input.Password
                                    suffix={<LockOutlined />}
                                    placeholder="********"
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    className="login-button"
                                    loading={loading}
                                >
                                    Get started
                                </Button>
                            </Form.Item>

                            <div className="signup-text">
                                <Text>
                                    Already have an account?{" "}
                                    <RouterLink to="/login">Sign in</RouterLink>
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
