import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Modal, Form, Input, Select, message, Avatar, Space, Tooltip } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
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

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = () => {
        // Load bookings from localStorage (in real app, this would be API call)
        const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const coachBookings = allBookings.filter(booking => booking.coachId === user.id);
        setBookings(coachBookings);
    };

    const handleViewBooking = (booking) => {
        setSelectedBooking(booking);
        setIsModalVisible(true);
    };

    const handleRespondToBooking = async (values) => {
        setLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Generate fixed Google Meet link for coach
            const generateMeetLink = (coachId) => {
                return `https://meet.google.com/quit-smoking-coach-${coachId}`;
            };
            const coachMeetLink = generateMeetLink(user.id);

            const updatedBookings = bookings.map(booking => {
                if (booking.id === selectedBooking.id) {
                    return {
                        ...booking,
                        status: values.status,
                        coachResponse: values.response,
                        respondedAt: new Date().toISOString(),
                        confirmedDate: values.status === 'confirmed' ? values.confirmedDate : null,
                        confirmedTime: values.status === 'confirmed' ? values.confirmedTime : null,
                        meetLink: values.status === 'confirmed' ? coachMeetLink : null
                    };
                }
                return booking;
            });

            // Update localStorage
            const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
            const updatedAllBookings = allBookings.map(booking => {
                if (booking.id === selectedBooking.id) {
                    return {
                        ...booking,
                        status: values.status,
                        coachResponse: values.response,
                        respondedAt: new Date().toISOString(),
                        confirmedDate: values.status === 'confirmed' ? values.confirmedDate : null,
                        confirmedTime: values.status === 'confirmed' ? values.confirmedTime : null,
                        meetLink: values.status === 'confirmed' ? coachMeetLink : null
                    };
                }
                return booking;
            });

            localStorage.setItem('bookings', JSON.stringify(updatedAllBookings));
            setBookings(updatedBookings);

            if (values.status === 'confirmed') {
                message.success('Booking confirmed! Meet link has been automatically sent to the user.');
            } else {
                message.success(`Booking ${values.status} successfully!`);
            }

            setIsModalVisible(false);
            responseForm.resetFields();
        } catch (error) {
            message.error('Failed to respond to booking');
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
            case 'confirmed': return 'green';
            case 'rejected': return 'red';
            case 'completed': return 'blue';
            default: return 'default';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Pending';
            case 'confirmed': return 'Confirmed';
            case 'rejected': return 'Rejected';
            case 'completed': return 'Completed';
            default: return status;
        }
    };

    const columns = [
        {
            title: 'User',
            dataIndex: 'userName',
            key: 'userName',
            render: (name, record) => (
                <Space>
                    <Avatar icon={<UserOutlined />} />
                    <div>
                        <div style={{ fontWeight: 600 }}>{name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{record.userEmail}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Session Type',
            dataIndex: 'sessionType',
            key: 'sessionType',
            render: (type) => {
                const typeLabels = {
                    'initial': 'Initial Consultation',
                    'followup': 'Follow-up Session',
                    'emergency': 'Emergency Support',
                    'group': 'Group Session'
                };
                return typeLabels[type] || type;
            }
        },
        {
            title: 'Date & Time',
            key: 'datetime',
            render: (_, record) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{record.date}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        <ClockCircleOutlined /> {record.time} ({record.duration} min)
                    </div>
                </div>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={getStatusColor(status)}>
                    {getStatusText(status)}
                </Tag>
            ),
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Tooltip title="View Details">
                        <Button
                            type="primary"
                            icon={<EyeOutlined />}
                            size="small"
                            onClick={() => handleViewBooking(record)}
                        />
                    </Tooltip>
                    {record.status === 'pending' && (
                        <>
                            <Tooltip title="Confirm">
                                <Button
                                    type="primary"
                                    icon={<CheckOutlined />}
                                    size="small"
                                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                    onClick={() => {
                                        setSelectedBooking(record);
                                        responseForm.setFieldsValue({ status: 'confirmed' });
                                        setIsModalVisible(true);
                                    }}
                                />
                            </Tooltip>
                            <Tooltip title="Reject">
                                <Button
                                    danger
                                    icon={<CloseOutlined />}
                                    size="small"
                                    onClick={() => {
                                        setSelectedBooking(record);
                                        responseForm.setFieldsValue({ status: 'rejected' });
                                        setIsModalVisible(true);
                                    }}
                                />
                            </Tooltip>
                        </>
                    )}
                </Space>
            ),
        },
    ];

    const pendingBookings = bookings.filter(b => b.status === 'pending');
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const completedBookings = bookings.filter(b => b.status === 'completed');

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
                        <div className="stat-number">{confirmedBookings.length}</div>
                        <div className="stat-label">Confirmed Sessions</div>
                    </div>
                </Card>
                <Card className="stat-card">
                    <div className="stat-content">
                        <div className="stat-number">{completedBookings.length}</div>
                        <div className="stat-label">Completed Sessions</div>
                    </div>
                </Card>
            </div>

            <Card title="Booking Requests" className="bookings-table-card">
                <Table
                    columns={columns}
                    dataSource={bookings}
                    rowKey="id"
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} bookings`,
                    }}
                />
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
                            <h3>User Information</h3>
                            <p><strong>Name:</strong> {selectedBooking.userName}</p>
                            <p><strong>Email:</strong> {selectedBooking.userEmail}</p>

                            <h3>Session Details</h3>
                            <p><strong>Date:</strong> {selectedBooking.date}</p>
                            <p><strong>Time:</strong> {selectedBooking.time}</p>
                            <p><strong>Duration:</strong> {selectedBooking.duration} minutes</p>
                            <p><strong>Session Type:</strong> {selectedBooking.sessionType}</p>

                            {selectedBooking.notes && (
                                <>
                                    <h3>User Notes</h3>
                                    <p>{selectedBooking.notes}</p>
                                </>
                            )}

                            {selectedBooking.coachResponse && (
                                <>
                                    <h3>Your Response</h3>
                                    <p>{selectedBooking.coachResponse}</p>
                                </>
                            )}

                            {selectedBooking.meetLink && (
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
                                            Meet Link Sent to User:
                                        </p>
                                        <a
                                            href={selectedBooking.meetLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: '#52c41a', wordBreak: 'break-all' }}
                                        >
                                            {selectedBooking.meetLink}
                                        </a>
                                    </div>
                                </>
                            )}
                        </div>

                        {selectedBooking.status === 'pending' && (
                            <Form
                                form={responseForm}
                                layout="vertical"
                                onFinish={handleRespondToBooking}
                                initialValues={{ status: 'confirmed' }}
                            >
                                <Form.Item
                                    name="status"
                                    label="Response"
                                    rules={[{ required: true, message: 'Please select a response' }]}
                                >
                                    <Select>
                                        <Option value="confirmed">Confirm Booking</Option>
                                        <Option value="rejected">Reject Booking</Option>
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    name="response"
                                    label="Response Message"
                                    rules={[{ required: true, message: 'Please provide a response message' }]}
                                >
                                    <TextArea
                                        rows={4}
                                        placeholder="Provide a response message to the user..."
                                    />
                                </Form.Item>

                                <Form.Item
                                    noStyle
                                    shouldUpdate={(prevValues, currentValues) => prevValues.status !== currentValues.status}
                                >
                                    {({ getFieldValue }) => {
                                        const status = getFieldValue('status');
                                        return status === 'confirmed' ? (
                                            <>
                                                <Form.Item
                                                    name="confirmedDate"
                                                    label="Confirmed Date"
                                                    rules={[{ required: true, message: 'Please select confirmed date' }]}
                                                >
                                                    <Input type="date" />
                                                </Form.Item>
                                                <Form.Item
                                                    name="confirmedTime"
                                                    label="Confirmed Time"
                                                    rules={[{ required: true, message: 'Please select confirmed time' }]}
                                                >
                                                    <Input type="time" />
                                                </Form.Item>
                                            </>
                                        ) : null;
                                    }}
                                </Form.Item>

                                <Form.Item>
                                    <div className="modal-actions">
                                        <Button onClick={handleCancel}>
                                            Cancel
                                        </Button>
                                        <Button type="primary" htmlType="submit" loading={loading}>
                                            Submit Response
                                        </Button>
                                    </div>
                                </Form.Item>
                            </Form>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default BookingManagement; 