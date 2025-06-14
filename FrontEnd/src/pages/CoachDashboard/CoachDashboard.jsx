import React, { useState, useEffect } from 'react';
import { Tabs, Card, Row, Col, Statistic, Button, Space, Typography, Alert, Divider } from 'antd';
import { UserOutlined, CheckCircleOutlined, TrophyOutlined, RiseOutlined, LinkOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import BookingManagement from '../BookingManagement/BookingManagement';
import Navbar from '../../layouts/Navbar';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const CoachDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [copied, setCopied] = useState(false);

    // Mock data for Coach - Dữ liệu mẫu cho Coach
    const mockStats = {
        totalBookings: 15,
        confirmedBookings: 8,
        completedSessions: 12,
        averageRating: 4.8
    };

    // Generate fixed Google Meet link for coach
    const generateMeetLink = (coachId) => {
        return `https://meet.google.com/quit-smoking-coach-${coachId}`;
    };

    const coachMeetLink = generateMeetLink(user?.id || '001');

    const handleCopyMeetLink = () => {
        navigator.clipboard.writeText(coachMeetLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
            <Card title="Your Google Meet Link" style={{ marginBottom: 24 }}>
                <Alert
                    message="Fixed Meet Link"
                    description="This is your permanent Google Meet link that will be automatically shared with users when they book sessions with you."
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
                            {coachMeetLink}
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
                        <li>This link remains the same for all your sessions</li>
                    </ul>
                </div>
            </Card>

            {/* Stats Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Total Bookings"
                            value={mockStats.totalBookings}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Confirmed Sessions"
                            value={mockStats.confirmedBookings}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Completed Sessions"
                            value={mockStats.completedSessions}
                            prefix={<TrophyOutlined />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Average Rating"
                            value={mockStats.averageRating}
                            suffix="/5"
                            prefix={<RiseOutlined />}
                            valueStyle={{ color: '#fa8c16' }}
                        />
                    </Card>
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
                                <TrophyOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                                <Text strong>Session History</Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    View completed sessions and feedback
                                </Text>
                            </Space>
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card hoverable>
                            <Space direction="vertical" align="center" style={{ width: '100%' }}>
                                <RiseOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
                                <Text strong>Performance Stats</Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Track your coaching performance
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
                            <TabPane tab="Booking Management" key="bookings">
                                <BookingManagement />
                            </TabPane>
                        </Tabs>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CoachDashboard; 