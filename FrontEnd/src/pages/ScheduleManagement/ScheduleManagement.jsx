import React, { useState, useEffect } from 'react';
import {
    Card,
    Button,
    Table,
    Modal,
    Form,
    Input,
    Select,
    DatePicker,
    TimePicker,
    message,
    Space,
    Tag,
    Spin,
    Row,
    Col,
    Typography,
    Checkbox,
    Alert,
    Statistic,
    Avatar,
    Divider
} from 'antd';
import {
    PlusOutlined,
    ReloadOutlined,
    UserOutlined,
    TeamOutlined,
    ScheduleOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import Navbar from '../../layouts/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import './ScheduleManagement.css';
import dayjs from 'dayjs';
import CoachScheduleModal from './CoachScheduleModal';

const { Option } = Select;
const { Title, Text } = Typography;

const ScheduleManagement = () => {
    const { user } = useAuth();
    const [coaches, setCoaches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scheduleModal, setScheduleModal] = useState(false);
    const [scheduleForm] = Form.useForm();
    const [scheduleLoading, setScheduleLoading] = useState(false);
    const [selectedCoaches, setSelectedCoaches] = useState([]);
    const [scheduleType, setScheduleType] = useState('single'); // 'single' or 'multiple'
    const [initialLoading, setInitialLoading] = useState(true);
    const [modalCoach, setModalCoach] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const token = localStorage.getItem('token');

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
            throw new Error(data.message || 'Có lỗi xảy ra');
        }
        return data;
    };

    useEffect(() => {
        loadCoaches();
    }, []);

    const loadCoaches = async () => {
        try {
            setInitialLoading(true);
            const response = await fetch(`${API_BASE_URL}/admin/get-coaches`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            const data = await handleResponse(response);
            setCoaches(data.data || []);
        } catch (error) {
            console.error('Error loading coaches:', error);
            message.error('Không thể tải danh sách huấn luyện viên');
        } finally {
            setInitialLoading(false);
        }
    };

    // Schedule Management Functions
    const handleCreateBulkSchedules = async (values) => {
        try {
            setScheduleLoading(true);

            let requestData = {};

            if (scheduleType === 'single') {
                // Single coach with pattern or specific schedules
                requestData = {
                    coach_id: values.coach_id,
                    pattern: values.usePattern ? {
                        startDate: values.dateRange[0].format('YYYY-MM-DD'),
                        endDate: values.dateRange[1].format('YYYY-MM-DD'),
                        startTime: values.timeRange[0].format('HH:mm') + ':00',
                        endTime: values.timeRange[1].format('HH:mm') + ':00',
                        daysOfWeek: values.daysOfWeek,
                        duration: values.duration
                    } : null,
                    schedules: values.usePattern ? null : (values.specificSchedules ? values.specificSchedules.split('\n').map(line => {
                        const [start, end] = line.split(',');
                        return {
                            start_time: start.trim(),
                            end_time: end.trim()
                        };
                    }) : null)
                };

                // DEBUG: Log dữ liệu gửi lên backend
                console.log("=== DEBUG TẠO LỊCH ===");
                console.log("Form values:", values);
                console.log("Request data (single):", JSON.stringify(requestData, null, 2));
                console.log("Time range raw:", values.timeRange);
                console.log("Start time format:", values.timeRange[0].format('HH:mm'));
                console.log("End time format:", values.timeRange[1].format('HH:mm'));
                console.log("========================");

                const response = await fetch(`${API_BASE_URL}/schedule/bulk`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(requestData)
                });

                const data = await handleResponse(response);
                message.success(`Đã tạo thành công ${data.createdCount} lịch cho coach`);
            } else {
                // Multiple coaches
                requestData = {
                    coachIds: selectedCoaches,
                    pattern: values.usePattern ? {
                        startDate: values.dateRange[0].format('YYYY-MM-DD'),
                        endDate: values.dateRange[1].format('YYYY-MM-DD'),
                        startTime: values.timeRange[0].format('HH:mm') + ':00',
                        endTime: values.timeRange[1].format('HH:mm') + ':00',
                        daysOfWeek: values.daysOfWeek,
                        duration: values.duration
                    } : null,
                    schedules: values.usePattern ? null : (values.specificSchedules ? values.specificSchedules.split('\n').map(line => {
                        const [start, end] = line.split(',');
                        return {
                            start_time: start.trim(),
                            end_time: end.trim()
                        };
                    }) : null)
                };

                // DEBUG: Log dữ liệu gửi lên backend
                console.log("=== DEBUG TẠO LỊCH (MULTIPLE) ===");
                console.log("Form values:", values);
                console.log("Request data (multiple):", JSON.stringify(requestData, null, 2));
                console.log("Time range raw:", values.timeRange);
                console.log("Start time format:", values.timeRange[0].format('HH:mm'));
                console.log("End time format:", values.timeRange[1].format('HH:mm'));
                console.log("================================");

                const response = await fetch(`${API_BASE_URL}/schedule/bulk-multiple`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(requestData)
                });

                const data = await handleResponse(response);
                message.success(`Đã tạo thành công ${data.totalCreated} lịch cho ${data.coachCount} coach`);
            }

            setScheduleModal(false);
            scheduleForm.resetFields();
            setSelectedCoaches([]);

        } catch (error) {
            console.error('Error creating bulk schedules:', error);
            message.error('Không thể tạo lịch hàng loạt');
        } finally {
            setScheduleLoading(false);
        }
    };

    const handleScheduleCancel = () => {
        setScheduleModal(false);
        scheduleForm.resetFields();
        setSelectedCoaches([]);
        setScheduleType('single');
    };

    const dayOptions = [
        { label: 'Chủ nhật', value: 0 },
        { label: 'Thứ 2', value: 1 },
        { label: 'Thứ 3', value: 2 },
        { label: 'Thứ 4', value: 3 },
        { label: 'Thứ 5', value: 4 },
        { label: 'Thứ 6', value: 5 },
        { label: 'Thứ 7', value: 6 }
    ];

    if (initialLoading) {
        return (
            <div>
                <Navbar />
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: '16px' }}>Đang tải dữ liệu...</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div style={{ padding: '24px' }}>
                <Title level={2}>
                    <ScheduleOutlined /> Quản lý Lịch làm việc
                </Title>

                <Card
                    title="Tổng quan lịch làm việc"
                    extra={
                        <Space>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={loadCoaches}
                                loading={loading}
                            >
                                Làm mới
                            </Button>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setScheduleModal(true)}
                            >
                                Tạo lịch hàng loạt
                            </Button>
                        </Space>
                    }
                >
                    <Row gutter={16} style={{ marginBottom: 24 }}>
                        <Col span={8}>
                            <Statistic
                                title="Tổng số Coach"
                                value={coaches.length}
                                prefix={<TeamOutlined />}
                            />
                        </Col>
                        <Col span={8}>
                            <Statistic
                                title="Coach có lịch"
                                value={coaches.filter(c => c.hasSchedules).length}
                                prefix={<CalendarOutlined />}
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Col>
                        <Col span={8}>
                            <Statistic
                                title="Coach chưa có lịch"
                                value={coaches.filter(c => !c.hasSchedules).length}
                                prefix={<ClockCircleOutlined />}
                                valueStyle={{ color: '#faad14' }}
                            />
                        </Col>
                    </Row>

                    <Alert
                        message="Hướng dẫn tạo lịch"
                        description="Admin có thể tạo lịch hàng loạt cho coach theo pattern (thời gian cố định) hoặc tạo lịch cụ thể. Lịch sẽ được tạo tự động và member có thể book ngay."
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />

                    <Table
                        columns={[
                            {
                                title: 'Coach',
                                key: 'name',
                                render: (_, record) => (
                                    <Space>
                                        <Avatar icon={<UserOutlined />} />
                                        <div>
                                            <div>{record.full_name}</div>
                                            <Text type="secondary">{record.email}</Text>
                                        </div>
                                    </Space>
                                )
                            },
                            {
                                title: 'Số điện thoại',
                                dataIndex: 'phone_number',
                                key: 'phone',
                                render: (phone) => phone || 'Chưa cập nhật'
                            },
                            {
                                title: 'Trạng thái lịch',
                                key: 'scheduleStatus',
                                render: (_, record) => (
                                    <Tag color={record.scheduleCount > 0 ? 'green' : 'orange'}>
                                        {record.scheduleCount > 0 ? 'Đã có lịch' : 'Chưa có lịch'}
                                    </Tag>
                                )
                            },
                            {
                                title: 'Hành động',
                                key: 'actions',
                                render: (_, record) => (
                                    <Space>
                                        <Button
                                            size="small"
                                            type="primary"
                                            onClick={() => {
                                                setScheduleType('single');
                                                scheduleForm.setFieldsValue({ coach_id: record.coach_id });
                                                setScheduleModal(true);
                                            }}
                                        >
                                            Tạo lịch
                                        </Button>
                                        <Button
                                            size="small"
                                            onClick={() => {
                                                setModalCoach(record);
                                                setModalOpen(true);
                                            }}
                                        >
                                            Xem lịch
                                        </Button>
                                    </Space>
                                )
                            }
                        ]}
                        dataSource={coaches}
                        rowKey="coach_id"
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} coach`,
                        }}
                    />
                </Card>

                {/* Schedule Creation Modal */}
                <Modal
                    title="Tạo lịch hàng loạt"
                    open={scheduleModal}
                    onCancel={handleScheduleCancel}
                    footer={null}
                    width={800}
                >
                    <Form
                        form={scheduleForm}
                        layout="vertical"
                        onFinish={handleCreateBulkSchedules}
                    >
                        <Form.Item label="Loại tạo lịch">
                            <Select
                                value={scheduleType}
                                onChange={setScheduleType}
                                style={{ width: '100%' }}
                            >
                                <Option value="single">Tạo cho 1 coach</Option>
                                <Option value="multiple">Tạo cho nhiều coach</Option>
                            </Select>
                        </Form.Item>

                        {scheduleType === 'single' && (
                            <Form.Item
                                name="coach_id"
                                label="Chọn Coach"
                                rules={[{ required: true, message: 'Vui lòng chọn coach' }]}
                            >
                                <Select placeholder="Chọn coach">
                                    {coaches.map(coach => (
                                        <Option key={coach.coach_id} value={coach.coach_id}>
                                            {coach.full_name} - {coach.email}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        )}

                        {scheduleType === 'multiple' && (
                            <Form.Item
                                name="coachIds"
                                label="Chọn nhiều Coach"
                                rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 coach' }]}
                            >
                                <Select
                                    mode="multiple"
                                    placeholder="Chọn các coach"
                                    onChange={setSelectedCoaches}
                                >
                                    {coaches.map(coach => (
                                        <Option key={coach.coach_id} value={coach.coach_id}>
                                            {coach.full_name} - {coach.email}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        )}

                        <Divider>Phương thức tạo lịch</Divider>

                        <Form.Item
                            name="usePattern"
                            valuePropName="checked"
                            initialValue={true}
                        >
                            <Checkbox>Tạo theo pattern (thời gian cố định)</Checkbox>
                        </Form.Item>

                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, currentValues) => prevValues.usePattern !== currentValues.usePattern}
                        >
                            {({ getFieldValue }) => {
                                const usePattern = getFieldValue('usePattern');

                                if (usePattern) {
                                    return (
                                        <>
                                            <Row gutter={16}>
                                                <Col span={12}>
                                                    <Form.Item
                                                        name="dateRange"
                                                        label="Phạm vi ngày"
                                                        rules={[{ required: true, message: 'Vui lòng chọn phạm vi ngày' }]}
                                                    >
                                                        <DatePicker.RangePicker
                                                            style={{ width: '100%' }}
                                                            disabledDate={(current) => current && current < dayjs().startOf('day')}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item
                                                        name="timeRange"
                                                        label="Phạm vi giờ"
                                                        rules={[{ required: true, message: 'Vui lòng chọn phạm vi giờ' }]}
                                                    >
                                                        <TimePicker.RangePicker format="HH:mm" style={{ width: '100%' }} />
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Row gutter={16}>
                                                <Col span={12}>
                                                    <Form.Item
                                                        name="daysOfWeek"
                                                        label="Ngày trong tuần"
                                                        rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
                                                    >
                                                        <Select mode="multiple" placeholder="Chọn các ngày">
                                                            {dayOptions.map(day => (
                                                                <Option key={day.value} value={day.value}>
                                                                    {day.label}
                                                                </Option>
                                                            ))}
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item
                                                        name="duration"
                                                        label="Thời lượng mỗi slot (phút)"
                                                        initialValue={60}
                                                        rules={[{ required: true, message: 'Vui lòng nhập thời lượng' }]}
                                                    >
                                                        <Input type="number" min={15} max={480} />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                        </>
                                    );
                                } else {
                                    return (
                                        <Form.Item
                                            name="specificSchedules"
                                            label="Lịch cụ thể"
                                            rules={[{ required: true, message: 'Vui lòng nhập lịch cụ thể' }]}
                                        >
                                            <Input.TextArea
                                                rows={4}
                                                placeholder="Nhập lịch theo format: YYYY-MM-DD HH:mm,YYYY-MM-DD HH:mm (mỗi lịch một dòng)"
                                            />
                                        </Form.Item>
                                    );
                                }
                            }}
                        </Form.Item>

                        <Form.Item>
                            <Space>
                                <Button onClick={handleScheduleCancel}>
                                    Hủy
                                </Button>
                                <Button type="primary" htmlType="submit" loading={scheduleLoading}>
                                    Tạo lịch
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>

                <CoachScheduleModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    coach={modalCoach}
                    token={token}
                />
            </div>
        </div>
    );
};

export default ScheduleManagement; 