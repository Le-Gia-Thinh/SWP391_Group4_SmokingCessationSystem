import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Tag, Spin, message, Button } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title } = Typography;

const SubscriptionHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSubscriptionHistory();
    }, []);

    const fetchSubscriptionHistory = async () => {
        try {
            const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');

            if (!token) {
                navigate('/login');
                return;
            }

            const response = await axios.get(`${baseURL}/api/subscriptions/history`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setHistory(response.data);
        } catch (error) {
            console.error('Fetch history error:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            } else {
                message.error('Không thể tải lịch sử đăng ký');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusTag = (status) => {
        const statusConfig = {
            'active': { color: 'green', text: 'Đang hoạt động' },
            'pending': { color: 'orange', text: 'Chờ thanh toán' },
            'failed': { color: 'red', text: 'Thất bại' },
            'expired': { color: 'gray', text: 'Đã hết hạn' }
        };

        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
    };

    const getPaymentStatusTag = (status) => {
        const statusConfig = {
            'success': { color: 'green', text: 'Thành công' },
            'pending': { color: 'orange', text: 'Chờ xử lý' },
            'failed': { color: 'red', text: 'Thất bại' }
        };

        const config = statusConfig[status] || { color: 'default', text: status || '-' };
        return <Tag color={config.color}>{config.text}</Tag>;
    };

    const columns = [
        {
            title: 'Gói dịch vụ',
            dataIndex: 'package_name',
            key: 'package_name',
        },
        {
            title: 'Giá',
            dataIndex: 'price',
            key: 'price',
            render: (price) => `${price?.toLocaleString()} đ`,
        },
        {
            title: 'Ngày bắt đầu',
            dataIndex: 'start_date',
            key: 'start_date',
            render: formatDate,
        },
        {
            title: 'Ngày kết thúc',
            dataIndex: 'end_date',
            key: 'end_date',
            render: formatDate,
        },
        {
            title: 'Trạng thái gói',
            dataIndex: 'payment_status',
            key: 'payment_status',
            render: getStatusTag,
        },
        {
            title: 'Thanh toán',
            dataIndex: 'payment_transaction_status',
            key: 'payment_transaction_status',
            render: getPaymentStatusTag,
        },
        {
            title: 'Ngày thanh toán',
            dataIndex: 'payment_date',
            key: 'payment_date',
            render: formatDate,
        }
    ];

    return (
        <Card>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <HistoryOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                <Title level={3}>Lịch sử đăng ký</Title>
            </div>

            <Table
                columns={columns}
                dataSource={history}
                rowKey="subscription_id"
                loading={loading}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: false,
                    showQuickJumper: true,
                }}
                locale={{
                    emptyText: 'Chưa có lịch sử đăng ký nào'
                }}
                scroll={{ x: 800 }}
            />

            <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Button onClick={() => navigate('/subscription/current')}>
                    Xem gói hiện tại
                </Button>
            </div>
        </Card>
    );
};
export default SubscriptionHistory;