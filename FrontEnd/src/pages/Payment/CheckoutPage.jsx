import React from "react";
import { Card, Typography } from "antd";

const { Title, Paragraph } = Typography;

const CheckoutPage = () => (
    <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Card style={{ maxWidth: 640 }}>
            <Title level={2}>Thanh toán Premium</Title>
            <Paragraph>
                Tích hợp cổng VNPay/Stripe hoặc phương thức bạn muốn.<br />
                Sau khi thanh toán thành công, backend <strong>UPDATE plan_type = "premium"</strong>.
            </Paragraph>
        </Card>
    </div>
);

export default CheckoutPage;