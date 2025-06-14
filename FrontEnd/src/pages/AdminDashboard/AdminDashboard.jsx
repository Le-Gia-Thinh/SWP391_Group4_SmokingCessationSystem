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
    Divider
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
    EyeOutlined
} from '@ant-design/icons';
import Navbar from '../../layouts/Navbar';
import './AdminDashboard.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const AdminDashboard = () => {
    // State management
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [createCoachModal, setCreateCoachModal] = useState(false);
    const [editUserModal, setEditUserModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [viewUserModal, setViewUserModal] = useState(false);

    // Form instances
    const [coachForm] = Form.useForm();
    const [editForm] = Form.useForm();

    // Mock data for demonstration
    const mockUsers = [
        {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            role: 'member',
            status: 'active',
            registrationDate: '2024-01-15',
            specialization: null,
            experienceYears: null
        },
        {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '+1234567891',
            role: 'coach',
            status: 'active',
            registrationDate: '2024-01-20',
            specialization: 'Smoking Cessation',
            experienceYears: 5
        },
        {
            id: 3,
            name: 'Admin User',
            email: 'admin@example.com',
            phone: '+1234567892',
            role: 'admin',
            status: 'active',
            registrationDate: '2024-01-10',
            specialization: null,
            experienceYears: null
        }
    ];

    // Load users on component mount
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setUsers(mockUsers);
        } catch (error) {
            message.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    // Create coach account
    const handleCreateCoach = async (values) => {
        try {
            setLoading(true);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            const newCoach = {
                id: users.length + 1,
                name: values.name,
                email: values.email,
                phone: values.phone || '',
                role: 'coach',
                status: 'active',
                registrationDate: new Date().toISOString().split('T')[0],
                specialization: values.specialization,
                experienceYears: values.experienceYears
            };

            setUsers(prev => [...prev, newCoach]);
            message.success('Coach account created successfully!');
            setCreateCoachModal(false);
            coachForm.resetFields();
        } catch (error) {
            message.error('Failed to create coach account');
        } finally {
            setLoading(false);
        }
    };

    // Edit user
    const handleEditUser = (user) => {
        setSelectedUser(user);
        editForm.setFieldsValue({
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
            specialization: user.specialization,
            experienceYears: user.experienceYears
        });
        setEditUserModal(true);
    };

    // Update user
    const handleUpdateUser = async (values) => {
        try {
            setLoading(true);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            setUsers(prev => prev.map(user =>
                user.id === selectedUser.id
                    ? { ...user, ...values }
                    : user
            ));

            message.success('User updated successfully!');
            setEditUserModal(false);
            setSelectedUser(null);
            editForm.resetFields();
        } catch (error) {
            message.error('Failed to update user');
        } finally {
            setLoading(false);
        }
    };

    // Delete user
    const handleDeleteUser = async (userId) => {
        try {
            setLoading(true);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            setUsers(prev => prev.filter(user => user.id !== userId));
            message.success('User deleted successfully!');
        } catch (error) {
            message.error('Failed to delete user');
        } finally {
            setLoading(false);
        }
    };

    // View user details
    const handleViewUser = (user) => {
        setSelectedUser(user);
        setViewUserModal(true);
    };

    // Calculate statistics
    const stats = {
        totalUsers: users.length,
        activeCoaches: users.filter(u => u.role === 'coach' && u.status === 'active').length,
        totalCoaches: users.filter(u => u.role === 'coach').length,
        activeUsers: users.filter(u => u.status === 'active').length
    };

    // Table columns
    const columns = [
        {
            title: 'User',
            key: 'user',
            render: (_, record) => (
                <Space>
                    <Avatar
                        size="large"
                        style={{
                            backgroundColor: record.role === 'admin' ? '#ff4d4f' :
                                record.role === 'coach' ? '#52c41a' : '#1890ff'
                        }}
                    >
                        {record.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{record.name}</div>
                        <Text type="secondary">{record.email}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Role',
            key: 'role',
            render: (_, record) => {
                const color = record.role === 'admin' ? 'red' :
                    record.role === 'coach' ? 'green' : 'blue';
                return (
                    <Tag color={color} style={{ textTransform: 'capitalize' }}>
                        {record.role}
                    </Tag>
                );
            },
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, record) => {
                const color = record.status === 'active' ? 'green' :
                    record.status === 'inactive' ? 'orange' : 'red';
                return (
                    <Tag color={color} style={{ textTransform: 'capitalize' }}>
                        {record.status}
                    </Tag>
                );
            },
        },
        {
            title: 'Registration',
            key: 'registration',
            render: (_, record) => (
                <Text>{new Date(record.registrationDate).toLocaleDateString()}</Text>
            ),
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
                            onClick={() => handleViewUser(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Edit User">
                        <Button
                            type="default"
                            icon={<EditOutlined />}
                            size="small"
                            onClick={() => handleEditUser(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Are you sure you want to delete this user?"
                        description="This action cannot be undone."
                        onConfirm={() => handleDeleteUser(record.id)}
                        okText="Yes"
                        cancelText="No"
                        okType="danger"
                    >
                        <Tooltip title="Delete User">
                            <Button
                                type="primary"
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                            />
                        </Tooltip>
                    </Popconfirm>
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
                        Admin Dashboard
                    </Title>
                    <Text type="secondary">
                        Manage users and create coach accounts
                    </Text>
                </div>

                {/* Statistics */}
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Total Users"
                                value={stats.totalUsers}
                                prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Active Coaches"
                                value={stats.activeCoaches}
                                prefix={<UserOutlined style={{ color: '#52c41a' }} />}
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Total Coaches"
                                value={stats.totalCoaches}
                                prefix={<UserAddOutlined style={{ color: '#faad14' }} />}
                                valueStyle={{ color: '#faad14' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Active Users"
                                value={stats.activeUsers}
                                prefix={<SafetyCertificateOutlined style={{ color: '#ff4d4f' }} />}
                                valueStyle={{ color: '#ff4d4f' }}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Actions */}
                <Card
                    title="User Management"
                    extra={
                        <Space>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={loadUsers}
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
                >
                    <Table
                        columns={columns}
                        dataSource={users}
                        loading={loading}
                        rowKey="id"
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
                        }}
                    />
                </Card>
            </Content>

            {/* Create Coach Modal */}
            <Modal
                title="Create Coach Account"
                open={createCoachModal}
                onCancel={() => setCreateCoachModal(false)}
                footer={null}
                width={600}
            >
                <Form
                    form={coachForm}
                    layout="vertical"
                    onFinish={handleCreateCoach}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="name"
                                label="Full Name"
                                rules={[{ required: true, message: 'Please enter the name!' }]}
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
                                name="phone"
                                label="Phone Number"
                            >
                                <Input placeholder="Enter phone number" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="experienceYears"
                                label="Experience (Years)"
                                rules={[{ required: true, message: 'Please enter experience years!' }]}
                            >
                                <Input type="number" placeholder="Enter years of experience" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="specialization"
                        label="Specialization"
                        rules={[{ required: true, message: 'Please enter specialization!' }]}
                    >
                        <Input placeholder="Enter specialization area" />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button onClick={() => setCreateCoachModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                            >
                                Create Coach
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Edit User Modal */}
            <Modal
                title="Edit User"
                open={editUserModal}
                onCancel={() => {
                    setEditUserModal(false);
                    setSelectedUser(null);
                    editForm.resetFields();
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    onFinish={handleUpdateUser}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="name"
                                label="Full Name"
                                rules={[{ required: true, message: 'Please enter the name!' }]}
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
                                name="phone"
                                label="Phone Number"
                            >
                                <Input placeholder="Enter phone number" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="role"
                                label="Role"
                                rules={[{ required: true, message: 'Please select a role!' }]}
                            >
                                <Select placeholder="Select role">
                                    <Option value="member">Member</Option>
                                    <Option value="coach">Coach</Option>
                                    <Option value="admin">Admin</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="status"
                                label="Status"
                                rules={[{ required: true, message: 'Please select a status!' }]}
                            >
                                <Select placeholder="Select status">
                                    <Option value="active">Active</Option>
                                    <Option value="inactive">Inactive</Option>
                                    <Option value="suspended">Suspended</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="experienceYears"
                                label="Experience (Years)"
                            >
                                <Input type="number" placeholder="Enter years of experience" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="specialization"
                        label="Specialization"
                    >
                        <Input placeholder="Enter specialization area" />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button onClick={() => {
                                setEditUserModal(false);
                                setSelectedUser(null);
                                editForm.resetFields();
                            }}>
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                            >
                                Update User
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* View User Modal */}
            <Modal
                title="User Details"
                open={viewUserModal}
                onCancel={() => {
                    setViewUserModal(false);
                    setSelectedUser(null);
                }}
                footer={[
                    <Button
                        key="close"
                        onClick={() => {
                            setViewUserModal(false);
                            setSelectedUser(null);
                        }}
                    >
                        Close
                    </Button>
                ]}
                width={500}
            >
                {selectedUser && (
                    <div>
                        <Row gutter={[16, 16]}>
                            <Col span={24}>
                                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                    <Avatar
                                        size={80}
                                        style={{
                                            backgroundColor: selectedUser.role === 'admin' ? '#ff4d4f' :
                                                selectedUser.role === 'coach' ? '#52c41a' : '#1890ff'
                                        }}
                                    >
                                        {selectedUser.name.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Title level={3} style={{ marginTop: '10px' }}>
                                        {selectedUser.name}
                                    </Title>
                                </div>
                            </Col>
                        </Row>

                        <Divider />

                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Text strong>Email:</Text>
                                <br />
                                <Text>{selectedUser.email}</Text>
                            </Col>
                            <Col span={12}>
                                <Text strong>Phone:</Text>
                                <br />
                                <Text>{selectedUser.phone || 'N/A'}</Text>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                            <Col span={12}>
                                <Text strong>Role:</Text>
                                <br />
                                <Tag
                                    color={selectedUser.role === 'admin' ? 'red' :
                                        selectedUser.role === 'coach' ? 'green' : 'blue'}
                                    style={{ textTransform: 'capitalize' }}
                                >
                                    {selectedUser.role}
                                </Tag>
                            </Col>
                            <Col span={12}>
                                <Text strong>Status:</Text>
                                <br />
                                <Tag
                                    color={selectedUser.status === 'active' ? 'green' :
                                        selectedUser.status === 'inactive' ? 'orange' : 'red'}
                                    style={{ textTransform: 'capitalize' }}
                                >
                                    {selectedUser.status}
                                </Tag>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                            <Col span={12}>
                                <Text strong>Registration Date:</Text>
                                <br />
                                <Text>{new Date(selectedUser.registrationDate).toLocaleDateString()}</Text>
                            </Col>
                            {selectedUser.role === 'coach' && (
                                <Col span={12}>
                                    <Text strong>Experience:</Text>
                                    <br />
                                    <Text>{selectedUser.experienceYears} years</Text>
                                </Col>
                            )}
                        </Row>

                        {selectedUser.role === 'coach' && selectedUser.specialization && (
                            <Row style={{ marginTop: '16px' }}>
                                <Col span={24}>
                                    <Text strong>Specialization:</Text>
                                    <br />
                                    <Text>{selectedUser.specialization}</Text>
                                </Col>
                            </Row>
                        )}
                    </div>
                )}
            </Modal>
        </Layout>
    );
};

export default AdminDashboard; 
