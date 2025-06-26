import React from "react";
import { Card, Avatar, Typography, Space, Tag, Button} from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import Navbar from '../../layouts/Navbar';
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const Profile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    if (!user) return <div style={{ textAlign: 'center', marginTop: 60 }}><Navbar />Vui lòng đăng nhập để xem thông tin cá nhân.</div>;
    return (
        <>
            <Navbar />
            <div style={{ maxWidth: 420, margin: "40px auto" }}>
                <Card style={{ textAlign: "center", borderRadius: 16 }}>
                    <Avatar
                        size={80}
                        src={user.avatar_url}
                        icon={<UserOutlined />}
                        style={{ backgroundColor: '#52c41a', marginBottom: 16 }}
                        />
                    <Title level={3}>{user.full_name || user.email}</Title>
                    <Text type="secondary">{user.email}</Text>
                    <div style={{ margin: '16px 0' }}>
                        <Tag color={user.role === 'admin' ? 'red' : user.role === 'coach' ? 'blue' : 'green'} style={{ fontSize: 15 }}>
                            {user.role}
                        </Tag>
                    </div>
                    <Text>📞 SĐT: {user.phone_number || "Chưa cập nhật"}</Text><br />
                    {user.role === 'member' && (
                    <>
                        <Text>🎯 Mức độ FTND: {user.ftnd_level ?? "Chưa có"}</Text><br />
                        <Text>🗓️ Ngày đăng ký: {user.registration_date?.substring(0, 10)}</Text><br />
                        <Text>🏆 Điểm số: {user.total_points ?? 0} – Cấp độ: {user.current_level ?? "Mới"}</Text>
                    </>
                    )}
                    <Button
                        type="primary"
                        style={{ marginTop: 20 }}
                        onClick={() => navigate('/update-profile')}
                        >
                        ✏️ Chỉnh sửa thông tin
                    </Button>
                </Card>
            </div>
        </>
    );
};

export default Profile; 