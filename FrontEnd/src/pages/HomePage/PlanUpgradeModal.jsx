import React, { useEffect, useState, useRef } from "react";
import { Card, Row, Col, Typography, Button, Space, List } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./PlanUpgradeModal.css";

const { Title, Text, Paragraph } = Typography;

// Danh sách tính năng của các gói
const basicPerks = [
    "Sử dụng các tính năng cơ bản",
    "Tạo các kế hoạch cai nghiện",
    "Thực hiện nhiệm vụ hàng ngày",
    "Xem các blog nổi bật",
    "Xếp hạng (Ranking)"
];

const premiumPerks = [
    "Sử dụng tất cả các tính năng miễn phí",
    "Tham gia chat cộng đồng",
    "Xem toàn bộ các blog",
    "Kế hoạch cai chi tiết + coach 1-1",
    "Miễn quảng cáo & ưu tiên hỗ trợ",
    "Truy cập toàn bộ kho tài liệu cao cấp",
];

export default function PlanUpgradeModal({ open, onClose }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const contentRef = useRef(null);
    const [modalTop, setModalTop] = useState(0);
    const [hasNavPremium, setHasNavPremium] = useState(false);

    // Luôn khai báo hook: phát hiện nav có "Premium" (chỉ cho member)
    useEffect(() => {
        if (user?.user_role !== 'member') {
            setHasNavPremium(false);
            return;
        }
        const header = document.querySelector('header');
        setHasNavPremium(header?.textContent.includes('Premium'));
    }, [user]);

    // Luôn khai báo hook: tính vị trí modal
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
        return () => window.removeEventListener("scroll", onScroll);
    }, [open]);

    // Chỉ hiển thị nếu open=true, user_role là member và chưa có "Premium" trên nav
    if (!open || user?.user_role !== 'member' || hasNavPremium) return null;

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
                        {/* Gói cơ bản */}
                        <Col xs={24} md={10}>
                            <Card className="plan-card current-plan">
                                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                                    <Text type="secondary">Gói hiện tại</Text>
                                    <Title className="title" style={{ fontWeight: 800, color: 'mediumspringgreen' }} level={3}>Member (Free)</Title>
                                    <List
                                        dataSource={basicPerks}
                                        renderItem={(item) => (
                                            <List.Item>
                                                <CheckOutlined style={{ color: "#1890ff", marginRight: 8 }} />
                                                {item}
                                            </List.Item>
                                        )}
                                    />
                                    <Paragraph type="secondary">
                                        Nâng cấp để truy cập thêm tính năng Premium.
                                    </Paragraph>
                                </Space>
                            </Card>
                        </Col>
                        {/* Gói Premium */}
                        <Col xs={24} md={10}>
                            <Card className="plan-card premium-plan">
                                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                                    <Text type="secondary">Nổi bật</Text>
                                    <Title className="title" style={{ fontWeight: 800, color: 'limegreen' }} level={3}>Premium</Title>
                                    <List
                                        dataSource={premiumPerks}
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
