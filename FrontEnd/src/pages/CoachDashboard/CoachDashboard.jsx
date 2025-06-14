import React, { useState, useEffect } from 'react';
import { Tabs, Card, Row, Col, Statistic, Button, Space, Typography, Alert, Divider, message, Modal, Form, Input } from 'antd';
import { UserOutlined, CheckCircleOutlined, TrophyOutlined, RiseOutlined, LinkOutlined, CopyOutlined, CheckOutlined, EditOutlined, CalendarOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import StatisticCard from '../../components/ui/StatisticCard';
import BookingManagement from '../BookingManagement/BookingManagement';
import ScheduleManagement from './ScheduleManagement';
import Navbar from '../../layouts/Navbar';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const CoachDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [copied, setCopied] = useState(false);
    const [meetLink, setMeetLink] = useState('');
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editForm] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // Stats state
    const [stats, setStats] = useState({
        totalBookings: 0,
        confirmedBookings: 0,
        completedSessions: 0,
        averageRating: 0
    });

    useEffect(() => {
        // Initialize meet link if not set
        if (!meetLink) {
            const defaultLink = `https://meet.google.com/quit-smoking-coach-${user?.id || '001'}`;
            setMeetLink(defaultLink);
        }
        loadStats();
    }, [user]);

    const loadStats = async () => {
        try {
            // In a real app, you would fetch stats from API
            // For now, using mock data
            setStats({
                totalBookings: 15,
                confirmedBookings: 8,
                completedSessions: 12,
                averageRating: 4.8
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleCopyMeetLink = () => {
        navigator.clipboard.writeText(meetLink);
        setCopied(true);
        message.success('Meet link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleEditMeetLink = () => {
        editForm.setFieldsValue({ meetLink });
        setIsEditModalVisible(true);
    };

    const handleUpdateMeetLink = async (values) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/coach/update-meet-link', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ meet_link: values.meetLink })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update meet link');
            }

            setMeetLink(values.meetLink);
            setIsEditModalVisible(false);
            message.success('Meet link updated successfully!');
        } catch (error) {
            console.error('Error updating meet link:', error);
            message.error(error.message || 'Failed to update meet link');
        } finally {
            setLoading(false);
        }
    };

    const OverviewTab = () => (
        <div style={{ padding: '24px 0' }}>
            {/* Header */}
            <Card style={{ marginBottom: 24 }}>
                <Title level={2}>Welcome, {user?.name}!</Title>
                <Text type="secondary">
                    This is your Coach Dashboard. Manage your bookings and help users quit smoking.
                </Text>
            </Card>

            {/* Google Meet Link Section */}
            <Card
                title="Your Google Meet Link"
                style={{ marginBottom: 24 }}
                extra={
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={handleEditMeetLink}
                    >
                        Edit Link
                    </Button>
                }
            >
                <Alert
                    message="Meet Link"
                    description="This is your Google Meet link that will be automatically shared with users when you confirm their booking requests."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />

                <div style={{
                    background: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ flex: 1 }}>
                        <LinkOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        <Text code style={{ fontSize: '16px' }}>
                            {meetLink}
                        </Text>
                    </div>
                    <Button
                        type="primary"
                        icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                        onClick={handleCopyMeetLink}
                        style={{ marginLeft: 16 }}
                    >
                        {copied ? 'Copied!' : 'Copy Link'}
                    </Button>
                </div>

                <Divider />

                <div style={{ color: '#666', fontSize: '14px' }}>
                    <Text strong>How it works:</Text>
                    <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                        <li>Users book sessions with you through the booking system</li>
                        <li>When you confirm a booking, this Meet link is automatically sent to the user</li>
                        <li>Users can join the meeting using this link at the scheduled time</li>
                        <li>You can update this link anytime using the Edit button</li>
                    </ul>
                </div>
            </Card>

            {/* Stats Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <StatisticCard
                        title="Total Bookings"
                        value={stats.totalBookings}
                        prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                        valueStyle={{ color: '#1890ff' }}
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatisticCard
                        title="Confirmed Sessions"
                        value={stats.confirmedBookings}
                        prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        valueStyle={{ color: '#52c41a' }}
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatisticCard
                        title="Completed Sessions"
                        value={stats.completedSessions}
                        prefix={<TrophyOutlined style={{ color: '#722ed1' }} />}
                        valueStyle={{ color: '#722ed1' }}
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatisticCard
                        title="Average Rating"
                        value={stats.averageRating}
                        prefix={<RiseOutlined style={{ color: '#faad14' }} />}
                        valueStyle={{ color: '#faad14' }}
                        precision={1}
                        suffix="/ 5"
                    />
                </Col>
            </Row>

            {/* Quick Actions */}
            <Card title="Quick Actions">
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                        <Card hoverable>
                            <Space direction="vertical" align="center" style={{ width: '100%' }}>
                                <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                                <Text strong>Review Bookings</Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Check and respond to new booking requests
                                </Text>
                            </Space>
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card hoverable>
                            <Space direction="vertical" align="center" style={{ width: '100%' }}>
                                <CalendarOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                                <Text strong>Manage Schedule</Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Create and manage your available time slots
                                </Text>
                            </Space>
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card hoverable>
                            <Space direction="vertical" align="center" style={{ width: '100%' }}>
                                <TrophyOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                                <Text strong>Session History</Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    View completed sessions and feedback
                                </Text>
                            </Space>
                        </Card>
                    </Col>
                </Row>
            </Card>
        </div>
    );

    return (
        <div>
            <Navbar />
            <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
                    <Card>
                        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
                            <TabPane tab="Overview" key="overview">
                                <OverviewTab />
                            </TabPane>
                            <TabPane tab="Schedule Management" key="schedule">
                                <ScheduleManagement />
                            </TabPane>
                            <TabPane tab="Booking Management" key="bookings">
                                <BookingManagement />
                            </TabPane>
                        </Tabs>
                    </Card>
                </div>
            </div>

            {/* Edit Meet Link Modal */}
            <Modal
                title="Edit Google Meet Link"
                open={isEditModalVisible}
                onCancel={() => setIsEditModalVisible(false)}
                footer={null}
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    onFinish={handleUpdateMeetLink}
                >
                    <Form.Item
                        name="meetLink"
                        label="Google Meet Link"
                        rules={[
                            { required: true, message: 'Please enter your Meet link' },
                            { type: 'url', message: 'Please enter a valid URL' },
                            { pattern: /^https:\/\/meet\.google\.com\//, message: 'Please enter a valid Google Meet link' }
                        ]}
                    >
                        <Input
                            placeholder="https://meet.google.com/your-meeting-id"
                            size="large"
                        />
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button onClick={() => setIsEditModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Update Link
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default CoachDashboard; 