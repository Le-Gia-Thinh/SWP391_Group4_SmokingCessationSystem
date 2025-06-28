// src/components/SubscriptionStatus.jsx
import React, { useState, useEffect } from 'react';
import { Card, Typography, Tag, Button, Spin, message } from 'antd';
import { CalendarOutlined, CrownOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;

const SubscriptionStatus = () => {
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCurrentSubscription();
    }, []);

    const fetchCurrentSubscription = async () => {
        try {
            const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
            
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await axios.get(`${baseURL}/api/subscriptions/current`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setSubscription(response.data.subscription);
        } catch (error) {
            console.error('Fetch subscription error:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            } else {
                message.error('Không thể tải thông tin đăng ký');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const getDaysRemaining = (endDate) => {
        const now = new Date();
        const end = new Date(endDate);
        const diffTime = end - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!subscription) {
        return (
            <Card style={{ textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
                <div style={{ padding: '40px 0' }}>
                    <UserOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
                    <Title level={4}>Chưa có gói đăng ký</Title>
                    <Paragraph type="secondary">
                        Bạn chưa đăng ký gói dịch vụ nào. Hãy chọn gói phù hợp để trải nghiệm đầy đủ tính năng.
                    </Paragraph>
                    <Button type="primary" onClick={() => navigate('/checkout')}>
                        Chọn gói dịch vụ
                    </Button>
                </div>
            </Card>
        );
    }

    const daysRemaining = getDaysRemaining(subscription.end_date);
    const isExpiringSoon = daysRemaining <= 7;
    const isExpired = daysRemaining <= 0;

    return (
        <Card style={{ maxWidth: 600, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <CrownOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }} />
                <Title level={3}>{subscription.package_name}</Title>
                <Tag color={isExpired ? 'red' : isExpiringSoon ? 'orange' : 'green'} style={{ fontSize: 14 }}>
                    {isExpired ? 'Đã hết hạn' : isExpiringSoon ? 'Sắp hết hạn' : 'Đang hoạt động'}
                </Tag>
            </div>

            <div style={{ marginBottom: 16 }}>
                <Text strong>Mô tả: </Text>
                <Text>{subscription.description}</Text>
            </div>

            <div style={{ marginBottom: 16 }}>
                <Text strong>Giá: </Text>
                <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
                    {subscription.price.toLocaleString()} đ
                </Text>
            </div>

            <div style={{ marginBottom: 16 }}>
                <CalendarOutlined style={{ marginRight: 8 }} />
                <Text strong>Ngày bắt đầu: </Text>
                <Text>{formatDate(subscription.start_date)}</Text>
            </div>

            <div style={{ marginBottom: 16 }}>
                <CalendarOutlined style={{ marginRight: 8 }} />
                <Text strong>Ngày kết thúc: </Text>
                <Text>{formatDate(subscription.end_date)}</Text>
            </div>

            <div style={{ marginBottom: 24 }}>
                <Text strong>Thời gian còn lại: </Text>
                <Text style={{ 
                    color: isExpired ? '#ff4d4f' : isExpiringSoon ? '#faad14' : '#52c41a',
                    fontWeight: 'bold'
                }}>
                    {isExpired ? 'Đã hết hạn' : `${daysRemaining} ngày`}
                </Text>
            </div>

            {/* Features */}
            <div style={{ marginBottom: 24 }}>
                <Text strong>Quyền lợi:</Text>
                <div style={{ marginTop: 8 }}>
                    {subscription.coach_access && (
                        <Tag color="blue" style={{ marginBottom: 4 }}>✓ Truy cập huấn luyện viên</Tag>
                    )}
                    {subscription.community_access && (
                        <Tag color="green" style={{ marginBottom: 4 }}>✓ Truy cập cộng đồng</Tag>
                    )}
                    {subscription.premium_content && (
                        <Tag color="purple" style={{ marginBottom: 4 }}>✓ Nội dung premium</Tag>
                    )}
                </div>
            </div>

            <div style={{ textAlign: 'center' }}>
                {(isExpired || isExpiringSoon) && (
                    <Button type="primary" style={{ marginRight: 8 }} onClick={() => navigate('/checkout')}>
                        Gia hạn gói
                    </Button>
                )}
                <Button onClick={() => navigate('/subscription/history')}>
                    Xem lịch sử
                </Button>
            </div>
        </Card>
    );
};
export default SubscriptionStatus;