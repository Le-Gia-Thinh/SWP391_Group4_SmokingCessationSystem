import React from "react";
import { Card, Avatar, Typography, Space, Tag } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import Navbar from '../../layouts/Navbar';

const { Title, Text } = Typography;

const Profile = () => {
    const { user } = useAuth();
    if (!user) return <div style={{ textAlign: 'center', marginTop: 60 }}><Navbar />Vui lòng đăng nhập để xem thông tin cá nhân.</div>;
    return (
        <>
            <Navbar />
            <div style={{ maxWidth: 420, margin: "40px auto" }}>
                <Card style={{ textAlign: "center", borderRadius: 16 }}>
                    <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: '#52c41a', marginBottom: 16 }} />
                    <Title level={3}>{user.name || user.email}</Title>
                    <Text type="secondary">{user.email}</Text>
                    <div style={{ margin: '16px 0' }}>
                        <Tag color={user.role === 'admin' ? 'red' : user.role === 'coach' ? 'blue' : 'green'} style={{ fontSize: 15 }}>
                            {user.role}
                        </Tag>
                    </div>
                    {/* Thêm các thông tin khác nếu có */}
                </Card>
            </div>
        </>
    );
};

export default Profile; 