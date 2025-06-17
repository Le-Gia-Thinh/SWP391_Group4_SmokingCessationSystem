import React, { useState, useEffect } from 'react';
import {
    Layout,
    Card,
    Button,
    Table,
    Modal,
    Form,
    Input,
    Select,
    Statistic,
    Row,
    Col,
    Space,
    Tag,
    Avatar,
    Typography,
    message,
    Popconfirm,
    Tooltip,
    Divider,
    DatePicker
} from 'antd';
import {
    UserOutlined,
    TeamOutlined,
    UserAddOutlined,
    SafetyCertificateOutlined,
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    ReloadOutlined,
    EyeOutlined,
    CopyOutlined,
    CheckOutlined,
    SearchOutlined,
    FilterOutlined,
    UndoOutlined
} from '@ant-design/icons';
import Navbar from '../../layouts/Navbar';
import StatisticCard from '../../components/ui/StatisticCard';
import DataTable from '../../components/ui/DataTable';
import FormModal from '../../components/ui/FormModal';
import ActionButtonGroup from '../../components/ui/ActionButtonGroup';
import './AdminDashboard.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
const { TextArea } = Input;

const AdminDashboard = () => {
    // State management
    const [coaches, setCoaches] = useState([]);
    const [filteredCoaches, setFilteredCoaches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [createCoachModal, setCreateCoachModal] = useState(false);
    const [editCoachModal, setEditCoachModal] = useState(false);
    const [selectedCoach, setSelectedCoach] = useState(null);
    const [viewCoachModal, setViewCoachModal] = useState(false);
    const [credentialsModal, setCredentialsModal] = useState(false);
    const [newCoachCredentials, setNewCoachCredentials] = useState(null);
    const [copiedField, setCopiedField] = useState('');

    // Search and filter states
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Form instances
    const [coachForm] = Form.useForm();
    const [editForm] = Form.useForm();

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

    // Helper function to handle API responses
    const handleResponse = async (response) => {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }
        return data;
    };

    // Load coaches on component mount
    useEffect(() => {
        loadCoaches();
    }, []);

    // Filter coaches based on search and filters
    useEffect(() => {
        filterCoaches();
    }, [coaches, searchText, statusFilter]);

    const filterCoaches = () => {
        let filtered = [...coaches];

        // Search filter
        if (searchText) {
            filtered = filtered.filter(coach =>
                coach.full_name?.toLowerCase().includes(searchText.toLowerCase()) ||
                coach.email?.toLowerCase().includes(searchText.toLowerCase()) ||
                coach.phone_number?.toLowerCase().includes(searchText.toLowerCase()) ||
                coach.specialization?.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(coach => coach.account_status === statusFilter);
        }

        setFilteredCoaches(filtered);
    };

    const clearFilters = () => {
        setSearchText('');
        setStatusFilter('all');
    };

    const loadCoaches = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/get-coaches`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            const data = await handleResponse(response);
            setCoaches(data.data || []);
            message.success('Coaches list loaded successfully!');
        } catch (error) {
            console.error('Error loading coaches:', error);
            message.error('Failed to load coaches list');
        } finally {
            setLoading(false);
        }
    };

    // Create coach account
    const handleCreateCoach = async (values) => {
        try {
            setLoading(true);

            // Format date for backend
            const coachData = {
                username: values.email.split('@')[0], // Generate username from email
                full_name: values.full_name,
                email: values.email,
                phone_number: values.phone_number || '',
                date_of_birth: values.date_of_birth?.format('YYYY-MM-DD') || '1990-01-01',
                password: values.password || '123456',
                google_meet_link: values.google_meet_link || ''
            };

            const response = await fetch(`${API_BASE_URL}/admin/create-coach`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(coachData)
            });
            await handleResponse(response);

            // Set credentials for modal
            setNewCoachCredentials({
                name: values.full_name,
                email: values.email,
                password: coachData.password
            });

            setCreateCoachModal(false);
            setCredentialsModal(true);
            coachForm.resetFields();

            // Reload coaches list
            await loadCoaches();

            message.success('Coach account created successfully!');
        } catch (error) {
            console.error('Error creating coach:', error);
            message.error(error.message || 'Failed to create coach account');
        } finally {
            setLoading(false);
        }
    };

    // Edit coach
    const handleEditCoach = (coach) => {
        setSelectedCoach(coach);
        editForm.setFieldsValue({
            full_name: coach.full_name,
            email: coach.email,
            phone_number: coach.phone_number,
            account_status: coach.account_status,
            specialization: coach.specialization,
            bio: coach.bio,
            experience_years: coach.experience_years,
            google_meet_link: coach.google_meet_link,
            coach_status: coach.coach_status
        });
        setEditCoachModal(true);
    };

    // Update coach
    const handleUpdateCoach = async (values) => {
        try {
            setLoading(true);

            const updateData = {
                full_name: values.full_name,
                phone_number: values.phone_number,
                account_status: values.account_status,
                specialization: values.specialization,
                bio: values.bio,
                experience_years: values.experience_years,
                google_meet_link: values.google_meet_link,
                coach_status: values.coach_status
            };

            const response = await fetch(`${API_BASE_URL}/admin/update-coach/${selectedCoach.coach_id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(updateData)
            });
            await handleResponse(response);

            message.success('Coach updated successfully!');
            setEditCoachModal(false);
            setSelectedCoach(null);
            editForm.resetFields();

            // Reload coaches list
            await loadCoaches();
        } catch (error) {
            console.error('Error updating coach:', error);
            message.error(error.message || 'Failed to update coach');
        } finally {
            setLoading(false);
        }
    };

    // Delete coach (deactivate)
    const handleDeleteCoach = async (coachId) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/admin/delete-coach/${coachId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            await handleResponse(response);
            message.success('Coach deactivated successfully!');
            await loadCoaches();
        } catch (error) {
            console.error('Error deleting coach:', error);
            message.error(error.message || 'Failed to deactivate coach');
        } finally {
            setLoading(false);
        }
    };

    // Restore coach
    const handleRestoreCoach = async (coachId) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/admin/restore-coach/${coachId}`, {
                method: 'PUT',
                headers: getAuthHeaders()
            });
            await handleResponse(response);
            message.success('Coach restored successfully!');
            await loadCoaches();
        } catch (error) {
            console.error('Error restoring coach:', error);
            message.error(error.message || 'Failed to restore coach');
        } finally {
            setLoading(false);
        }
    };

    // View coach details
    const handleViewCoach = (coach) => {
        setSelectedCoach(coach);
        setViewCoachModal(true);
    };

    const handleCopy = async (text, field) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            message.success('Copied to clipboard!');
            setTimeout(() => setCopiedField(''), 2000);
        } catch (error) {
            message.error('Failed to copy');
        }
    };

    const handleCopyAll = async () => {
        const credentialsText = `Name: ${newCoachCredentials.name}\nEmail: ${newCoachCredentials.email}\nPassword: ${newCoachCredentials.password}`;
        try {
            await navigator.clipboard.writeText(credentialsText);
            message.success('All credentials copied to clipboard!');
        } catch (error) {
            message.error('Failed to copy credentials');
        }
    };

    // Calculate statistics based on filtered coaches
    const stats = {
        totalCoaches: filteredCoaches.length,
        activeCoaches: filteredCoaches.filter(coach => coach.account_status === 'active').length,
        inactiveCoaches: filteredCoaches.filter(coach => coach.account_status === 'inactive').length,
        totalUsers: filteredCoaches.length, // For compatibility with existing UI
    };

    // Table columns
    const columns = [
        {
            title: 'Coach',
            key: 'coach',
            render: (_, record) => (
                <Space>
                    <Avatar
                        size="large"
                        style={{ backgroundColor: '#52c41a' }}
                    >
                        {record.full_name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{record.full_name}</div>
                        <Text type="secondary">{record.email}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Specialization',
            key: 'specialization',
            render: (_, record) => (
                <Text>{record.specialization || 'Not updated'}</Text>
            ),
        },
        {
            title: 'Experience',
            key: 'experience',
            render: (_, record) => (
                <Text>{record.experience_years ? `${record.experience_years} years` : 'Not updated'}</Text>
            ),
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, record) => {
                const color = record.account_status === 'active' ? 'green' : 'orange';
                return (
                    <Tag color={color} style={{ textTransform: 'capitalize' }}>
                        {record.account_status === 'active' ? 'Active' : 'Inactive'}
                    </Tag>
                );
            },
        },
        {
            title: 'Registration Date',
            key: 'registration',
            render: (_, record) => (
                <Text>{record.registration_date ? new Date(record.registration_date).toLocaleDateString() : 'N/A'}</Text>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Tooltip title="View Details">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewCoach(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEditCoach(record)}
                        />
                    </Tooltip>
                    {record.account_status === 'active' ? (
                        <Popconfirm
                            title="Deactivate Coach"
                            description="Are you sure you want to deactivate this coach?"
                            onConfirm={() => handleDeleteCoach(record.coach_id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Tooltip title="Deactivate">
                                <Button
                                    type="text"
                                    icon={<DeleteOutlined />}
                                    danger
                                />
                            </Tooltip>
                        </Popconfirm>
                    ) : (
                        <Popconfirm
                            title="Restore Coach"
                            description="Are you sure you want to restore this coach?"
                            onConfirm={() => handleRestoreCoach(record.coach_id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Tooltip title="Restore">
                                <Button
                                    type="text"
                                    icon={<UndoOutlined />}
                                    style={{ color: '#52c41a' }}
                                />
                            </Tooltip>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <Layout className="admin-dashboard">
            <Header style={{ padding: 0, height: 'auto' }}>
                <Navbar />
            </Header>
            <Content style={{ padding: '24px', minHeight: 'calc(100vh - 64px)' }}>
                {/* Header */}
                <div style={{ marginBottom: '24px' }}>
                    <Title level={2} style={{ margin: 0, color: '#52c41a' }}>
                        Coach Management
                    </Title>
                    <Text type="secondary">
                        Create and manage coach accounts
                    </Text>
                </div>

                {/* Statistics */}
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                    <Col xs={24} sm={12} lg={6}>
                        <StatisticCard
                            title="Total Coaches"
                            value={stats.totalCoaches}
                            prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatisticCard
                            title="Active Coaches"
                            value={stats.activeCoaches}
                            prefix={<UserOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatisticCard
                            title="Inactive Coaches"
                            value={stats.inactiveCoaches}
                            prefix={<UserAddOutlined style={{ color: '#faad14' }} />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatisticCard
                            title="Total Users"
                            value={stats.totalUsers}
                            prefix={<SafetyCertificateOutlined style={{ color: '#ff4d4f' }} />}
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Col>
                </Row>

                {/* Search and Filter Controls */}
                <div className="filter-controls" style={{ marginBottom: '16px' }}>
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} sm={12} md={8}>
                            <Search
                                placeholder="Search by name, email, phone or specialization"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                allowClear
                                style={{ width: '100%' }}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={4}>
                            <Select
                                placeholder="Filter by status"
                                value={statusFilter}
                                onChange={setStatusFilter}
                                style={{ width: '100%' }}
                                allowClear
                            >
                                <Option value="all">All Status</Option>
                                <Option value="active">Active</Option>
                                <Option value="inactive">Inactive</Option>
                            </Select>
                        </Col>
                        <Col xs={24} sm={12} md={4}>
                            <Button
                                icon={<FilterOutlined />}
                                onClick={clearFilters}
                                className="clear-filters-btn"
                                style={{ width: '100%' }}
                            >
                                Clear Filters
                            </Button>
                        </Col>
                        <Col xs={24} sm={12} md={4}>
                            <div className="results-counter">
                                Showing {filteredCoaches.length} of {coaches.length} coaches
                            </div>
                        </Col>
                    </Row>
                </div>

                <DataTable
                    title="Coaches List"
                    columns={columns}
                    dataSource={filteredCoaches}
                    loading={loading}
                    rowKey="coach_id"
                    extra={
                        <Space>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={loadCoaches}
                                loading={loading}
                            >
                                Refresh
                            </Button>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setCreateCoachModal(true)}
                                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                            >
                                Create Coach
                            </Button>
                        </Space>
                    }
                />
            </Content>

            {/* Create Coach Modal */}
            <FormModal
                title="Create Coach Account"
                visible={createCoachModal}
                onCancel={() => setCreateCoachModal(false)}
                onSubmit={handleCreateCoach}
                form={coachForm}
                loading={loading}
                width={700}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="full_name"
                            label="Full Name"
                            rules={[{ required: true, message: 'Please enter the full name!' }]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="Enter full name" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[
                                { required: true, message: 'Please enter the email!' },
                                { type: 'email', message: 'Please enter a valid email!' }
                            ]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="Enter email address" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="phone_number"
                            label="Phone Number"
                        >
                            <Input placeholder="Enter phone number" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="date_of_birth"
                            label="Date of Birth"
                        >
                            <DatePicker style={{ width: '100%' }} placeholder="Select date of birth" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[{ required: true, message: 'Please enter the password!' }]}
                        >
                            <Input.Password placeholder="Enter password" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="google_meet_link"
                            label="Google Meet Link"
                        >
                            <Input placeholder="Enter Google Meet link" />
                        </Form.Item>
                    </Col>
                </Row>

                <div style={{
                    background: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '16px'
                }}>
                    <Text style={{ color: '#52c41a', fontWeight: '500' }}>
                        📝 Note: Coach will receive login credentials after successful account creation
                    </Text>
                </div>
            </FormModal>

            {/* Edit Coach Modal */}
            <FormModal
                title="Edit Coach Information"
                visible={editCoachModal}
                onCancel={() => setEditCoachModal(false)}
                onSubmit={handleUpdateCoach}
                form={editForm}
                loading={loading}
                width={700}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="full_name"
                            label="Full Name"
                            rules={[{ required: true, message: 'Please enter the full name!' }]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="Enter full name" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[
                                { required: true, message: 'Please enter the email!' },
                                { type: 'email', message: 'Please enter a valid email!' }
                            ]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="Enter email address" disabled />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="phone_number"
                            label="Phone Number"
                        >
                            <Input placeholder="Enter phone number" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="account_status"
                            label="Account Status"
                            rules={[{ required: true, message: 'Please select a status!' }]}
                        >
                            <Select placeholder="Select status">
                                <Option value="active">Active</Option>
                                <Option value="inactive">Inactive</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="specialization"
                            label="Specialization"
                        >
                            <Input placeholder="Enter specialization" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="experience_years"
                            label="Years of Experience"
                        >
                            <Input type="number" placeholder="Enter years of experience" />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    name="bio"
                    label="Bio"
                >
                    <TextArea rows={3} placeholder="Enter bio" />
                </Form.Item>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="google_meet_link"
                            label="Google Meet Link"
                        >
                            <Input placeholder="Enter Google Meet link" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="coach_status"
                            label="Coach Status"
                        >
                            <Select placeholder="Select status">
                                <Option value="active">Active</Option>
                                <Option value="inactive">Inactive</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
            </FormModal>

            {/* View Coach Modal */}
            <Modal
                title="Coach Details"
                open={viewCoachModal}
                onCancel={() => {
                    setViewCoachModal(false);
                    setSelectedCoach(null);
                }}
                footer={[
                    <Button
                        key="close"
                        onClick={() => {
                            setViewCoachModal(false);
                            setSelectedCoach(null);
                        }}
                    >
                        Close
                    </Button>
                ]}
                width={600}
            >
                {selectedCoach && (
                    <div>
                        <Row gutter={[16, 16]}>
                            <Col span={24}>
                                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                    <Avatar
                                        size={80}
                                        style={{ backgroundColor: '#52c41a' }}
                                    >
                                        {selectedCoach.full_name?.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Title level={3} style={{ marginTop: '10px' }}>
                                        {selectedCoach.full_name}
                                    </Title>
                                </div>
                            </Col>
                        </Row>

                        <Divider />

                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Text strong>Email:</Text>
                                <br />
                                <Text>{selectedCoach.email}</Text>
                            </Col>
                            <Col span={12}>
                                <Text strong>Phone Number:</Text>
                                <br />
                                <Text>{selectedCoach.phone_number || 'N/A'}</Text>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                            <Col span={12}>
                                <Text strong>Specialization:</Text>
                                <br />
                                <Text>{selectedCoach.specialization || 'Not updated'}</Text>
                            </Col>
                            <Col span={12}>
                                <Text strong>Experience:</Text>
                                <br />
                                <Text>{selectedCoach.experience_years ? `${selectedCoach.experience_years} years` : 'Not updated'}</Text>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                            <Col span={12}>
                                <Text strong>Account Status:</Text>
                                <br />
                                <Tag
                                    color={selectedCoach.account_status === 'active' ? 'green' : 'orange'}
                                    style={{ textTransform: 'capitalize' }}
                                >
                                    {selectedCoach.account_status === 'active' ? 'Active' : 'Inactive'}
                                </Tag>
                            </Col>
                            <Col span={12}>
                                <Text strong>Coach Status:</Text>
                                <br />
                                <Tag
                                    color={selectedCoach.coach_status === 'active' ? 'green' : 'orange'}
                                    style={{ textTransform: 'capitalize' }}
                                >
                                    {selectedCoach.coach_status === 'active' ? 'Active' : 'Inactive'}
                                </Tag>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                            <Col span={12}>
                                <Text strong>Registration Date:</Text>
                                <br />
                                <Text>{selectedCoach.registration_date ? new Date(selectedCoach.registration_date).toLocaleDateString() : 'N/A'}</Text>
                            </Col>
                            <Col span={12}>
                                <Text strong>Google Meet Link:</Text>
                                <br />
                                <Text>{selectedCoach.google_meet_link || 'Not updated'}</Text>
                            </Col>
                        </Row>

                        {selectedCoach.bio && (
                            <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                                <Col span={24}>
                                    <Text strong>Bio:</Text>
                                    <br />
                                    <Text>{selectedCoach.bio}</Text>
                                </Col>
                            </Row>
                        )}
                    </div>
                )}
            </Modal>

            {/* Credentials Modal */}
            <Modal
                title={
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎉</div>
                        <div>Coach Account Created Successfully!</div>
                    </div>
                }
                open={credentialsModal}
                onCancel={() => {
                    setCredentialsModal(false);
                    setNewCoachCredentials(null);
                    setCopiedField('');
                }}
                footer={[
                    <Button
                        key="copyAll"
                        type="primary"
                        icon={<CopyOutlined />}
                        onClick={handleCopyAll}
                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                    >
                        Copy All Credentials
                    </Button>,
                    <Button
                        key="close"
                        onClick={() => {
                            setCredentialsModal(false);
                            setNewCoachCredentials(null);
                            setCopiedField('');
                        }}
                    >
                        Close
                    </Button>
                ]}
                width={500}
                centered
            >
                {newCoachCredentials && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            background: '#f6ffed',
                            border: '1px solid #b7eb8f',
                            borderRadius: '8px',
                            padding: '20px',
                            marginBottom: '20px'
                        }}>
                            <Title level={4} style={{ color: '#52c41a', marginBottom: '16px' }}>
                                📋 Account Credentials
                            </Title>

                            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                                {/* Name */}
                                <div style={{
                                    background: 'white',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    border: '1px solid #d9d9d9',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ textAlign: 'left' }}>
                                        <Text strong>Name:</Text>
                                        <br />
                                        <Text>{newCoachCredentials.name}</Text>
                                    </div>
                                    <Button
                                        type="text"
                                        icon={copiedField === 'name' ? <CheckOutlined /> : <CopyOutlined />}
                                        onClick={() => handleCopy(newCoachCredentials.name, 'name')}
                                        style={{ color: copiedField === 'name' ? '#52c41a' : '#666' }}
                                    />
                                </div>

                                {/* Email */}
                                <div style={{
                                    background: 'white',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    border: '1px solid #d9d9d9',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ textAlign: 'left' }}>
                                        <Text strong>Email:</Text>
                                        <br />
                                        <Text>{newCoachCredentials.email}</Text>
                                    </div>
                                    <Button
                                        type="text"
                                        icon={copiedField === 'email' ? <CheckOutlined /> : <CopyOutlined />}
                                        onClick={() => handleCopy(newCoachCredentials.email, 'email')}
                                        style={{ color: copiedField === 'email' ? '#52c41a' : '#666' }}
                                    />
                                </div>

                                {/* Password */}
                                <div style={{
                                    background: 'white',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    border: '1px solid #d9d9d9',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ textAlign: 'left' }}>
                                        <Text strong>Password:</Text>
                                        <br />
                                        <Text code style={{ fontSize: '16px' }}>{newCoachCredentials.password}</Text>
                                    </div>
                                    <Button
                                        type="text"
                                        icon={copiedField === 'password' ? <CheckOutlined /> : <CopyOutlined />}
                                        onClick={() => handleCopy(newCoachCredentials.password, 'password')}
                                        style={{ color: copiedField === 'password' ? '#52c41a' : '#666' }}
                                    />
                                </div>
                            </Space>
                        </div>

                        <div style={{
                            background: '#fff7e6',
                            border: '1px solid #ffd591',
                            borderRadius: '6px',
                            padding: '12px'
                        }}>
                            <Text style={{ color: '#d48806' }}>
                                ⚠️ Please save these credentials securely. The coach will need them to log in.
                            </Text>
                        </div>
                    </div>
                )}
            </Modal>
        </Layout>
    );
};

export default AdminDashboard; 
