import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, message, Avatar, Space, Typography, Spin, Row, Col, Alert, Popconfirm, Tooltip } from 'antd';
import {
    CloseOutlined,
    ReloadOutlined,
    UserOutlined,
    CalendarOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../layouts/Navbar';
import './MemberBookings.css';

const { Title, Text } = Typography;

const MemberBookings = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // API Base URL
    const API_BASE_URL = 'http://localhost:5000/api';

    // Helper function to get auth headers
    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    useEffect(() => {
        loadMyBookings();
    }, []);

    const loadMyBookings = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/appointment/my-bookings`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Không thể tải lịch đặt');
            }

            const data = await response.json();
            if (data.success) {
                setBookings(data.data);
            } else {
                setBookings([]);
            }
        } catch (error) {
            console.error('Lỗi tải lịch đặt:', error);
            message.error('Không thể tải lịch đặt');
            setBookings([]);
        } finally {
            setLoading(false);
            setInitialLoading(false);
        }
    };

    const handleCancelAppointment = async (sessionId) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/appointment/${sessionId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Không thể hủy cuộc hẹn');
            }

            message.success('Hủy cuộc hẹn thành công!');
            loadMyBookings(); // Reload to get updated data
        } catch (error) {
            console.error('Lỗi hủy cuộc hẹn:', error);
            message.error(error.message || 'Không thể hủy cuộc hẹn');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'orange';
            case 'accepted':
                return 'green';
            case 'rejected':
                return 'red';
            case 'canceled_by_member':
                return 'gray';
            case 'completed':
                return 'blue';
            default:
                return 'default';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending':
                return 'Đang chờ';
            case 'accepted':
                return 'Đã chấp nhận';
            case 'rejected':
                return 'Đã từ chối';
            case 'canceled_by_member':
                return 'Đã hủy';
            case 'completed':
                return 'Đã hoàn thành';
            default:
                return status;
        }
    };

    const formatDateTime = (dateTimeString) => {
        const date = new Date(dateTimeString);
        return {
            date: date.toLocaleDateString('en-US'),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
    };

    const columns = [
        {
            title: 'Huấn luyện viên',
            key: 'coach',
            render: (_, record) => (
                <Space>
                    <Avatar icon={<UserOutlined />} />
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{record.coach_name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{record.coach_email}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Thời gian dự kiến',
            key: 'scheduled_time',
            render: (_, record) => {
                const { date, time } = formatDateTime(record.scheduled_time);
                return (
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{date}</div>
                        <div style={{ color: '#666' }}>{time}</div>
                    </div>
                );
            },
        },
        {
            title: 'Trạng thái',
            key: 'session_status',
            render: (_, record) => (
                <Tag color={getStatusColor(record.session_status)}>
                    {getStatusText(record.session_status)}
                </Tag>
            ),
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    {record.session_status === 'pending' && (
                        <Popconfirm
                            title="Hủy cuộc hẹn"
                            description="Bạn có chắc chắn muốn hủy cuộc hẹn này không? Hành động này không thể hoàn tác."
                            onConfirm={() => handleCancelAppointment(record.session_id)}
                            okText="Có, hủy"
                            okType="danger"
                            cancelText="Không"
                        >
                            <Tooltip title="Hủy cuộc hẹn">
                                <Button
                                    type="default"
                                    icon={<CloseOutlined />}
                                    danger
                                    loading={loading}
                                />
                            </Tooltip>
                        </Popconfirm>
                    )}
                    {record.session_status === 'accepted' && record.google_meet_link && (
                        <Tooltip title="Tham gia Google Meet">
                            <Button
                                type="primary"
                                href={record.google_meet_link.startsWith('http') ? record.google_meet_link : `https://${record.google_meet_link}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Tham gia cuộc họp
                            </Button>
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    if (initialLoading) {
        return (
            <div>
                <Navbar />
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: '16px' }}>Đang tải lịch hẹn...</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
                    <Card>
                        <div style={{ marginBottom: 24 }}>
                            <Row justify="space-between" align="middle">
                                <Col>
                                    <Title level={2}>
                                        <CalendarOutlined /> Các cuộc hẹn của tôi
                                    </Title>
                                    <Text type="secondary">
                                        Xem và quản lý các cuộc hẹn huấn luyện của bạn.
                                    </Text>
                                </Col>
                                <Col>
                                    <Button
                                        type="primary"
                                        icon={<ReloadOutlined />}
                                        onClick={loadMyBookings}
                                        loading={loading}
                                    >
                                        Làm mới
                                    </Button>
                                </Col>
                            </Row>
                        </div>

                        {bookings.length === 0 ? (
                            <Alert
                                message="Không tìm thấy cuộc hẹn nào"
                                description="Bạn chưa có cuộc hẹn huấn luyện nào. Hãy đặt lịch với một huấn luyện viên để bắt đầu hành trình bỏ thuốc của bạn!"
                                type="info"
                                showIcon
                                action={
                                    <Button size="small" type="primary" href="/book-coach">
                                        Đặt lịch ngay
                                    </Button>
                                }
                            />
                        ) : (
                            <Table
                                columns={columns}
                                dataSource={bookings}
                                rowKey="session_id"
                                loading={loading}
                                pagination={{
                                    pageSize: 10,
                                    showSizeChanger: true,
                                    showQuickJumper: true,
                                    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} cuộc hẹn`,
                                }}
                            />
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MemberBookings; 