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
                throw new Error('Failed to load bookings');
            }

            const data = await response.json();
            console.log('DEBUG: Raw data from API:', data.data);
            setBookings(data.data); // Assuming the backend now returns { success: true, data: [...] }
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

    const handleAcceptAppointment = async (sessionId) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/appointment/${sessionId}/accept`, {
                method: 'PUT',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to accept appointment');
            }

            message.success('Appointment accepted successfully!');
            loadBookings(); // Reload to get updated data
        } catch (error) {
            console.error('Error accepting appointment:', error);
            message.error('Failed to accept appointment');
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
                throw new Error('Failed to reject appointment');
            }

            message.success('Appointment rejected successfully!');
            loadBookings(); // Reload to get updated data
        } catch (error) {
            console.error('Error rejecting appointment:', error);
            message.error('Failed to reject appointment');
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
                return 'Pending';
            case 'accepted':
                return 'Accepted';
            case 'rejected':
                return 'Rejected';
            case 'canceled_by_member':
                return 'Canceled';
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
            title: 'Member',
            key: 'member',
            render: (_, record) => (
                <Space>
                    <Avatar icon={<UserOutlined />} />
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{record.member_name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Member ID: {record.member_user_id}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Time',
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
            title: 'Status',
            key: 'session_status',
            render: (_, record) => (
                <Tag color={getStatusColor(record.session_status)}>
                    {getStatusText(record.session_status)}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => {
                const actions = [
                    {
                        type: 'view',
                        tooltip: 'View Details',
                        onClick: () => handleViewBooking(record),
                        icon: <EyeOutlined />
                    },
                    {
                        type: 'accept',
                        tooltip: 'Accept Appointment',
                        onClick: () => handleAcceptAppointment(record.session_id),
                        icon: <CheckOutlined />,
                        hidden: record.session_status !== 'pending'
                    },
                    {
                        type: 'reject',
                        tooltip: 'Reject Appointment',
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
                <div style={{ marginTop: '16px' }}>Loading appointments...</div>
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
                            <CheckCircleOutlined /> Appointment Management
                        </Title>
                        <Text type="secondary">
                            View and manage appointment requests from members
                        </Text>
                    </Col>
                    <Col>
                        <Button type="primary" icon={<ReloadOutlined />} onClick={loadBookings}>
                            Refresh
                        </Button>
                    </Col>
                </Row>
            </div>

            <Card>
                <Tabs defaultActiveKey="pending" activeKey={activeTab} onChange={onTabChange}>
                    <TabPane tab={<span>Pending Appointments <Badge count={bookings.filter(b => b.session_status === 'pending').length} /></span>} key="pending" />
                    <TabPane tab={<span>Accepted Appointments <Badge count={bookings.filter(b => b.session_status === 'accepted').length} /></span>} key="accepted" />
                    <TabPane tab={<span>Completed Appointments <Badge count={bookings.filter(b => b.session_status === 'completed').length} /></span>} key="completed" />
                    <TabPane tab={<span>Rejected/Cancelled Appointments <Badge count={bookings.filter(b => b.session_status === 'rejected' || b.session_status === 'canceled_by_member' || b.session_status === 'canceled_by_coach').length} /></span>} key="rejected_cancelled" />
                </Tabs>

                <DataTable
                    columns={columns}
                    dataSource={filteredBookings}
                    loading={loading}
                    rowKey="session_id"
                    noDataContent={activeTab === 'pending' ? 'No pending appointments. All requests have been processed!' : `No ${activeTab} appointments.`}
                />

                {selectedBooking && (
                    <Modal
                        title="Booking Details"
                        visible={isModalVisible}
                        onCancel={handleCancel}
                        footer={null}
                    >
                        <p><strong>Member Name:</strong> {selectedBooking.member_name}</p>
                        <p><strong>Member ID:</strong> {selectedBooking.member_user_id}</p>
                        <p><strong>Scheduled Time:</strong> {formatDateTime(selectedBooking.scheduled_time).date} {formatDateTime(selectedBooking.scheduled_time).time}</p>
                        <p><strong>Status:</strong> {getStatusText(selectedBooking.session_status)}</p>
                        {selectedBooking.google_meet_link && (
                            <p><strong>Google Meet Link:</strong> <a href={selectedBooking.google_meet_link} target="_blank" rel="noopener noreferrer">{selectedBooking.google_meet_link}</a></p>
                        )}
                    </Modal>
                )}
            </Card>
        </div>
    );
};

export default BookingManagement; 