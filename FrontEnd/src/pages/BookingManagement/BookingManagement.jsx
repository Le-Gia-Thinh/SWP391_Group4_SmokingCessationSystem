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
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/appointment/coach', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load bookings');
            }

            const data = await response.json();
            setBookings(data);
        } catch (error) {
            console.error('Error loading bookings:', error);
            message.error('Failed to load bookings');

            // Mock data for demonstration
            setBookings([
                {
                    session_id: 1,
                    user_id: 101,
                    user_name: 'John Doe',
                    scheduled_time: '2024-01-15T10:00:00Z',
                    session_status: 'pending',
                    created_at: '2024-01-14T15:30:00Z',
                    notes: 'First session, need help with smoking cessation plan'
                },
                {
                    session_id: 2,
                    user_id: 102,
                    user_name: 'Jane Smith',
                    scheduled_time: '2024-01-15T14:00:00Z',
                    session_status: 'confirmed',
                    created_at: '2024-01-14T10:15:00Z',
                    google_meet_link: 'https://meet.google.com/abc-defg-hij',
                    notes: 'Follow-up session'
                },
                {
                    session_id: 3,
                    user_id: 103,
                    user_name: 'Mike Johnson',
                    scheduled_time: '2024-01-14T16:00:00Z',
                    session_status: 'completed',
                    created_at: '2024-01-13T09:45:00Z',
                    google_meet_link: 'https://meet.google.com/xyz-uvw-rst',
                    notes: 'Completed session, good progress'
                }
            ]);
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
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/appointment/${sessionId}/accept`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/appointment/${sessionId}/reject`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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
            case 'confirmed':
                return 'green';
            case 'completed':
                return 'blue';
            case 'cancelled':
                return 'red';
            default:
                return 'default';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending':
                return 'Pending';
            case 'confirmed':
                return 'Confirmed';
            case 'completed':
                return 'Completed';
            case 'cancelled':
                return 'Cancelled';
            default:
                return status;
        }
    };

    const formatDateTime = (dateTimeString) => {
        const date = new Date(dateTimeString);
        return {
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    };

    // Filter bookings based on active tab
    const getFilteredBookings = () => {
        switch (activeTab) {
            case 'pending':
                return bookings.filter(b => b.session_status === 'pending');
            case 'confirmed':
                return bookings.filter(b => b.session_status === 'confirmed');
            case 'completed':
                return bookings.filter(b => b.session_status === 'completed');
            default:
                return bookings;
        }
    };

    const columns = [
        {
            title: 'Member',
            key: 'member',
            render: (_, record) => (
                <Space>
                    <Avatar icon={<UserOutlined />} />
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{record.user_name || `User ${record.user_id}`}</div>
                        <Text type="secondary">ID: {record.user_id}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Scheduled Time',
            key: 'scheduled_time',
            render: (_, record) => {
                const { date, time } = formatDateTime(record.scheduled_time);
                return (
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{date}</div>
                        <Text type="secondary">{time}</Text>
                    </div>
                );
            },
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, record) => (
                <Tag color={getStatusColor(record.session_status)} style={{ textTransform: 'capitalize' }}>
                    {getStatusText(record.session_status)}
                </Tag>
            ),
        },
        {
            title: 'Created',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => {
                const actions = [
                    {
                        type: 'view',
                        tooltip: 'View Details',
                        onClick: handleViewBooking
                    }
                ];

                // Add accept/reject buttons for pending bookings
                if (record.session_status === 'pending') {
                    actions.push(
                        {
                            type: 'accept',
                            tooltip: 'Accept Request',
                            onClick: handleAcceptAppointment,
                            loading: loading
                        },
                        {
                            type: 'reject',
                            tooltip: 'Reject Request',
                            onClick: handleRejectAppointment,
                            loading: loading
                        }
                    );
                }

                return (
                    <ActionButtonGroup
                        actions={actions}
                        record={record}
                    />
                );
            },
        },
    ];

    const pendingBookings = bookings.filter(b => b.session_status === 'pending');
    const confirmedBookings = bookings.filter(b => b.session_status === 'confirmed');
    const completedBookings = bookings.filter(b => b.session_status === 'completed');

    if (initialLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>Loading bookings...</div>
            </div>
        );
    }

    return (
        <div className="booking-management">
            {/* Header */}
            <Card style={{ marginBottom: 24 }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={3}>Booking Management</Title>
                        <Text type="secondary">
                            Manage your coaching sessions and respond to member requests
                        </Text>
                    </Col>
                    <Col>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={loadBookings}
                            loading={loading}
                        >
                            Refresh
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* Statistics Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card style={{ textAlign: 'center', background: '#fff7e6' }}>
                        <ClockCircleOutlined style={{ fontSize: 32, color: '#faad14', marginBottom: 8 }} />
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                            {pendingBookings.length}
                        </div>
                        <Text type="secondary">Pending Requests</Text>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card style={{ textAlign: 'center', background: '#f6ffed' }}>
                        <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }} />
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                            {confirmedBookings.length}
                        </div>
                        <Text type="secondary">Confirmed Sessions</Text>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card style={{ textAlign: 'center', background: '#e6f7ff' }}>
                        <TrophyOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                            {completedBookings.length}
                        </div>
                        <Text type="secondary">Completed Sessions</Text>
                    </Card>
                </Col>
            </Row>

            {/* Tabs for different booking statuses */}
            <Card>
                <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
                    <TabPane
                        tab={
                            <Badge count={pendingBookings.length} size="small">
                                <span>
                                    <ClockCircleOutlined />
                                    Pending
                                </span>
                            </Badge>
                        }
                        key="pending"
                    >
                        <DataTable
                            title="Pending Requests"
                            columns={columns}
                            dataSource={pendingBookings}
                            loading={loading}
                            rowKey="session_id"
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} pending requests`,
                            }}
                        />
                    </TabPane>
                    <TabPane
                        tab={
                            <span>
                                <CheckCircleOutlined />
                                Confirmed
                            </span>
                        }
                        key="confirmed"
                    >
                        <DataTable
                            title="Confirmed Sessions"
                            columns={columns}
                            dataSource={confirmedBookings}
                            loading={loading}
                            rowKey="session_id"
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} confirmed sessions`,
                            }}
                        />
                    </TabPane>
                    <TabPane
                        tab={
                            <span>
                                <TrophyOutlined />
                                Completed
                            </span>
                        }
                        key="completed"
                    >
                        <DataTable
                            title="Completed Sessions"
                            columns={columns}
                            dataSource={completedBookings}
                            loading={loading}
                            rowKey="session_id"
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} completed sessions`,
                            }}
                        />
                    </TabPane>
                    <TabPane
                        tab={
                            <span>
                                <UserOutlined />
                                All Bookings
                            </span>
                        }
                        key="all"
                    >
                        <DataTable
                            title="All Bookings"
                            columns={columns}
                            dataSource={bookings}
                            loading={loading}
                            rowKey="session_id"
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} bookings`,
                            }}
                        />
                    </TabPane>
                </Tabs>
            </Card>

            {/* Booking Details Modal */}
            <Modal
                title="Booking Details"
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={700}
            >
                {selectedBooking && (
                    <div className="booking-details">
                        <div className="booking-info">
                            <h3>Member Information</h3>
                            <p><strong>Member ID:</strong> {selectedBooking.user_id}</p>
                            <p><strong>Member Name:</strong> {selectedBooking.user_name || 'Unknown'}</p>

                            <h3>Session Details</h3>
                            <p><strong>Session ID:</strong> {selectedBooking.session_id}</p>
                            <p><strong>Scheduled Time:</strong> {formatDateTime(selectedBooking.scheduled_time).date} at {formatDateTime(selectedBooking.scheduled_time).time}</p>
                            <p><strong>Status:</strong>
                                <Tag color={getStatusColor(selectedBooking.session_status)} style={{ marginLeft: 8 }}>
                                    {getStatusText(selectedBooking.session_status)}
                                </Tag>
                            </p>

                            {selectedBooking.google_meet_link && (
                                <>
                                    <h3>Google Meet Link</h3>
                                    <div style={{
                                        background: '#f6ffed',
                                        border: '1px solid #b7eb8f',
                                        borderRadius: '6px',
                                        padding: '12px',
                                        marginBottom: '16px'
                                    }}>
                                        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>
                                            Meet Link:
                                        </p>
                                        <a
                                            href={selectedBooking.google_meet_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: '#52c41a', wordBreak: 'break-all' }}
                                        >
                                            {selectedBooking.google_meet_link}
                                        </a>
                                    </div>
                                </>
                            )}

                            {selectedBooking.notes && (
                                <>
                                    <h3>Notes</h3>
                                    <div style={{
                                        background: '#f0f0f0',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '6px',
                                        padding: '12px',
                                        marginBottom: '16px'
                                    }}>
                                        <p style={{ margin: 0 }}>{selectedBooking.notes}</p>
                                    </div>
                                </>
                            )}

                            {selectedBooking.created_at && (
                                <p><strong>Created:</strong> {new Date(selectedBooking.created_at).toLocaleString()}</p>
                            )}

                            {selectedBooking.updated_at && (
                                <p><strong>Last Updated:</strong> {new Date(selectedBooking.updated_at).toLocaleString()}</p>
                            )}
                        </div>

                        {selectedBooking.session_status === 'pending' && (
                            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                                <h3>Quick Actions</h3>
                                <Space>
                                    <Button
                                        type="primary"
                                        icon={<CheckOutlined />}
                                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                        onClick={() => handleAcceptAppointment(selectedBooking.session_id)}
                                        loading={loading}
                                    >
                                        Accept Request
                                    </Button>
                                    <Button
                                        danger
                                        icon={<CloseOutlined />}
                                        onClick={() => handleRejectAppointment(selectedBooking.session_id)}
                                        loading={loading}
                                    >
                                        Reject Request
                                    </Button>
                                </Space>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default BookingManagement; 