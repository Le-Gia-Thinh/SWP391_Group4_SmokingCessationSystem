import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, DatePicker, TimePicker, message, Space, Tag, Spin, Row, Col, Statistic } from 'antd';
import { PlusOutlined, DeleteOutlined, ReloadOutlined, CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const ScheduleManagement = () => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [initialLoading, setInitialLoading] = useState(true);

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
        loadSchedules();
    }, []);

    const loadSchedules = async () => {
        try {
            setInitialLoading(true);
            const response = await fetch(`${API_BASE_URL}/appointment/coach-schedules`, {
                headers: getAuthHeaders()
            });

            const data = await response.json(); // Parse response once

            if (!response.ok) {
                throw new Error(data.message || 'Failed to load schedules');
            }

            console.log('Loaded schedules data:', data);
            // Ensure data is an array
            setSchedules(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading schedules:', error);
            message.error(error.message || 'Failed to load schedules');
            setSchedules([]);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleCreateSchedule = async (values) => {
        try {
            setLoading(true);
            const scheduleData = {
                start_time: values.dateTime[0].format('YYYY-MM-DD HH:mm:ss'),
                end_time: values.dateTime[1].format('YYYY-MM-DD HH:mm:ss')
            };

            const response = await fetch(`${API_BASE_URL}/schedule`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(scheduleData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create schedule');
            }

            message.success('Schedule created successfully!');
            setIsModalVisible(false);
            form.resetFields();
            loadSchedules();
        } catch (error) {
            console.error('Error creating schedule:', error);
            message.error(error.message || 'Failed to create schedule');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
    };

    const formatDateTime = (dateTimeString) => {
        const date = dayjs(dateTimeString);
        return {
            date: date.format('YYYY-MM-DD'),
            time: date.format('HH:mm'),
            fullDateTime: date.format('YYYY-MM-DD HH:mm')
        };
    };

    const columns = [
        {
            title: 'Date',
            key: 'date',
            render: (_, record) => formatDateTime(record.start_time).date,
            sorter: (a, b) => new Date(a.start_time) - new Date(b.start_time),
        },
        {
            title: 'Start Time',
            key: 'start_time',
            render: (_, record) => formatDateTime(record.start_time).time,
        },
        {
            title: 'End Time',
            key: 'end_time',
            render: (_, record) => formatDateTime(record.end_time).time,
        },
        {
            title: 'Duration',
            key: 'duration',
            render: (_, record) => {
                const start = dayjs(record.start_time);
                const end = dayjs(record.end_time);
                const duration = end.diff(start, 'minute');
                return `${duration} minutes`;
            },
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, record) => (
                <Tag color={record.is_booked ? 'red' : 'green'}>
                    {record.is_booked ? 'Booked' : 'Available'}
                </Tag>
            ),
            filters: [
                { text: 'Available', value: 0 },
                { text: 'Booked', value: 1 },
            ],
            onFilter: (value, record) => record.is_booked === value,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    {!record.is_booked && (
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                            onClick={() => handleDeleteSchedule(record.schedule_id)}
                        >
                            Delete
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    const handleDeleteSchedule = async (scheduleId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/schedule/${scheduleId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete schedule');
            }

            message.success('Schedule deleted successfully!');
            loadSchedules(); // Reload the list
        } catch (error) {
            console.error('Error deleting schedule:', error);
            message.error(error.message || 'Failed to delete schedule');
        }
    };

    if (initialLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>Loading schedules...</div>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px 0' }}>
            {/* Quick Statistics */}
            <Card style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                    <Col span={8}>
                        <Statistic
                            title="Total Schedules"
                            value={schedules.length}
                            prefix={<CalendarOutlined />}
                        />
                    </Col>
                    <Col span={8}>
                        <Statistic
                            title="Available"
                            value={schedules.filter(s => !s.is_booked).length}
                            valueStyle={{ color: '#52c41a' }}
                            prefix={<CheckCircleOutlined />}
                        />
                    </Col>
                    <Col span={8}>
                        <Statistic
                            title="Booked"
                            value={schedules.filter(s => s.is_booked).length}
                            valueStyle={{ color: '#ff4d4f' }}
                            prefix={<ClockCircleOutlined />}
                        />
                    </Col>
                </Row>
            </Card>

            <Card
                title="Schedule Management"
                extra={
                    <Space>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={loadSchedules}
                            loading={loading}
                        >
                            Refresh
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setIsModalVisible(true)}
                        >
                            Create Schedule
                        </Button>
                    </Space>
                }
            >
                <Table
                    columns={columns}
                    dataSource={schedules}
                    rowKey="schedule_id"
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} schedules`,
                    }}
                    locale={{
                        emptyText: (
                            <div style={{ padding: '40px 0', textAlign: 'center' }}>
                                <CalendarOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                                <div style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>
                                    No schedules found
                                </div>
                                <div style={{ fontSize: 14, color: '#999' }}>
                                    Create your first schedule to start accepting bookings
                                </div>
                            </div>
                        )
                    }}
                />
            </Card>

            {/* Create Schedule Modal */}
            <Modal
                title="Create New Schedule"
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateSchedule}
                >
                    <Form.Item
                        name="dateTime"
                        label="Date and Time Range"
                        rules={[
                            { required: true, message: 'Please select date and time range' },
                            {
                                validator: (_, value) => {
                                    if (value && value[0] && value[1]) {
                                        const start = dayjs(value[0]);
                                        const end = dayjs(value[1]);
                                        const now = dayjs();

                                        if (start.isBefore(now)) {
                                            return Promise.reject('Start time cannot be in the past');
                                        }

                                        if (end.isBefore(start)) {
                                            return Promise.reject('End time must be after start time');
                                        }

                                        const duration = end.diff(start, 'minute');
                                        if (duration < 15) {
                                            return Promise.reject('Minimum duration is 15 minutes');
                                        }

                                        if (duration > 480) { // 8 hours
                                            return Promise.reject('Maximum duration is 8 hours');
                                        }
                                    }
                                    return Promise.resolve();
                                }
                            }
                        ]}
                    >
                        <DatePicker.RangePicker
                            showTime
                            format="YYYY-MM-DD HH:mm"
                            style={{ width: '100%' }}
                            placeholder={['Start Date & Time', 'End Date & Time']}
                            disabledDate={(current) => current && current < dayjs().startOf('day')}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Create Schedule
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ScheduleManagement; 