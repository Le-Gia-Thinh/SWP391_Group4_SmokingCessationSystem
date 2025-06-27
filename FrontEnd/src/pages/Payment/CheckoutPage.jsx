// src/Payment/CheckoutPage.jsx
import React, { useState } from 'react';
import { Card, Typography, Radio } from 'antd';
import CreditCard from './CreditCard';
import MomoPayment from './MomoPayment';
import VnpayPayment from './VnpayPayment';

const { Title, Paragraph } = Typography;

const CheckoutPage = () => {
    const [method, setMethod] = useState('creditcard');

    const onChange = e => {
        setMethod(e.target.value);
    };

    const renderPaymentForm = () => {
        switch (method) {
            case 'momo':
                return <MomoPayment />;
            case 'vnpay':
                return <VnpayPayment />;
            case 'creditcard':
            default:
                return <CreditCard />;
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Card style={{ maxWidth: 640 }}>
                <Title level={2}>Thanh toán Premium</Title>
                <Paragraph>
                    Chọn phương thức thanh toán bên dưới.<br />
                    Sau khi thành công, backend sẽ <strong>UPDATE plan_type = "premium"</strong>.
                </Paragraph>

                <Radio.Group
                    onChange={onChange}
                    value={method}
                    optionType="button"
                    buttonStyle="solid"
                    style={{ marginBottom: 24 }}
                >
                    <Radio.Button value="creditcard">Credit Card</Radio.Button>
                    <Radio.Button value="momo">Momo</Radio.Button>
                    <Radio.Button value="vnpay">VNPay</Radio.Button>
                </Radio.Group>

                {renderPaymentForm()}
            </Card>
        </div>
    );
};

export default CheckoutPage;
