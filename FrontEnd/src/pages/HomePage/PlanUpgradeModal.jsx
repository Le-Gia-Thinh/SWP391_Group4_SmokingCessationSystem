import React, { useEffect, useState, useRef } from "react";
import { Card, Row, Col, Typography, Button, Space, List } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "./PlanUpgradeModal.css";

const { Title, Text, Paragraph } = Typography;

const perks = [
    "Theo dõi tiến trình 24/7",
    "Kế hoạch cai chi tiết + coach 1-1",
    "Miễn quảng cáo & ưu tiên hỗ trợ",
    "Truy cập toàn bộ kho tài liệu cao cấp",
];

export default function PlanUpgradeModal({ open, onClose }) {
    const navigate = useNavigate();
    const contentRef = useRef(null);
    const [modalTop, setModalTop] = useState(0);

    useEffect(() => {
        if (!open) return;

        const updatePosition = () => {
            if (!contentRef.current) return;
            const modalHeight = contentRef.current.offsetHeight;
            const centerOffset = (window.innerHeight - modalHeight) / 2;
            setModalTop(window.scrollY + centerOffset);
        };

        let ticking = false;
        const onScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updatePosition();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        updatePosition();

        return () => {
            window.removeEventListener("scroll", onScroll);
        };
    }, [open]);

    if (!open) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            className="custom-modal-overlay"
            style={{ top: modalTop }}
            onClick={handleOverlayClick}
        >
            <div className="custom-modal-content" ref={contentRef}>
                <button className="custom-modal-close" onClick={onClose}>
                    <CloseOutlined />
                </button>
                <div className="custom-modal-body">
                    <Title level={2} style={{ textAlign: "center", marginBottom: 32 }}>
                        Nâng cấp gói của bạn
                    </Title>
                    <Row gutter={32} justify="center">
                        <Col xs={24} md={10}>
                            <Card className="plan-card current-plan">
                                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                                    <Text type="secondary">Gói hiện tại</Text>
                                    <Title level={3}>Member (Free)</Title>
                                    <Paragraph>Bạn đang sử dụng các tính năng cơ bản.</Paragraph>
                                </Space>
                            </Card>
                        </Col>
                        <Col xs={24} md={10}>
                            <Card className="plan-card premium-plan">
                                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                                    <Text type="secondary">Nổi bật</Text>
                                    <Title level={3}>Premium</Title>
                                    <Title level={2} style={{ margin: 0 }}>
                                        99 000 ₫<Text style={{ fontSize: 16 }}>/tháng</Text>
                                    </Title>
                                    <List
                                        dataSource={perks}
                                        renderItem={(item) => (
                                            <List.Item>
                                                <CheckOutlined style={{ color: "#52c41a", marginRight: 8 }} />
                                                {item}
                                            </List.Item>
                                        )}
                                    />
                                    <Button
                                        type="primary"
                                        size="large"
                                        block
                                        onClick={() => {
                                            onClose();
                                            navigate("/checkout");
                                        }}
                                    >
                                        Nâng cấp ngay
                                    </Button>
                                </Space>
                            </Card>
                        </Col>
                    </Row>
                </div>
                <div className="custom-modal-footer">
                    <Button type="text" onClick={onClose}>
                        Để sau
                    </Button>
                </div>
            </div>
        </div>
    );
}
