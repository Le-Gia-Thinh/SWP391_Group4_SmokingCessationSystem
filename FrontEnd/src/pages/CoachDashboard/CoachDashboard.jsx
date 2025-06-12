import React, { useState } from 'react';
import { Tabs, Card, Row, Col, Statistic, Table, Button, Tag, Avatar, Progress, Space, Typography } from 'antd';
import { UserOutlined, CheckCircleOutlined, TrophyOutlined, RiseOutlined, MessageOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import BookingManagement from '../BookingManagement/BookingManagement';
import Navbar from '../../layouts/Navbar';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const CoachDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');

    // Mock data for Coach - Dữ liệu mẫu cho Coach
    const mockStudents = [
        { id: 1, name: 'John Smith', progress: 75, lastContact: '2 days ago', status: 'active' },
        { id: 2, name: 'Emma Johnson', progress: 45, lastContact: '1 week ago', status: 'active' },
        { id: 3, name: 'Michael Brown', progress: 90, lastContact: '3 days ago', status: 'completed' },
        { id: 4, name: 'Sarah Davis', progress: 30, lastContact: '5 days ago', status: 'inactive' }
    ];

    const mockStats = {
        totalStudents: 12,
        activeStudents: 8,
        completedPlans: 3,
        averageProgress: 68
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'green';
            case 'completed': return 'blue';
            case 'inactive': return 'default';
            default: return 'default';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'active': return 'Active';
            case 'completed': return 'Completed';
            case 'inactive': return 'Inactive';
            default: return status;
        }
    };

    const studentColumns = [
        {
            title: 'Student',
            dataIndex: 'name',
            key: 'name',
            render: (name) => (
                <Space>
                    <Avatar icon={<UserOutlined />} />
                    <Text strong>{name}</Text>
                </Space>
            ),
        },
        {
            title: 'Progress',
            dataIndex: 'progress',
            key: 'progress',
            render: (progress) => (
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Progress percent={progress} size="small" />
                    <Text type="secondary">{progress}%</Text>
                </Space>
            ),
        },
        {
            title: 'Last Contact',
            dataIndex: 'lastContact',
            key: 'lastContact',
            render: (contact) => <Text type="secondary">{contact}</Text>,
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
            title: 'Actions',
            key: 'actions',
            render: () => (
                <Space>
                    <Button type="link" icon={<EyeOutlined />} size="small">
                        View Details
                    </Button>
                    <Button type="link" icon={<MessageOutlined />} size="small">
                        Message
                    </Button>
                </Space>
            ),
        },
    ];

    const OverviewTab = () => (
        <div style={{ padding: '24px 0' }}>
            {/* Header */}
            <Card style={{ marginBottom: 24 }}>
                <Title level={2}>Welcome, {user?.name}!</Title>
                <Text type="secondary">
                    This is the Coach Dashboard. You can manage students and track their smoking cessation progress.
                </Text>
            </Card>

            {/* Stats Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Total Students"
                            value={mockStats.totalStudents}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Active Students"
                            value={mockStats.activeStudents}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Completed Plans"
                            value={mockStats.completedPlans}
                            prefix={<TrophyOutlined />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Average Progress"
                            value={mockStats.averageProgress}
                            suffix="%"
                            prefix={<RiseOutlined />}
                            valueStyle={{ color: '#fa8c16' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Students List */}
            <Card
                title="Students List"
                extra={
                    <Button type="primary" icon={<PlusOutlined />}>
                        Add New Student
                    </Button>
                }
                style={{ marginBottom: 24 }}
            >
                <Table
                    columns={studentColumns}
                    dataSource={mockStudents}
                    rowKey="id"
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} students`,
                    }}
                />
            </Card>

            {/* Quick Actions */}
            <Card title="Quick Actions">
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                        <Card hoverable>
                            <Space direction="vertical" align="center" style={{ width: '100%' }}>
                                <PlusOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                                <Text strong>Create New Plan</Text>
                            </Space>
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card hoverable>
                            <Space direction="vertical" align="center" style={{ width: '100%' }}>
                                <MessageOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                                <Text strong>Send Bulk Message</Text>
                            </Space>
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card hoverable>
                            <Space direction="vertical" align="center" style={{ width: '100%' }}>
                                <TrophyOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                                <Text strong>View Reports</Text>
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