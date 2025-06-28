// src/Payment/VietqrPayment.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Spin, message, Result, Steps } from 'antd';
import { QrcodeOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;

const VietqrPayment = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { packageId, amount, packageName, description } = location.state || {};
    
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, checking, success, failed
    const [pollingInterval, setPollingInterval] = useState(null);

    // Redirect nếu không có dữ liệu
    useEffect(() => {
        if (!packageId || !amount) {
            message.error('Thông tin thanh toán không hợp lệ');
            navigate('/checkout');
        }
    }, [packageId, amount, navigate]);

    // Tạo QR code
    const handleCreatePayment = async () => {
        setLoading(true);
        try {
            const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
            
            if (!token) {
                message.error('Vui lòng đăng nhập để thanh toán');
                navigate('/login');
                return;
            }

            const response = await axios.post(`${baseURL}/api/payment`, {
                packageId,
                amount,
                description
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setQrData(response.data);
            setPaymentStatus('checking');
            message.success('Mã QR đã được tạo thành công!');
            
            // Bắt đầu polling để kiểm tra trạng thái thanh toán
            startPaymentPolling(response.data.paymentId);
            
        } catch (error) {
            console.error('Create payment error:', error);
            if (error.response?.status === 401) {
                message.error('Phiên đăng nhập đã hết hạn');
                navigate('/login');
            } else {
                message.error(error.response?.data?.error || 'Không thể tạo mã QR thanh toán');
            }
        } finally {
            setLoading(false);
        }
    };

    // Polling kiểm tra trạng thái thanh toán
    const startPaymentPolling = (paymentId) => {
        const interval = setInterval(async () => {
            try {
                const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const token = localStorage.getItem('token');
                
                const response = await axios.get(`${baseURL}/api/payment/${paymentId}/status`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const { payment_status, subscription_status } = response.data;
                
                if (payment_status === 'success' && subscription_status === 'active') {
                    setPaymentStatus('success');
                    clearInterval(interval);
                    message.success('Thanh toán thành công!');
                } else if (payment_status === 'failed') {
                    setPaymentStatus('failed');
                    clearInterval(interval);
                    message.error('Thanh toán thất bại!');
                }
            } catch (error) {
                console.error('Payment status check error:', error);
                // Không hiển thị lỗi cho polling để tránh spam
            }
        }, 3000); // Kiểm tra mỗi 3 giây

        setPollingInterval(interval);

        // Dừng polling sau 10 phút
        setTimeout(() => {
            clearInterval(interval);
            if (paymentStatus === 'checking') {
                setPaymentStatus('timeout');
                message.warning('Quá thời gian chờ. Vui lòng kiểm tra lại trạng thái thanh toán.');
            }
        }, 600000); // 10 phút
    };

    // Cleanup polling khi component unmount
    useEffect(() => {
        return () => {
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
        };
    }, [pollingInterval]);

    // Render kết quả thanh toán
    const renderPaymentResult = () => {
        if (paymentStatus === 'success') {
            return (
                <Result
                    status="success"
                    title="Thanh toán thành công!"
                    subTitle={`Bạn đã đăng ký thành công gói ${packageName}`}
                    extra={[
                        <Button type="primary" key="dashboard" onClick={() => navigate('/dashboard')}>
                            Về trang chủ
                        </Button>,
                        <Button key="subscription" onClick={() => navigate('/subscription/history')}>
                            Xem lịch sử
                        </Button>
                    ]}
                />
            );
        }

        if (paymentStatus === 'failed') {
            return (
                <Result
                    status="error"
                    title="Thanh toán thất bại"
                    subTitle="Vui lòng thử lại hoặc chọn phương thức thanh toán khác"
                    extra={[
                        <Button type="primary" key="retry" onClick={() => {
                            setQrData(null);
                            setPaymentStatus('pending');
                        }}>
                            Thử lại
                        </Button>,
                        <Button key="back" onClick={() => navigate('/checkout')}>
                            Chọn gói khác
                        </Button>
                    ]}
                />
            );
        }

        return null;
    };

    // Nếu đã có kết quả thanh toán
    if (paymentStatus === 'success' || paymentStatus === 'failed') {
        return renderPaymentResult();
    }

    return (
        <div style={{ maxWidth: 500, margin: '40px auto', padding: '0 16px' }}>
            <Card style={{ textAlign: 'center', borderRadius: 12 }}>
                <Title level={3}>
                    <QrcodeOutlined /> Thanh toán qua VietQR
                </Title>
                
                <div style={{ marginBottom: 24 }}>
                    <Text strong>Gói dịch vụ: </Text>
                    <Text>{packageName}</Text>
                </div>
                
                <div style={{ marginBottom: 24 }}>
                    <Text strong>Số tiền: </Text>
                    <Text style={{ fontSize: 18, color: '#52c41a', fontWeight: 'bold' }}>
                        {amount?.toLocaleString()} đ
                    </Text>
                </div>

                {/* Steps */}
                <Steps 
                    current={qrData ? (paymentStatus === 'checking' ? 1 : 0) : 0} 
                    size="small"
                    style={{ marginBottom: 32 }}
                >
                    <Step title="Tạo mã QR" icon={<QrcodeOutlined />} />
                    <Step title="Quét & Thanh toán" icon={<ClockCircleOutlined />} />
                    <Step title="Hoàn thành" icon={<CheckCircleOutlined />} />
                </Steps>

                {!qrData ? (
                    <Button 
                        type="primary" 
                        size="large"
                        onClick={handleCreatePayment} 
                        loading={loading}
                        style={{ minWidth: 160 }}
                    >
                        Tạo mã QR thanh toán
                    </Button>
                ) : (
                    <div>
                        <div style={{ marginBottom: 16 }}>
                            <img 
                                src={qrData.qrImage} 
                                alt="QR VietQR" 
                                style={{ 
                                    width: 280, 
                                    height: 280,
                                    border: '1px solid #d9d9d9',
                                    borderRadius: 8
                                }} 
                            />
                        </div>
                        
                        <div style={{ marginBottom: 16 }}>
                            <Text strong>{qrData.accountName}</Text><br />
                            <Text>STK: {qrData.accountNo}</Text>
                        </div>
                        
                        <Paragraph 
                            copyable={{ text: qrData.description }}
                            style={{ 
                                background: '#f5f5f5', 
                                padding: 8, 
                                borderRadius: 4,
                                fontSize: 12
                            }}
                        >
                            {qrData.description}
                        </Paragraph>

                        {paymentStatus === 'checking' && (
                            <div style={{ marginTop: 24 }}>
                                <Spin />
                                <div style={{ marginTop: 8, color: '#666' }}>
                                    Đang chờ xác nhận thanh toán...
                                </div>
                                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                                    Vui lòng quét mã QR và thực hiện thanh toán
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div style={{ marginTop: 24 }}>
                    <Button onClick={() => navigate('/checkout')}>
                        Quay lại
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default VietqrPayment;