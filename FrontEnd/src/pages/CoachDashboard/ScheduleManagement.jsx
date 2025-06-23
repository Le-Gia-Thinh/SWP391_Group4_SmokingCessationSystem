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
                throw new Error(data.message || 'Không thể tải lịch trình');
            }

            console.log('Loaded schedules data:', data);
            // Ensure data is an array
            setSchedules(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Lỗi tải lịch trình:', error);
            message.error(error.message || 'Không thể tải lịch trình');
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
                throw new Error(data.message || 'Không thể tạo lịch trình');
            }

            message.success('Tạo lịch trình thành công!');
            setIsModalVisible(false);
            form.resetFields();
            loadSchedules();
        } catch (error) {
            console.error('Lỗi tạo lịch trình:', error);
            message.error(error.message || 'Không thể tạo lịch trình');
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
            title: 'Ngày',
            key: 'date',
            render: (_, record) => formatDateTime(record.start_time).date,
            sorter: (a, b) => new Date(a.start_time) - new Date(b.start_time),
        },
        {
            title: 'Thời gian bắt đầu',
            key: 'start_time',
            render: (_, record) => formatDateTime(record.start_time).time,
        },
        {
            title: 'Thời gian kết thúc',
            key: 'end_time',
            render: (_, record) => formatDateTime(record.end_time).time,
        },
        {
            title: 'Thời lượng',
            key: 'duration',
            render: (_, record) => {
                const start = dayjs(record.start_time);
                const end = dayjs(record.end_time);
                const duration = end.diff(start, 'minute');
                return `${duration} phút`;
            },
        },
        {
            title: 'Trạng thái',
            key: 'status',
            render: (_, record) => (
                <Tag color={record.is_booked ? 'red' : 'green'}>
                    {record.is_booked ? 'Đã đặt' : 'Có sẵn'}
                </Tag>
            ),
            filters: [
                { text: 'Có sẵn', value: 0 },
                { text: 'Đã đặt', value: 1 },
            ],
            onFilter: (value, record) => record.is_booked === value,
        },
        {
            title: 'Hành động',
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
                            Xóa
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
                throw new Error(data.message || 'Không thể xóa lịch trình');
            }

            message.success('Xóa lịch trình thành công!');
            loadSchedules(); // Reload the list
        } catch (error) {
            console.error('Lỗi xóa lịch trình:', error);
            message.error(error.message || 'Không thể xóa lịch trình');
        }
    };

    if (initialLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>Đang tải lịch trình...</div>
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
                            title="Tổng số lịch trình"
                            value={schedules.length}
                            prefix={<CalendarOutlined />}
                        />
                    </Col>
                    <Col span={8}>
                        <Statistic
                            title="Có sẵn"
                            value={schedules.filter(s => !s.is_booked).length}
                            valueStyle={{ color: '#52c41a' }}
                            prefix={<CheckCircleOutlined />}
                        />
                    </Col>
                    <Col span={8}>
                        <Statistic
                            title="Đã đặt"
                            value={schedules.filter(s => s.is_booked).length}
                            valueStyle={{ color: '#ff4d4f' }}
                            prefix={<ClockCircleOutlined />}
                        />
                    </Col>
                </Row>
            </Card>

            <Card
                title="Quản lý lịch trình"
                extra={
                    <Space>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={loadSchedules}
                            loading={loading}
                        >
                            Làm mới
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setIsModalVisible(true)}
                        >
                            Tạo lịch trình
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
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} lịch trình`,
                    }}
                    locale={{
                        emptyText: (
                            <div style={{ padding: '40px 0', textAlign: 'center' }}>
                                <CalendarOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                                <div style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>
                                    Không tìm thấy lịch trình nào
                                </div>
                                <div style={{ fontSize: 14, color: '#999' }}>
                                    Tạo lịch trình đầu tiên của bạn để bắt đầu nhận đặt lịch
                                </div>
                            </div>
                        )
                    }}
                />
            </Card>

            {/* Create Schedule Modal */}
            <Modal
                title="Tạo lịch trình mới"
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
                        label="Phạm vi ngày và giờ"
                        rules={[
                            { required: true, message: 'Vui lòng chọn phạm vi ngày và giờ' },
                            {
                                validator: (_, value) => {
                                    if (value && value[0] && value[1]) {
                                        const start = dayjs(value[0]);
                                        const end = dayjs(value[1]);
                                        const now = dayjs();

                                        if (start.isBefore(now)) {
                                            return Promise.reject('Thời gian bắt đầu không thể ở trong quá khứ');
                                        }

                                        if (end.isBefore(start)) {
                                            return Promise.reject('Thời gian kết thúc phải sau thời gian bắt đầu');
                                        }

                                        const duration = end.diff(start, 'minute');
                                        if (duration < 15) {
                                            return Promise.reject('Thời lượng tối thiểu là 15 phút');
                                        }

                                        if (duration > 480) { // 8 hours
                                            return Promise.reject('Thời lượng tối đa là 8 giờ');
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
                            placeholder={['Ngày & giờ bắt đầu', 'Ngày & giờ kết thúc']}
                            disabledDate={(current) => current && current < dayjs().startOf('day')}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button onClick={handleCancel}>
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Tạo lịch trình
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ScheduleManagement; 