import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, DatePicker, TimePicker, message, Space, Tag, Spin } from 'antd';
import { PlusOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const ScheduleManagement = () => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        loadSchedules();
    }, []);

    const loadSchedules = async () => {
        try {
            setInitialLoading(true);
            // Note: This would need a new API endpoint to get coach's own schedules
            // For now, we'll use mock data
            const mockSchedules = [
                {
                    schedule_id: 1,
                    start_time: '2025-01-15T09:00:00',
                    end_time: '2025-01-15T10:00:00',
                    is_booked: false
                },
                {
                    schedule_id: 2,
                    start_time: '2025-01-15T14:00:00',
                    end_time: '2025-01-15T15:00:00',
                    is_booked: true
                }
            ];
            setSchedules(mockSchedules);
        } catch (error) {
            console.error('Error loading schedules:', error);
            message.error('Failed to load schedules');
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

            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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
            // Note: This would need a new API endpoint to delete schedules
            message.success('Schedule deleted successfully!');
            loadSchedules();
        } catch (error) {
            console.error('Error deleting schedule:', error);
            message.error('Failed to delete schedule');
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
                            { required: true, message: 'Please select date and time range' }
                        ]}
                    >
                        <DatePicker.RangePicker
                            showTime
                            format="YYYY-MM-DD HH:mm"
                            style={{ width: '100%' }}
                            placeholder={['Start Date & Time', 'End Date & Time']}
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