import React from "react";
import { Card, Avatar, Typography, Tag, Divider, Space, Dropdown } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { Menu, Button } from "antd";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const UserDropdownMenu = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    if (!user) return null;

    return (
        <Card
            style={{
                width: 360,
                borderRadius: 12,
                textAlign: "center",
                boxShadow: "0 2px 12px rgba(0,0,0,0.1)"
            }}
            bodyStyle={{ padding: 20 }}
        >
            <Avatar
                size={80}
                icon={<UserOutlined />}
                src={user.avatar_url}
                style={{ backgroundColor: "#52c41a", marginBottom: 12 }}
            />

            <Title level={4} style={{ marginBottom: 4 }}>{user.name || user.email}</Title>
            <Text type="secondary">{user.email}</Text>

            <div style={{ marginTop: 10 }}>
                <Tag color={
                    user.role === 'admin' ? 'red' :
                    user.role === 'coach' ? 'blue' : 'green'
                }>
                    {user.role}
                </Tag>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <Space direction="vertical" size={4} style={{ textAlign: "left", display: "block", fontSize: 14 }}>
                <div>📞 <strong>SĐT:</strong> {user.phone_number || "Chưa cập nhật"}</div>
                <div>🎯 <strong>Mức độ FTND:</strong> {user.ftnd_level ?? "Chưa có"}</div>
                <div>📅 <strong>Ngày đăng ký:</strong> {user.registration_date?.substring(0, 10)}</div>
                <div>🏆 <strong>Điểm số:</strong> {user.total_points ?? 0} – <strong>Cấp độ:</strong> {user.current_level ?? "Mới"}</div>
                <div>📅 <strong>Ngày sinh:</strong> {user.date_of_birth ? dayjs(user.date_of_birth).format("DD/MM/YYYY") : "Chưa cập nhật"}</div>
            </Space>

            <Divider style={{ margin: '12px 0' }} />

            <Space direction="vertical" style={{ width: "100%" }}>
                <Button block onClick={() => navigate('/profile')}>
                    ✏️ Chỉnh sửa thông tin
                </Button>
                <Button block danger onClick={logout}>
                    🔓 Đăng xuất
                </Button>
            </Space>
        </Card>
    );
};

export default UserDropdownMenu;