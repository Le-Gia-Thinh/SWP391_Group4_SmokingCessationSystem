import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Input, Select, DatePicker, TimePicker, message, Avatar, Rate, Tag, Row, Col, Typography, Spin, Alert } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, UserOutlined, StarFilled, ExclamationCircleOutlined } from '@ant-design/icons';
import FormModal from '../../components/ui/FormModal';
import Navbar from '../../layouts/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import './BookingPage.css';
import moment from 'moment';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const BookingPage = () => {
    const { user } = useAuth();
    const [coaches, setCoaches] = useState([]);
    const [selectedCoach, setSelectedCoach] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [bookingForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [availableCoaches, setAvailableCoaches] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [userBookingStats, setUserBookingStats] = useState({ weeklyCount: 0, maxAllowed: 3 });

    useEffect(() => {
        loadCoaches();
        loadUserBookingStats();
    }, []);

    const loadUserBookingStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/appointment/my-bookings', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const now = moment();
                    const weekAgo = moment().subtract(7, 'days');

                    const weeklyBookings = data.data.filter(booking => {
                        const bookingTime = moment.parseZone(booking.scheduled_time);
                        return bookingTime.isBetween(weekAgo, now) &&
                            ['pending', 'accepted', 'completed'].includes(booking.session_status);
                    });

                    setUserBookingStats({
                        weeklyCount: weeklyBookings.length,
                        maxAllowed: 3
                    });
                }
            }
        } catch (error) {
            console.error('Error loading user booking stats:', error);
        }
    };

    const loadCoaches = async () => {
        try {
            setInitialLoading(true);
            const response = await fetch('http://localhost:5000/api/coach/list');

            if (!response.ok) {
                throw new Error('Failed to load coaches');
            }

            const data = await response.json();
            if (data.success) {
                // Transform the data to match the expected format
                const transformedCoaches = data.data.map(coach => ({
                    coach_id: coach.coach_id,
                    name: coach.full_name,
                    specialization: coach.specialization || 'Huấn luyện viên bỏ thuốc lá',
                    bio: coach.bio || 'Huấn luyện viên có kinh nghiệm giúp mọi người bỏ thuốc lá',
                    rating: 4.5,
                    totalSessions: 50,
                    email: coach.email
                }));
                setCoaches(transformedCoaches);
            } else {
                setCoaches([]);
            }
        } catch (error) {
            console.error('Error loading coaches:', error);
            message.error('Không thể tải danh sách huấn luyện viên');
            setCoaches([]);
        } finally {
            setInitialLoading(false);
        }
    };

    // Load available schedules for selected date
    useEffect(() => {
        if (selectedDate) {
            loadAvailableSchedules();
        } else {
            setAvailableCoaches([]);
        }
    }, [selectedDate]);

    const loadAvailableSchedules = async () => {
        try {
            const dateStr = selectedDate.format('YYYY-MM-DD');
            const availableCoachesWithSchedules = [];

            for (const coach of coaches) {
                try {
                    const response = await fetch(`http://localhost:5000/api/schedule/available/${coach.coach_id}`);

                    if (!response.ok) {
                        console.error(`Failed to load schedules for coach ${coach.coach_id}`);
                        continue;
                    }

                    const data = await response.json();
                    const schedules = data || [];

                    // Filter schedules for selected date and check time constraints
                    const now = moment();
                    const daySchedules = schedules.filter(schedule => {
                        const scheduleDate = moment.parseZone(schedule.start_time).format('YYYY-MM-DD');
                        const scheduleTime = moment.parseZone(schedule.start_time);
                        const diffInMinutes = scheduleTime.diff(now, 'minutes');

                        return scheduleDate === dateStr &&
                            !schedule.is_booked &&
                            diffInMinutes >= 60; // Chặn đặt lịch trong vòng 1 tiếng
                    });

                    if (daySchedules.length > 0) {
                        availableCoachesWithSchedules.push({
                            ...coach,
                            availableSchedules: daySchedules
                        });
                    }
                } catch (error) {
                    console.error(`Error loading schedules for coach ${coach.coach_id}:`, error);
                }
            }

            setAvailableCoaches(availableCoachesWithSchedules);
        } catch (error) {
            console.error('Error loading available schedules:', error);
            message.error('Không thể tải lịch trình có sẵn');
        }
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
    };

    const formatTimeSlot = (schedule) => {
        const startTime = moment.parseZone(schedule.start_time);
        const endTime = moment.parseZone(schedule.end_time);
        const duration = endTime.diff(startTime, 'minutes');

        return {
            schedule_id: schedule.schedule_id,
            time: startTime.format('HH:mm'),
            endTime: endTime.format('HH:mm'),
            duration: duration,
            start_time: schedule.start_time,
            end_time: schedule.end_time
        };
    };

    const handleSelectSlotForBooking = (coach, schedule) => {
        // Kiểm tra giới hạn 3 cuộc hẹn/tuần
        if (userBookingStats.weeklyCount >= userBookingStats.maxAllowed) {
            message.error(`Bạn đã đặt ${userBookingStats.weeklyCount} buổi. Chỉ được phép tối đa ${userBookingStats.maxAllowed} buổi tư vấn mỗi tuần.`);
            return;
        }

        setSelectedCoach(coach);
        setSelectedSlot(formatTimeSlot(schedule));
        bookingForm.setFieldsValue({
            duration: formatTimeSlot(schedule).duration,
        });
        setIsModalVisible(true);
    };

    const handleBookingSubmit = async (values) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/appointment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ schedule_id: selectedSlot.schedule_id })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to book appointment');
            }

            message.success('Đặt lịch thành công! Huấn luyện viên sẽ xem xét yêu cầu của bạn.');
            setIsModalVisible(false);
            bookingForm.resetFields();
            setSelectedCoach(null);
            setSelectedSlot(null);

            // Reload available schedules and user stats
            loadAvailableSchedules();
            loadUserBookingStats();
        } catch (error) {
            console.error('Error booking appointment:', error);
            message.error(error.message || 'Không thể đặt lịch');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        bookingForm.resetFields();
        setSelectedCoach(null);
        setSelectedSlot(null);
    };

    if (initialLoading) {
        return (
            <div>
                <Navbar />
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: '16px' }}>Đang tải huấn luyện viên...</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div className="booking-page">
                <div className="booking-container">
                    <Title level={2}>Đặt lịch huấn luyện</Title>
                    <Text type="secondary">
                        Chọn ngày và chọn từ các huấn luyện viên có sẵn để đặt lịch huấn luyện bỏ thuốc lá.
                    </Text>

                    {/* Hiển thị thống kê đặt lịch của user */}
                    <Alert
                        message={`Bạn đã đặt ${userBookingStats.weeklyCount}/${userBookingStats.maxAllowed} buổi tư vấn trong tuần này`}
                        type={userBookingStats.weeklyCount >= userBookingStats.maxAllowed ? "warning" : "info"}
                        showIcon
                        style={{ marginTop: 16, marginBottom: 16 }}
                        icon={<ExclamationCircleOutlined />}
                    />

                    <Card style={{ marginTop: 24 }}>
                        <div className="date-selection" style={{ maxWidth: 350, margin: '0 auto', marginBottom: 32 }}>
                            <Title level={4}>
                                <CalendarOutlined /> Chọn ngày
                            </Title>
                            <DatePicker
                                style={{ width: '100%' }}
                                placeholder="Chọn một ngày"
                                onChange={handleDateChange}
                                disabledDate={(current) => current && current < moment().startOf('day')}
                            />
                        </div>
                        <div className="coaches-section-below">
                            <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
                                <UserOutlined /> Huấn luyện viên có sẵn
                            </Title>
                            {selectedDate ? (
                                availableCoaches.length > 0 ? (
                                    <Row gutter={[24, 24]} justify="center">
                                        {availableCoaches.map((coach) => (
                                            <Col xs={24} sm={12} md={8} key={coach.coach_id} style={{ display: 'flex', justifyContent: 'center' }}>
                                                <Card className="coach-card improved-coach-card">
                                                    <div className="coach-header improved-coach-header">
                                                        <Avatar size={72} icon={<UserOutlined />} className="improved-coach-avatar" />
                                                    </div>
                                                    <div className="coach-info improved-coach-info" style={{ alignItems: 'center', textAlign: 'center' }}>
                                                        <Title level={5} style={{ marginBottom: 0, color: '#189c38', fontWeight: 700 }}>{coach.name}</Title>
                                                        <Text type="secondary" style={{ color: '#189c38', fontWeight: 500 }}>{coach.specialization}</Text>
                                                        <div className="coach-stats improved-coach-stats">
                                                            <Rate disabled defaultValue={coach.rating} style={{ color: '#52c41a' }} />
                                                            <Text type="secondary" style={{ marginLeft: 8 }}>({coach.totalSessions} buổi)</Text>
                                                        </div>
                                                    </div>
                                                    <div className="coach-bio improved-coach-bio" style={{ textAlign: 'center', margin: '10px 0', color: '#333', fontSize: 14 }}>
                                                        <Text>{coach.bio}</Text>
                                                    </div>
                                                    <div className="available-slots improved-available-slots">
                                                        <Title level={5} style={{ color: '#189c38', marginBottom: 8, fontSize: 15 }}>
                                                            <ClockCircleOutlined /> Khung giờ có sẵn
                                                        </Title>
                                                        <div className="slots-grid improved-slots-grid">
                                                            {coach.availableSchedules.map((schedule) => {
                                                                const slot = formatTimeSlot(schedule);
                                                                const isDisabled = userBookingStats.weeklyCount >= userBookingStats.maxAllowed;
                                                                return (
                                                                    <Button
                                                                        key={schedule.schedule_id}
                                                                        type="primary"
                                                                        size="small"
                                                                        disabled={isDisabled}
                                                                        onClick={() => handleSelectSlotForBooking(coach, schedule)}
                                                                        style={{
                                                                            margin: '4px',
                                                                            background: isDisabled ? '#d9d9d9' : '#52c41a',
                                                                            borderColor: isDisabled ? '#d9d9d9' : '#52c41a',
                                                                            fontWeight: 600,
                                                                            fontSize: 15,
                                                                            borderRadius: 8
                                                                        }}
                                                                    >
                                                                        {slot.time} - {slot.endTime}
                                                                    </Button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                ) : (
                                    <div className="no-availability" style={{ textAlign: 'center', margin: '32px 0' }}>
                                        <Text type="secondary">
                                            Không có huấn luyện viên nào có sẵn cho ngày đã chọn. Vui lòng thử ngày khác.
                                        </Text>
                                    </div>
                                )
                            ) : (
                                <div className="select-date-prompt" style={{ textAlign: 'center', margin: '32px 0' }}>
                                    <Text type="secondary">
                                        Vui lòng chọn ngày để xem các huấn luyện viên và khung giờ có sẵn.
                                    </Text>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Booking Modal */}
                <FormModal
                    title="Đặt lịch hẹn"
                    visible={isModalVisible}
                    onCancel={handleCancel}
                    onSubmit={handleBookingSubmit}
                    form={bookingForm}
                    loading={loading}
                    width={600}
                >
                    {selectedCoach && selectedSlot && (
                        <>
                            <div style={{ marginBottom: 16 }}>
                                <h4>Thông tin huấn luyện viên</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <Avatar size={48} icon={<UserOutlined />} />
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{selectedCoach.name}</div>
                                        <div style={{ color: '#666' }}>{selectedCoach.specialization}</div>
                                        <Rate disabled defaultValue={selectedCoach.rating} style={{ fontSize: 14 }} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <h4>Chi tiết buổi học</h4>
                                <div style={{ background: '#f6ffed', padding: 12, borderRadius: 6 }}>
                                    <div><strong>Ngày:</strong> {selectedDate?.format('DD/MM/YYYY')}</div>
                                    <div><strong>Thời gian:</strong> {selectedSlot.time} - {selectedSlot.endTime}</div>
                                    <div><strong>Thời lượng:</strong> {selectedSlot.duration} phút</div>
                                </div>
                            </div>

                            <Form.Item
                                name="notes"
                                label="Ghi chú bổ sung (Tùy chọn)"
                            >
                                <Input.TextArea
                                    rows={4}
                                    placeholder="Bất kỳ mối quan tâm cụ thể hoặc chủ đề nào bạn muốn thảo luận..."
                                />
                            </Form.Item>
                        </>
                    )}
                </FormModal>
            </div>
        </div>
    );
};

export default BookingPage; 