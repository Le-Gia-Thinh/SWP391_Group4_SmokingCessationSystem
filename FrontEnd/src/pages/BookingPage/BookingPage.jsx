import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Input, Select, DatePicker, TimePicker, message, Avatar, Rate, Tag, Row, Col, Typography, Spin } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, UserOutlined, StarFilled } from '@ant-design/icons';
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

    // Mock coaches data (in real app, this would come from API)
    const mockCoaches = [
        {
            coach_id: 1,
            name: 'Dr. Sarah Wilson',
            email: 'coach@example.com',
            specialization: 'Smoking Cessation',
            experience: 5,
            rating: 4.8,
            totalSessions: 150,
            successRate: 85,
            avatar: null,
            bio: 'Certified smoking cessation specialist with 5 years of experience helping people quit smoking.',
        },
        {
            coach_id: 2,
            name: 'Dr. Michael Chen',
            email: 'michael.chen@example.com',
            specialization: 'Behavioral Therapy',
            experience: 8,
            rating: 4.9,
            totalSessions: 200,
            successRate: 90,
            avatar: null,
            bio: 'Expert in behavioral therapy and addiction counseling with 8 years of experience.',
        },
        {
            coach_id: 3,
            name: 'Dr. Emily Johnson',
            email: 'emily.johnson@example.com',
            specialization: 'Cognitive Behavioral Therapy',
            experience: 6,
            rating: 4.7,
            totalSessions: 180,
            successRate: 88,
            avatar: null,
            bio: 'Specialist in cognitive behavioral therapy for smoking cessation and addiction recovery.',
        }
    ];

    useEffect(() => {
        loadCoaches();
    }, []);

    const loadCoaches = async () => {
        try {
            setInitialLoading(true);
            // In a real app, you would fetch coaches from API
            setCoaches(mockCoaches);
        } catch (error) {
            console.error('Error loading coaches:', error);
            message.error('Failed to load coaches');
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

                    // Filter schedules for selected date
                    const daySchedules = schedules.filter(schedule => {
                        const scheduleDate = moment(schedule.start_time).format('YYYY-MM-DD');
                        return scheduleDate === dateStr && !schedule.is_booked;
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
            message.error('Failed to load available schedules');
        }
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
    };

    const formatTimeSlot = (schedule) => {
        const startTime = moment(schedule.start_time);
        const endTime = moment(schedule.end_time);
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

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to book appointment');
            }

            message.success('Booking submitted successfully! The coach will review your request.');
            setIsModalVisible(false);
            bookingForm.resetFields();
            setSelectedCoach(null);
            setSelectedSlot(null);

            // Reload available schedules
            loadAvailableSchedules();
        } catch (error) {
            console.error('Error booking appointment:', error);
            message.error(error.message || 'Failed to book appointment');
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
                    <div style={{ marginTop: '16px' }}>Loading coaches...</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div className="booking-page">
                <div className="booking-container">
                    <Title level={2}>Book a Coaching Session</Title>
                    <Text type="secondary">
                        Select a date and choose from available coaches to book your smoking cessation session.
                    </Text>

                    <Card style={{ marginTop: 24 }}>
                        <Row gutter={[24, 24]}>
                            <Col xs={24} md={8}>
                                <div className="date-selection">
                                    <Title level={4}>
                                        <CalendarOutlined /> Select Date
                                    </Title>
                                    <DatePicker
                                        style={{ width: '100%' }}
                                        placeholder="Choose a date"
                                        onChange={handleDateChange}
                                        disabledDate={(current) => {
                                            // Disable past dates
                                            return current && current < moment().startOf('day');
                                        }}
                                    />
                                </div>
                            </Col>
                            <Col xs={24} md={16}>
                                <div className="coaches-section">
                                    <Title level={4}>
                                        <UserOutlined /> Available Coaches
                                    </Title>
                                    {selectedDate ? (
                                        availableCoaches.length > 0 ? (
                                            <Row gutter={[16, 16]}>
                                                {availableCoaches.map((coach) => (
                                                    <Col xs={24} md={12} key={coach.coach_id}>
                                                        <Card className="coach-card">
                                                            <div className="coach-header">
                                                                <Avatar size={64} icon={<UserOutlined />} />
                                                                <div className="coach-info">
                                                                    <Title level={5}>{coach.name}</Title>
                                                                    <Text type="secondary">{coach.specialization}</Text>
                                                                    <div className="coach-stats">
                                                                        <Rate disabled defaultValue={coach.rating} />
                                                                        <Text type="secondary">({coach.totalSessions} sessions)</Text>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="coach-bio">
                                                                <Text>{coach.bio}</Text>
                                                            </div>

                                                            <div className="available-slots">
                                                                <Title level={5}>
                                                                    <ClockCircleOutlined /> Available Slots
                                                                </Title>
                                                                <div className="slots-grid">
                                                                    {coach.availableSchedules.map((schedule) => {
                                                                        const slot = formatTimeSlot(schedule);
                                                                        return (
                                                                            <Button
                                                                                key={schedule.schedule_id}
                                                                                type="primary"
                                                                                size="small"
                                                                                onClick={() => handleSelectSlotForBooking(coach, schedule)}
                                                                                style={{ margin: '4px' }}
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
                                            <div className="no-availability">
                                                <Text type="secondary">
                                                    No coaches available for the selected date. Please try another date.
                                                </Text>
                                            </div>
                                        )
                                    ) : (
                                        <div className="select-date-prompt">
                                            <Text type="secondary">
                                                Please select a date to see available coaches and time slots.
                                            </Text>
                                        </div>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    </Card>
                </div>

                {/* Booking Modal */}
                <FormModal
                    title="Book Appointment"
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
                                <h4>Coach Information</h4>
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
                                <h4>Session Details</h4>
                                <div style={{ background: '#f6ffed', padding: 12, borderRadius: 6 }}>
                                    <div><strong>Date:</strong> {selectedDate?.format('MMMM DD, YYYY')}</div>
                                    <div><strong>Time:</strong> {selectedSlot.time} - {selectedSlot.endTime}</div>
                                    <div><strong>Duration:</strong> {selectedSlot.duration} minutes</div>
                                </div>
                            </div>

                            <Form.Item
                                name="notes"
                                label="Additional Notes (Optional)"
                            >
                                <Input.TextArea
                                    rows={4}
                                    placeholder="Any specific concerns or topics you'd like to discuss..."
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