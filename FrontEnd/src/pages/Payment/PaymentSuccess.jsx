import React, { useEffect } from 'react';
import { Result, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';

const PaymentSuccess = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const timeout = setTimeout(() => {
            navigate('/home');
        }, 1000);

        return () => clearTimeout(timeout);
    }, []);

    return (
        <div style={{ padding: '80px 24px', textAlign: 'center' }}>
            <Result
                status="success"
                title="🎉 Thanh toán thành công!"
                subTitle="Hệ thống sẽ chuyển về trang chủ trong giây lát..."
            />
            <Spin style={{ marginTop: 24 }} />
        </div>
    );
};

export default PaymentSuccess;
