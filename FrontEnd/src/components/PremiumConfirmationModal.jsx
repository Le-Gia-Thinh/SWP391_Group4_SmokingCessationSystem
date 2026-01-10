import React, { useState } from "react";
import { Modal, Button, Typography, Space } from "antd";
import { CrownOutlined, CheckCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const PremiumConfirmationModal = ({ visible, onConfirm, onCancel }) => {
    return (
        <Modal
            title={
                <div style={{ textAlign: "center" }}>
                    <CrownOutlined style={{ color: "#faad14", fontSize: 24, marginRight: 8 }} />
                    <span>Nâng cấp Premium</span>
                </div>
            }
            open={visible}
            onCancel={onCancel}
            footer={null}
            centered
            width={480}
        >
            <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ marginBottom: 24 }}>
                    <CrownOutlined style={{ fontSize: 64, color: "#faad14" }} />
                </div>

                <Title level={4} style={{ marginBottom: 16 }}>
                    Tính năng Premium
                </Title>

                <Text style={{ fontSize: 16, color: "#666", display: "block", marginBottom: 24 }}>
                    Bạn cần nâng cấp lên gói Premium để sử dụng tính năng này
                </Text>

                <div style={{ textAlign: "left", marginBottom: 24 }}>
                    <Space direction="vertical" size={12}>
                        <div>
                            <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} />
                            <span>Truy cập đầy đủ tất cả tính năng</span>
                        </div>
                        <div>
                            <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} />
                            <span>Tư vấn 1-1 với chuyên gia</span>
                        </div>
                        <div>
                            <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} />
                            <span>Báo cáo thống kê chi tiết</span>
                        </div>
                        <div>
                            <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} />
                            <span>Hỗ trợ ưu tiên</span>
                        </div>
                    </Space>
                </div>

                <Space size={16}>
                    <Button size="large" onClick={onCancel}>
                        Để sau
                    </Button>
                    <Button
                        type="primary"
                        size="large"
                        icon={<CrownOutlined />}
                        onClick={onConfirm}
                        style={{ backgroundColor: "#faad14", borderColor: "#faad14" }}
                    >
                        Nâng cấp ngay
                    </Button>
                </Space>
            </div>
        </Modal>
    );
};

export default PremiumConfirmationModal;