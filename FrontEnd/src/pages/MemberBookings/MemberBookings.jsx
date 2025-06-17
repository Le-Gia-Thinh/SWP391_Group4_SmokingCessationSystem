import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Modal, message, Avatar, Space, Typography, Spin, Row, Col, Alert } from 'antd';
import {
    EyeOutlined,
    CloseOutlined,
    ReloadOutlined,
    UserOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    VideoCameraOutlined,
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
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    console.log("Current logged-in user:", user);

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
                throw new Error('Failed to load bookings');
            }

            const data = await response.json();
            if (data.success) {
                setBookings(data.data);
            } else {
                setBookings([]);
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
            message.error('Failed to load bookings');
            setBookings([]);
        } finally {
            setLoading(false);
            setInitialLoading(false);
        }
    };

    const handleViewBooking = (booking) => {
        setSelectedBooking(booking);
        setIsModalVisible(true);
    };

    const handleCancelAppointment = async (sessionId) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/appointment/${sessionId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to cancel appointment');
            }

            message.success('Appointment cancelled successfully!');
            loadMyBookings(); // Reload to get updated data
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            message.error('Failed to cancel appointment');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setSelectedBooking(null);
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
            default:
                return 'default';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending':
                return 'Chờ duyệt';
            case 'accepted':
                return 'Đã duyệt';
            case 'rejected':
                return 'Đã từ chối';
            case 'canceled_by_member':
                return 'Đã hủy';
            default:
                return status;
        }
    };

    const formatDateTime = (dateTimeString) => {
        const date = new Date(dateTimeString);
        return {
            date: date.toLocaleDateString('vi-VN'),
            time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };
    };

    const columns = [
        {
            title: 'Coach',
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
            title: 'Thời gian',
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
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => {
                const actions = [
                    {
                        type: 'view',
                        tooltip: 'Xem chi tiết',
                        onClick: handleViewBooking,
                        icon: <EyeOutlined />
                    }
                ];

                // Only allow cancellation for pending appointments
                if (record.session_status === 'pending') {
                    actions.push({
                        type: 'cancel',
                        tooltip: 'Hủy lịch hẹn',
                        onClick: handleCancelAppointment,
                        icon: <CloseOutlined />,
                        danger: true
                    });
                }

                return (
                    <Space>
                        {actions.map((action, index) => (
                            <Button
                                key={index}
                                type={action.danger ? 'default' : 'primary'}
                                size="small"
                                icon={action.icon}
                                onClick={() => action.onClick(record.session_id)}
                                loading={loading}
                                danger={action.danger}
                            />
                        ))}
                    </Space>
                );
            },
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
                                        <CalendarOutlined /> Lịch hẹn của tôi
                                    </Title>
                                    <Text type="secondary">
                                        Xem và quản lý các lịch hẹn coaching của bạn
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
                                message="Chưa có lịch hẹn nào"
                                description="Bạn chưa có lịch hẹn coaching nào. Hãy đặt lịch với coach để bắt đầu hành trình cai thuốc lá!"
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
                                    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} lịch hẹn`,
                                }}
                            />
                        )}
                    </Card>
                </div>
            </div>

            {/* Booking Details Modal */}
            <Modal
                title="Chi tiết lịch hẹn"
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={700}
            >
                {selectedBooking && (
                    <div className="booking-details">
                        <div className="booking-info">
                            <h3>Thông tin Coach</h3>
                            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                                <Col span={24}>
                                    <Card>
                                        <Space>
                                            <Avatar size={64} icon={<UserOutlined />} />
                                            <div>
                                                <Title level={4} style={{ margin: 0 }}>{selectedBooking.coach_name}</Title>
                                                <Text type="secondary">{selectedBooking.coach_email}</Text>
                                            </div>
                                        </Space>
                                    </Card>
                                </Col>
                            </Row>

                            <h3>Thông tin lịch hẹn</h3>
                            <Row gutter={[16, 16]}>
                                <Col span={12}>
                                    <Card>
                                        <Space direction="vertical">
                                            <div>
                                                <Text strong>Ngày:</Text>
                                                <br />
                                                <Text>{formatDateTime(selectedBooking.scheduled_time).date}</Text>
                                            </div>
                                            <div>
                                                <Text strong>Giờ:</Text>
                                                <br />
                                                <Text>{formatDateTime(selectedBooking.scheduled_time).time}</Text>
                                            </div>
                                        </Space>
                                    </Card>
                                </Col>
                                <Col span={12}>
                                    <Card>
                                        <Space direction="vertical">
                                            <div>
                                                <Text strong>Trạng thái:</Text>
                                                <br />
                                                <Tag color={getStatusColor(selectedBooking.session_status)}>
                                                    {getStatusText(selectedBooking.session_status)}
                                                </Tag>
                                            </div>
                                            {selectedBooking.google_meet_link && (
                                                <div>
                                                    <Text strong>Link Meet:</Text>
                                                    <br />
                                                    <Button
                                                        type="link"
                                                        icon={<VideoCameraOutlined />}
                                                        href={selectedBooking.google_meet_link}
                                                        target="_blank"
                                                    >
                                                        Tham gia cuộc họp
                                                    </Button>
                                                </div>
                                            )}
                                        </Space>
                                    </Card>
                                </Col>
                            </Row>

                            {selectedBooking.session_status === 'pending' && (
                                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                                    <Alert
                                        message="Lịch hẹn đang chờ duyệt"
                                        description="Coach sẽ xem xét và phản hồi yêu cầu của bạn trong thời gian sớm nhất."
                                        type="info"
                                        showIcon
                                        action={
                                            <Button
                                                danger
                                                size="small"
                                                onClick={() => handleCancelAppointment(selectedBooking.session_id)}
                                                loading={loading}
                                            >
                                                Hủy lịch hẹn
                                            </Button>
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MemberBookings; 