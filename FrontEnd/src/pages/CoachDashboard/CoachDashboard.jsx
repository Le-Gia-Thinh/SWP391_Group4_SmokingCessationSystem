import React, { useState, useEffect } from 'react';
import { Tabs, Card, Row, Col, Statistic, Button, Space, Typography, Alert, Divider, message, Modal, Form, Input, Badge, Tag } from 'antd';
import {
    UserOutlined,
    CheckCircleOutlined,
    TrophyOutlined,
    RiseOutlined,
    LinkOutlined,
    CopyOutlined,
    CheckOutlined,
    EditOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    TeamOutlined,
    SettingOutlined,
    BellOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import StatisticCard from '../../components/ui/StatisticCard';
import FormModal from '../../components/ui/FormModal';
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
        pendingBookings: 0,
        confirmedBookings: 0,
        completedSessions: 0,
        averageRating: 0,
        totalEarnings: 0
    });

    // Quick stats for today
    const [todayStats, setTodayStats] = useState({
        todaySessions: 0,
        pendingRequests: 0,
        upcomingSessions: 0
    });

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
        // Initialize meet link if not set
        if (!meetLink) {
            const defaultLink = `https://meet.google.com/quit-smoking-coach-${user?.id || '001'}`;
            setMeetLink(defaultLink);
        }
        loadStats();
        loadTodayStats();
    }, [user]);

    const loadStats = async () => {
        try {
            // Load pending appointments count
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/appointment/pending`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const pendingData = await response.json();
                const pendingCount = pendingData.length || 0;

                setStats({
                    totalBookings: 0,
                    pendingBookings: pendingCount,
                    confirmedBookings: 0,
                    completedSessions: 0,
                    averageRating: 0,
                    totalEarnings: 0
                });
            } else {
                setStats({
                    totalBookings: 0,
                    pendingBookings: 0,
                    confirmedBookings: 0,
                    completedSessions: 0,
                    averageRating: 0,
                    totalEarnings: 0
                });
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            setStats({
                totalBookings: 0,
                pendingBookings: 0,
                confirmedBookings: 0,
                completedSessions: 0,
                averageRating: 0,
                totalEarnings: 0
            });
        }
    };

    const loadTodayStats = async () => {
        try {
            // Load pending appointments for today's stats
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/appointment/pending`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const pendingData = await response.json();
                const pendingCount = pendingData.length || 0;

                setTodayStats({
                    todaySessions: 0,
                    pendingRequests: pendingCount,
                    upcomingSessions: 0
                });
            } else {
                setTodayStats({
                    todaySessions: 0,
                    pendingRequests: 0,
                    upcomingSessions: 0
                });
            }
        } catch (error) {
            console.error('Error loading today stats:', error);
            setTodayStats({
                todaySessions: 0,
                pendingRequests: 0,
                upcomingSessions: 0
            });
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

    // Updated to use correct API endpoint
    const handleUpdateMeetLink = async (values) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/coach/update-meet-link`, {
                method: 'PUT',
                headers: getAuthHeaders(),
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
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={2}>Welcome back, {user?.name}! 👋</Title>
                        <Text type="secondary">
                            Here's what's happening with your coaching sessions today.
                        </Text>
                    </Col>
                    <Col>
                        <Space>
                            <Badge count={todayStats.pendingRequests} size="small">
                                <Button
                                    type="primary"
                                    icon={<BellOutlined />}
                                    onClick={() => setActiveTab('bookings')}
                                >
                                    Review Requests
                                </Button>
                            </Badge>
                            <Button
                                icon={<CalendarOutlined />}
                                onClick={() => setActiveTab('schedule')}
                            >
                                Manage Schedule
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Today's Overview */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card style={{ textAlign: 'center', background: '#f6ffed' }}>
                        <ClockCircleOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }} />
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                            {todayStats.todaySessions}
                        </div>
                        <Text type="secondary">Today's Sessions</Text>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card style={{ textAlign: 'center', background: '#fff7e6' }}>
                        <TeamOutlined style={{ fontSize: 32, color: '#faad14', marginBottom: 8 }} />
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                            {todayStats.pendingRequests}
                        </div>
                        <Text type="secondary">Pending Requests</Text>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card style={{ textAlign: 'center', background: '#e6f7ff' }}>
                        <CalendarOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                            {todayStats.upcomingSessions}
                        </div>
                        <Text type="secondary">Upcoming Sessions</Text>
                    </Card>
                </Col>
            </Row>

            {/* Google Meet Link Section */}
            <Card
                title={
                    <Space>
                        <LinkOutlined style={{ color: '#52c41a' }} />
                        <span>Your Google Meet Link</span>
                    </Space>
                }
                style={{ marginBottom: 24 }}
                extra={
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={handleEditMeetLink}
                    >
                        Update Link
                    </Button>
                }
            >
                <Alert
                    message="Meet Link Management"
                    description="This link is automatically shared with members when you confirm their booking requests."
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
                        <li>Members book sessions with you through the booking system</li>
                        <li>When you confirm a booking, this Meet link is automatically sent to the member</li>
                        <li>Members can join the meeting using this link at the scheduled time</li>
                        <li>You can update this link anytime using the Update Link button</li>
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
                        title="Pending Requests"
                        value={stats.pendingBookings}
                        prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                        valueStyle={{ color: '#faad14' }}
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
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={12}>
                    <StatisticCard
                        title="Average Rating"
                        value={stats.averageRating}
                        prefix={<RiseOutlined style={{ color: '#faad14' }} />}
                        valueStyle={{ color: '#faad14' }}
                        precision={1}
                        suffix="/ 5"
                    />
                </Col>
                <Col xs={24} sm={12} lg={12}>
                    <StatisticCard
                        title="Total Earnings"
                        value={stats.totalEarnings}
                        prefix={<TrophyOutlined style={{ color: '#52c41a' }} />}
                        valueStyle={{ color: '#52c41a' }}
                        suffix="$"
                    />
                </Col>
            </Row>
        </div>
    );

    return (
        <div>
            <Navbar />
            <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
                    <Card>
                        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
                            <TabPane
                                tab={
                                    <span>
                                        <UserOutlined />
                                        Overview
                                    </span>
                                }
                                key="overview"
                            >
                                <OverviewTab />
                            </TabPane>
                            <TabPane
                                tab={
                                    <span>
                                        <CalendarOutlined />
                                        Schedule Management
                                    </span>
                                }
                                key="schedule"
                            >
                                <ScheduleManagement />
                            </TabPane>
                            <TabPane
                                tab={
                                    <Badge count={todayStats.pendingRequests} size="small">
                                        <span>
                                            <CheckCircleOutlined />
                                            Booking Management
                                        </span>
                                    </Badge>
                                }
                                key="bookings"
                            >
                                <BookingManagement />
                            </TabPane>
                        </Tabs>
                    </Card>
                </div>
            </div>

            {/* Edit Meet Link Modal */}
            <FormModal
                title="Update Google Meet Link"
                visible={isEditModalVisible}
                onCancel={() => setIsEditModalVisible(false)}
                onSubmit={handleUpdateMeetLink}
                form={editForm}
                loading={loading}
                width={600}
                okText="Update Link"
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

                <Alert
                    message="Important"
                    description="This link will be automatically shared with members when you confirm their booking requests. Make sure it's always up to date."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            </FormModal>
        </div>
    );
};

export default CoachDashboard; 