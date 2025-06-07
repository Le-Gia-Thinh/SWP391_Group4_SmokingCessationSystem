import React, { useEffect, useState } from "react";
import {
    Row,
    Col,
    Card,
    Typography,
    Avatar,
    Button,
    Tag,
    Space,
    message,
} from "antd";
import {
    VideoCameraOutlined,
    CalendarOutlined,
    UserOutlined,
} from "@ant-design/icons";
import Navbar from "../layouts/Navbar";
import { Link } from "react-router-dom";

const { Title, Paragraph, Text } = Typography;

const mockCoaches = [
    {
        id: 1,
        name: "Coach Minh",
        specialty: "Psychological Counseling",
        isOnline: true,
        avatar: "https://i.pravatar.cc/150?img=11",
    },
    {
        id: 2,
        name: "Coach Linh",
        specialty: "Behavioral Therapy for Smoking Cessation",
        isOnline: false,
        avatar: "https://i.pravatar.cc/150?img=32",
    },
    {
        id: 3,
        name: "Coach Dũng",
        specialty: "Physical & Mental Guidance",
        isOnline: true,
        avatar: "https://i.pravatar.cc/150?img=23",
    },
];

const AvailableCoaches = () => {
    const [coaches, setCoaches] = useState([]);

    useEffect(() => {
        // TODO: replace with real API fetch
        setCoaches(mockCoaches);
    }, []);

    const handleBooking = (coachName) => {
        message.success(`Appointment request sent to ${coachName}`);
    };

    return (
        <div style={{ background: "#f9fff9", minHeight: "100vh", fontFamily: "Segoe UI, sans-serif" }}>
            <Navbar />
            <section style={{ padding: "60px 40px" }}>
                <Title level={2} style={{ textAlign: "center", color: "#4bac4f" }}>
                    Available Coaches
                </Title>
                <Paragraph style={{ textAlign: "center", maxWidth: 700, margin: "0 auto" }}>
                    Choose an online coach to begin your personalized smoking cessation journey.
                </Paragraph>

                <Row gutter={[24, 24]} justify="center" style={{ marginTop: 40 }}>
                    {coaches.map((coach) => (
                        <Col xs={24} sm={12} md={8} key={coach.id}>
                            <Card
                                hoverable
                                style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                                cover={
                                    <div style={{ textAlign: "center", paddingTop: 20 }}>
                                        <Avatar size={96} src={coach.avatar} icon={<UserOutlined />} />
                                    </div>
                                }
                            >
                                <Space direction="vertical" style={{ width: "100%" }}>
                                    <Title level={4} style={{ textAlign: "center" }}>{coach.name}</Title>
                                    <Text type="secondary" style={{ textAlign: "center" }}>{coach.specialty}</Text>
                                    <div style={{ textAlign: "center" }}>
                                        <Tag color={coach.isOnline ? "green" : "default"}>
                                            {coach.isOnline ? "Online" : "Offline"}
                                        </Tag>
                                    </div>
                                    <div style={{ textAlign: "center" }}>
                                        <Button
                                            type="primary"
                                            icon={<CalendarOutlined />}
                                            disabled={!coach.isOnline}
                                            onClick={() => handleBooking(coach.name)}
                                            style={{ backgroundColor: "#4bac4f", borderColor: "#4bac4f" }}
                                        >
                                            Book Appointment
                                        </Button>
                                    </div>
                                </Space>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </section>
        </div>
    );
};

export default AvailableCoaches;
