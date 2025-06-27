import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Modal, Form, Input, Select, message, Avatar, Space, Tooltip, Spin, Tabs, Row, Col, Typography, Badge } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined, ReloadOutlined, UserOutlined, ClockCircleOutlined, CheckCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import ActionButtonGroup from '../../components/ui/ActionButtonGroup';
import DataTable from '../../components/ui/DataTable';
import Navbar from '../../layouts/Navbar';
import './BookingManagement.css';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

const BookingManagement = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');

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
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/appointment/all-coach-appointments`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Lỗi tải lịch đặt');
            }

            const data = await response.json();
            console.log('DEBUG: Raw data from API:', data.data);
            setBookings(data.data); // Assuming the backend now returns { success: true, data: [...] }
        } catch (error) {
            console.error('Lỗi tải lịch đặt:', error);
            message.error('Không thể tải lịch đặt');
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

    const handleAcceptAppointment = async (sessionId) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/appointment/${sessionId}/accept`, {
                method: 'PUT',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Không thể chấp nhận cuộc hẹn');
            }

            message.success('Chấp nhận cuộc hẹn thành công!');
            loadBookings(); // Reload to get updated data
        } catch (error) {
            console.error('Lỗi chấp nhận cuộc hẹn:', error);
            message.error('Không thể chấp nhận cuộc hẹn');
        } finally {
            setLoading(false);
        }
    };

    const handleRejectAppointment = async (sessionId) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/appointment/${sessionId}/reject`, {
                method: 'PUT',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Không thể từ chối cuộc hẹn');
            }

            message.success('Từ chối cuộc hẹn thành công!');
            loadBookings(); // Reload to get updated data
        } catch (error) {
            console.error('Lỗi từ chối cuộc hẹn:', error);
            message.error('Không thể từ chối cuộc hẹn');
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
                return 'Đang chờ';
            case 'accepted':
                return 'Đã chấp nhận';
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
            date: date.toLocaleDateString('en-US'),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
    };

    const columns = [
        {
            title: 'Thành viên',
            key: 'member',
            render: (_, record) => (
                <Space>
                    <Avatar icon={<UserOutlined />} />
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{record.member_name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>ID Thành viên: {record.member_user_id}</div>
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
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => {
                const actions = [
                    {
                        type: 'view',
                        tooltip: 'Xem chi tiết',
                        onClick: () => handleViewBooking(record),
                        icon: <EyeOutlined />
                    },
                    {
                        type: 'accept',
                        tooltip: 'Chấp nhận cuộc hẹn',
                        onClick: () => handleAcceptAppointment(record.session_id),
                        icon: <CheckOutlined />,
                        hidden: record.session_status !== 'pending'
                    },
                    {
                        type: 'reject',
                        tooltip: 'Từ chối cuộc hẹn',
                        onClick: () => handleRejectAppointment(record.session_id),
                        icon: <CloseOutlined />,
                        danger: true,
                        hidden: record.session_status !== 'pending'
                    },
                ];

                return (
                    <ActionButtonGroup
                        actions={actions}
                        record={record}
                    />
                );
            },
        },
    ];

    if (initialLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>Đang tải lịch hẹn...</div>
            </div>
        );
    }

    const filteredBookings = bookings.filter(booking => {
        if (activeTab === 'rejected_cancelled') {
            return booking.session_status === 'rejected' ||
                booking.session_status === 'canceled_by_member' ||
                booking.session_status === 'canceled_by_coach';
        } else {
            return booking.session_status === activeTab;
        }
    });
    console.log('DEBUG: filteredBookings for active tab (', activeTab, '):', filteredBookings);

    const onTabChange = (key) => {
        setActiveTab(key);
        console.log('DEBUG: Tab changed to:', key);
    };

    return (
        <div style={{ padding: '24px 0' }}>
            <div style={{ marginBottom: 24 }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={2}>
                            <CheckCircleOutlined /> Quản lý cuộc hẹn
                        </Title>
                        <Text type="secondary">
                            Xem và quản lý yêu cầu cuộc hẹn từ thành viên
                        </Text>
                    </Col>
                    <Col>
                        <Button type="primary" icon={<ReloadOutlined />} onClick={loadBookings}>
                            Làm mới
                        </Button>
                    </Col>
                </Row>
            </div>

            <Card>
                <Tabs defaultActiveKey="pending" activeKey={activeTab} onChange={onTabChange}>
                    <TabPane tab={<span>Cuộc hẹn đang chờ <Badge count={bookings.filter(b => b.session_status === 'pending').length} /></span>} key="pending" />
                    <TabPane tab={<span>Cuộc hẹn đã chấp nhận <Badge count={bookings.filter(b => b.session_status === 'accepted').length} /></span>} key="accepted" />
                    <TabPane tab={<span>Cuộc hẹn đã hoàn thành <Badge count={bookings.filter(b => b.session_status === 'completed').length} /></span>} key="completed" />
                    <TabPane tab={<span>Cuộc hẹn bị từ chối/hủy <Badge count={bookings.filter(b => b.session_status === 'rejected' || b.session_status === 'canceled_by_member' || b.session_status === 'canceled_by_coach').length} /></span>} key="rejected_cancelled" />
                </Tabs>

                <DataTable
                    columns={columns}
                    dataSource={filteredBookings}
                    loading={loading}
                    rowKey="session_id"
                    noDataContent={activeTab === 'pending' ? 'Không có cuộc hẹn nào đang chờ. Tất cả yêu cầu đã được xử lý!' : `Không có cuộc hẹn nào ${getStatusText(activeTab)}.`}
                />

                {selectedBooking && (
                    <Modal
                        title="Chi tiết cuộc hẹn"
                        visible={isModalVisible}
                        onCancel={handleCancel}
                        footer={null}
                    >
                        <p><strong>Tên thành viên:</strong> {selectedBooking.member_name}</p>
                        <p><strong>ID Thành viên:</strong> {selectedBooking.member_user_id}</p>
                        <p><strong>Thời gian dự kiến:</strong> {formatDateTime(selectedBooking.scheduled_time).date} {formatDateTime(selectedBooking.scheduled_time).time}</p>
                        <p><strong>Trạng thái:</strong> {getStatusText(selectedBooking.session_status)}</p>
                        {selectedBooking.google_meet_link && (
                            <p><strong>Liên kết Google Meet:</strong> <a href={selectedBooking.google_meet_link} target="_blank" rel="noopener noreferrer">{selectedBooking.google_meet_link}</a></p>
                        )}
                    </Modal>
                )}
            </Card>
        </div>
    );
};

export default BookingManagement; 