import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Modal, Form, Input, Select, message, Avatar, Space, Tooltip, Spin } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined, ClockCircleOutlined, UserOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import ActionButtonGroup from '../../components/ui/ActionButtonGroup';
import DataTable from '../../components/ui/DataTable';
import Navbar from '../../layouts/Navbar';
import './BookingManagement.css';

const { TextArea } = Input;
const { Option } = Select;

const BookingManagement = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [responseForm] = Form.useForm();
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            setInitialLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/appointment/pending', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load bookings');
            }

            const data = await response.json();
            setBookings(data || []);
        } catch (error) {
            console.error('Error loading bookings:', error);
            message.error('Failed to load bookings');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleViewBooking = (booking) => {
        setSelectedBooking(booking);
        setIsModalVisible(true);
    };

    const handleAcceptAppointment = async (sessionId) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/appointment/${sessionId}/accept`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to accept appointment');
            }

            message.success('Appointment accepted successfully! Meet link has been sent to the user.');
            loadBookings(); // Reload the list
        } catch (error) {
            console.error('Error accepting appointment:', error);
            message.error(error.message || 'Failed to accept appointment');
        } finally {
            setLoading(false);
        }
    };

    const handleRejectAppointment = async (sessionId) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/appointment/${sessionId}/reject`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to reject appointment');
            }

            message.success('Appointment rejected successfully!');
            loadBookings(); // Reload the list
        } catch (error) {
            console.error('Error rejecting appointment:', error);
            message.error(error.message || 'Failed to reject appointment');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        responseForm.resetFields();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'orange';
            case 'accepted': return 'green';
            case 'rejected': return 'red';
            case 'completed': return 'blue';
            case 'canceled_by_member': return 'gray';
            default: return 'default';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Pending';
            case 'accepted': return 'Accepted';
            case 'rejected': return 'Rejected';
            case 'completed': return 'Completed';
            case 'canceled_by_member': return 'Canceled by Member';
            default: return status;
        }
    };

    const formatDateTime = (dateTimeString) => {
        const date = new Date(dateTimeString);
        return {
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    };

    const columns = [
        {
            title: 'User',
            dataIndex: 'user_name',
            key: 'user_name',
            render: (name, record) => (
                <Space>
                    <Avatar icon={<UserOutlined />} />
                    <div>
                        <div style={{ fontWeight: 600 }}>{name || 'Unknown User'}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>ID: {record.user_id}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Session Details',
            key: 'session_details',
            render: (_, record) => {
                const { date, time } = formatDateTime(record.scheduled_time);
                return (
                    <div>
                        <div style={{ fontWeight: 600 }}>{date}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            <ClockCircleOutlined /> {time}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            Session ID: {record.session_id}
                        </div>
                    </div>
                );
            },
        },
        {
            title: 'Status',
            dataIndex: 'session_status',
            key: 'session_status',
            render: (status) => (
                <Tag color={getStatusColor(status)}>
                    {getStatusText(status)}
                </Tag>
            ),
        },
        {
            title: 'Meet Link',
            key: 'meet_link',
            render: (_, record) => {
                if (record.session_status === 'accepted' && record.google_meet_link) {
                    return (
                        <a
                            href={record.google_meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#52c41a' }}
                        >
                            Join Meeting
                        </a>
                    );
                }
                return <span style={{ color: '#999' }}>Not available</span>;
            },
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
                            tooltip: 'Accept',
                            onClick: handleAcceptAppointment,
                            loading: loading
                        },
                        {
                            type: 'reject',
                            tooltip: 'Reject',
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
    const acceptedBookings = bookings.filter(b => b.session_status === 'accepted');
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
            <div className="booking-stats">
                <Card className="stat-card">
                    <div className="stat-content">
                        <div className="stat-number">{pendingBookings.length}</div>
                        <div className="stat-label">Pending Requests</div>
                    </div>
                </Card>
                <Card className="stat-card">
                    <div className="stat-content">
                        <div className="stat-number">{acceptedBookings.length}</div>
                        <div className="stat-label">Accepted Sessions</div>
                    </div>
                </Card>
                <Card className="stat-card">
                    <div className="stat-content">
                        <div className="stat-number">{completedBookings.length}</div>
                        <div className="stat-label">Completed Sessions</div>
                    </div>
                </Card>
            </div>

            <DataTable
                title="Booking Requests"
                columns={columns}
                dataSource={bookings}
                loading={loading}
                rowKey="session_id"
                extra={
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={loadBookings}
                        loading={loading}
                    >
                        Refresh
                    </Button>
                }
            />

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
                            <h3>User Information</h3>
                            <p><strong>User ID:</strong> {selectedBooking.user_id}</p>
                            <p><strong>User Name:</strong> {selectedBooking.user_name || 'Unknown'}</p>

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
                                        Accept Appointment
                                    </Button>
                                    <Button
                                        danger
                                        icon={<CloseOutlined />}
                                        onClick={() => handleRejectAppointment(selectedBooking.session_id)}
                                        loading={loading}
                                    >
                                        Reject Appointment
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