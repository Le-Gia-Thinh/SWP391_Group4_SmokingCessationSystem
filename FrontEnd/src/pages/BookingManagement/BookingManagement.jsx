import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Modal, Form, Input, Select, message, Avatar, Space, Tooltip, Spin, Tabs, Row, Col, Typography, Badge } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined, ReloadOutlined, UserOutlined, ClockCircleOutlined, CheckCircleOutlined, TrophyOutlined, ExclamationCircleOutlined, FileDoneOutlined, WarningOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import ActionButtonGroup from '../../components/ui/ActionButtonGroup';
import DataTable from '../../components/ui/DataTable';
import Navbar from '../../layouts/Navbar';
import './BookingManagement.css';
import moment from 'moment-timezone';

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
    const [completeModal, setCompleteModal] = useState(false);
    const [reportModal, setReportModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [completeNotes, setCompleteNotes] = useState('');
    const [reportReason, setReportReason] = useState('');
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [rejectedBadge, setRejectedBadge] = useState(0);

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

    useEffect(() => {
        setRejectedBadge(bookings.filter(b =>
            b.session_status === 'rejected' ||
            b.session_status === 'canceled_by_member' ||
            b.session_status === 'canceled_by_coach'
        ).length);
    }, [bookings]);

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
        if (!dateTimeString) return { date: '', time: '' };
        const local = moment.parseZone(dateTimeString);
        return {
            date: local.format('DD/MM/YYYY'),
            time: local.format('HH:mm')
        };
    };

    const handleOpenCompleteModal = (sessionId) => {
        setCurrentSessionId(sessionId);
        setCompleteNotes('');
        setCompleteModal(true);
    };

    const handleCompleteAppointment = async () => {
        setModalLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/appointment/${currentSessionId}/complete`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ notes: completeNotes })
            });
            if (!response.ok) throw new Error('Không thể hoàn thành buổi tư vấn');
            message.success('Đã hoàn thành buổi tư vấn!');
            setCompleteModal(false);
            loadBookings();
        } catch (error) {
            message.error(error.message || 'Không thể hoàn thành buổi tư vấn');
        } finally {
            setModalLoading(false);
        }
    };

    const handleOpenReportModal = (sessionId) => {
        setCurrentSessionId(sessionId);
        setReportReason('');
        setReportModal(true);
    };

    const handleReportMissingMember = async () => {
        setModalLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/appointment/${currentSessionId}/report-missing-member`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ reason: reportReason })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Không thể báo cáo thành viên vắng mặt');
            }

            message.success('Đã báo cáo thành viên vắng mặt!');
            setReportModal(false);
            loadBookings();
        } catch (error) {
            message.error(error.message || 'Không thể báo cáo thành viên vắng mặt');
        } finally {
            setModalLoading(false);
        }
    };

    const canReportMissingMember = (scheduledTime) => {
        const now = moment();
        const scheduledDateTime = moment(scheduledTime);
        const minReportTime = moment(scheduledDateTime).add(15, 'minutes'); // Sau 15 phút
        return now.isSameOrAfter(scheduledDateTime) && now.isSameOrAfter(minReportTime);
    };

    const getReportButtonTooltip = (scheduledTime) => {
        const now = moment();
        const scheduledDateTime = moment(scheduledTime);

        if (now.isBefore(scheduledDateTime)) {
            return 'Chỉ được báo cáo sau giờ hẹn';
        }

        const minReportTime = moment(scheduledDateTime).add(15, 'minutes');
        if (now.isBefore(minReportTime)) {
            const remainingMinutes = Math.ceil(minReportTime.diff(now, 'minutes'));
            return `Chỉ được báo cáo sau 15 phút kể từ giờ hẹn. Còn ${remainingMinutes} phút`;
        }

        return 'Báo cáo thành viên vắng mặt';
    };

    const isActionable = (status) => ['pending', 'accepted'].includes(status);

    // Define actions for ActionButtonGroup
    const actions = [
        {
            type: 'view',
            icon: <EyeOutlined />,
            tooltip: 'Xem chi tiết',
            onClick: (record) => handleViewBooking(record)
        },
        {
            type: 'accept',
            icon: <CheckOutlined />,
            tooltip: 'Chấp nhận',
            onClick: (record) => handleAcceptAppointment(record.session_id)
        },
        {
            type: 'reject',
            icon: <CloseOutlined />,
            tooltip: 'Từ chối',
            onClick: (record) => handleRejectAppointment(record.session_id)
        },
        {
            type: 'complete',
            icon: <FileDoneOutlined />,
            tooltip: 'Hoàn thành',
            onClick: (record) => handleOpenCompleteModal(record.session_id)
        },
        {
            type: 'report',
            icon: <WarningOutlined />,
            tooltip: 'Báo cáo vắng mặt',
            onClick: (record) => handleOpenReportModal(record.session_id)
        }
    ];

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
                if (!isActionable(record.session_status)) return null;

                // Filter actions based on session status
                const filteredActions = actions.filter(action => {
                    if (action.type === 'accept' || action.type === 'reject') {
                        return record.session_status === 'pending';
                    }
                    if (action.type === 'complete' || action.type === 'report') {
                        return record.session_status === 'accepted';
                    }
                    return true; // Always show view action
                });

                // Add disabled state for report action
                const actionsWithDisabled = filteredActions.map(action => {
                    if (action.type === 'report') {
                        return {
                            ...action,
                            disabled: !canReportMissingMember(record.scheduled_time),
                            tooltip: getReportButtonTooltip(record.scheduled_time)
                        };
                    }
                    return action;
                });

                return (
                    <ActionButtonGroup
                        actions={actionsWithDisabled}
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
                <Tabs
                    defaultActiveKey="pending"
                    activeKey={activeTab}
                    onChange={key => {
                        setActiveTab(key);
                        if (key === 'rejected_cancelled') setRejectedBadge(0);
                    }}
                >
                    <TabPane tab={<span>Cuộc hẹn đang chờ <Badge count={bookings.filter(b => b.session_status === 'pending').length} /></span>} key="pending" />
                    <TabPane tab={<span>Cuộc hẹn đã chấp nhận <Badge count={bookings.filter(b => b.session_status === 'accepted').length} /></span>} key="accepted" />
                    <TabPane tab={<span>Cuộc hẹn đã hoàn thành <Badge count={bookings.filter(b => b.session_status === 'completed').length} /></span>} key="completed" />
                    <TabPane tab={<span>Cuộc hẹn bị từ chối/hủy <Badge count={rejectedBadge} /></span>} key="rejected_cancelled" />
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

                <Modal
                    title="Hoàn thành buổi tư vấn"
                    open={completeModal}
                    onCancel={() => setCompleteModal(false)}
                    onOk={handleCompleteAppointment}
                    confirmLoading={modalLoading}
                    okText="Xác nhận hoàn thành"
                    cancelText="Hủy"
                >
                    <Form layout="vertical">
                        <Form.Item label="Ghi chú (tuỳ chọn)">
                            <Input.TextArea
                                value={completeNotes}
                                onChange={e => setCompleteNotes(e.target.value)}
                                placeholder="Nhập ghi chú cho buổi tư vấn này..."
                                rows={3}
                            />
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal
                    title="Báo cáo thành viên vắng mặt"
                    open={reportModal}
                    onCancel={() => setReportModal(false)}
                    onOk={handleReportMissingMember}
                    confirmLoading={modalLoading}
                    okText="Báo cáo"
                    cancelText="Hủy"
                >
                    <Form layout="vertical">
                        <Form.Item label="Lý do vắng mặt" required>
                            <Input.TextArea
                                value={reportReason}
                                onChange={e => setReportReason(e.target.value)}
                                placeholder="Nhập lý do thành viên vắng mặt..."
                                rows={3}
                            />
                        </Form.Item>
                    </Form>
                </Modal>
            </Card>
        </div>
    );
};

export default BookingManagement; 