import React from "react";
import { Card, List, Typography, Badge } from "antd";
import Navbar from '../../layouts/Navbar';

const { Title, Text } = Typography;

const mockNotifications = [
    { id: 1, content: "Bạn có 1 lịch hẹn mới với coach.", read: false },
    { id: 2, content: "Kế hoạch bỏ thuốc của bạn đã được cập nhật.", read: true },
];

const Notifications = () => {
    return (
        <>
            <Navbar />
            <div style={{ maxWidth: 520, margin: "40px auto" }}>
                <Card style={{ borderRadius: 16 }}>
                    <Title level={3}>Thông báo</Title>
                    <List
                        dataSource={mockNotifications}
                        renderItem={item => (
                            <List.Item>
                                <Badge dot={!item.read}>
                                    <Text style={{ fontWeight: item.read ? 400 : 600 }}>
                                        {item.content}
                                    </Text>
                                </Badge>
                            </List.Item>
                        )}
                    />
                </Card>
            </div>
        </>
    );
};

export default Notifications; 