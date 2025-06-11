import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Input, Select, DatePicker, TimePicker, message, Avatar, Rate, Tag, Row, Col, Typography } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, UserOutlined, StarFilled } from '@ant-design/icons';
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

    // Mock data for coaches with detailed availability
    const mockCoaches = [
        {
            id: 1,
            name: 'Dr. Sarah Wilson',
            email: 'coach@example.com',
            specialization: 'Smoking Cessation',
            experience: 5,
            rating: 4.8,
            totalSessions: 150,
            successRate: 85,
            avatar: null,
            bio: 'Certified smoking cessation specialist with 5 years of experience helping people quit smoking.',
            availability: {
                '2025-06-11': [
                    { time: '09:00', duration: 60, available: true },
                    { time: '14:00', duration: 60, available: true },
                    { time: '16:00', duration: 60, available: false }
                ],
                '2025-06-12': [
                    { time: '10:00', duration: 60, available: true },
                    { time: '15:00', duration: 60, available: true },
                    { time: '17:00', duration: 60, available: true }
                ],
                '2025-06-13': [
                    { time: '09:00', duration: 60, available: true },
                    { time: '13:00', duration: 60, available: false },
                    { time: '16:00', duration: 60, available: true }
                ],
                '2025-06-14': [
                    { time: '11:00', duration: 60, available: true },
                    { time: '14:00', duration: 60, available: true },
                    { time: '18:00', duration: 60, available: true }
                ]
            }
        },
        {
            id: 2,
            name: 'Dr. Michael Chen',
            email: 'michael.chen@example.com',
            specialization: 'Behavioral Therapy',
            experience: 8,
            rating: 4.9,
            totalSessions: 200,
            successRate: 90,
            avatar: null,
            bio: 'Expert in behavioral therapy and addiction counseling with 8 years of experience.',
            availability: {
                '2025-06-11': [
                    { time: '10:00', duration: 60, available: true },
                    { time: '15:00', duration: 60, available: true },
                    { time: '17:00', duration: 60, available: true }
                ],
                '2025-06-12': [
                    { time: '09:00', duration: 60, available: false },
                    { time: '14:00', duration: 60, available: true },
                    { time: '16:00', duration: 60, available: true }
                ],
                '2025-06-13': [
                    { time: '11:00', duration: 60, available: true },
                    { time: '14:00', duration: 60, available: true },
                    { time: '18:00', duration: 60, available: true }
                ],
                '2025-06-14': [
                    { time: '08:00', duration: 60, available: true },
                    { time: '12:00', duration: 60, available: true },
                    { time: '15:00', duration: 60, available: false }
                ]
            }
        },
        {
            id: 3,
            name: 'Dr. Emily Johnson',
            email: 'emily.johnson@example.com',
            specialization: 'Cognitive Behavioral Therapy',
            experience: 6,
            rating: 4.7,
            totalSessions: 180,
            successRate: 88,
            avatar: null,
            bio: 'Specialist in cognitive behavioral therapy for smoking cessation and addiction recovery.',
            availability: {
                '2025-06-11': [
                    { time: '08:00', duration: 60, available: true },
                    { time: '12:00', duration: 60, available: true },
                    { time: '15:00', duration: 60, available: false }
                ],
                '2025-06-12': [
                    { time: '09:00', duration: 60, available: true },
                    { time: '13:00', duration: 60, available: true },
                    { time: '16:00', duration: 60, available: true }
                ],
                '2025-06-13': [
                    { time: '10:00', duration: 60, available: true },
                    { time: '14:00', duration: 60, available: true },
                    { time: '17:00', duration: 60, available: true }
                ],
                '2025-06-14': [
                    { time: '09:00', duration: 60, available: true },
                    { time: '13:00', duration: 60, available: true },
                    { time: '16:00', duration: 60, available: true }
                ]
            }
        }
    ];

    useEffect(() => {
        // Simulate API call to fetch coaches
        console.log('Loading coaches...');
        setCoaches(mockCoaches);
        console.log('Coaches loaded:', mockCoaches.length);
    }, []);

    // Filter available coaches based on selected date
    useEffect(() => {
        console.log('Selected date:', selectedDate);
        console.log('Coaches state:', coaches.length);

        if (selectedDate) {
            const dateStr = selectedDate.format('YYYY-MM-DD');
            console.log('Date string:', dateStr);
            console.log('All coaches:', coaches);

            const available = coaches.filter(coach => {
                const dayAvailability = coach.availability[dateStr];
                console.log(`Coach ${coach.name} availability for ${dateStr}:`, dayAvailability);
                return dayAvailability && dayAvailability.some(slot => slot.available);
            });

            console.log('Available coaches:', available);
            setAvailableCoaches(available);
        } else {
            console.log('No date selected, clearing available coaches');
            setAvailableCoaches([]);
        }
    }, [selectedDate, coaches]);

    const handleDateChange = (date) => {
        console.log('Date changed to:', date);
        setSelectedDate(date);
    };

    const getAvailableSlots = (coach, date) => {
        if (!date) return [];
        const dateStr = date.format('YYYY-MM-DD');
        return coach.availability[dateStr]?.filter(slot => slot.available) || [];
    };

    const handleSelectSlotForBooking = (coach, slot) => {
        setSelectedCoach(coach);
        setSelectedSlot(slot);
        bookingForm.setFieldsValue({
            duration: slot.duration,
        });
        setIsModalVisible(true);
    };

    const handleBookingSubmit = async (values) => {
        setLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            const bookingData = {
                id: Date.now(),
                userId: user.id,
                coachId: selectedCoach.id,
                coachName: selectedCoach.name,
                userName: user.name,
                userEmail: user.email,
                date: selectedDate.format('YYYY-MM-DD'),
                time: selectedSlot.time,
                duration: values.duration,
                notes: values.notes,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            // Mark the booked slot as unavailable in mock data
            const updatedCoaches = coaches.map(c => {
                if (c.id === selectedCoach.id) {
                    const updatedAvailability = { ...c.availability };
                    const dateStr = selectedDate.format('YYYY-MM-DD');
                    if (updatedAvailability[dateStr]) {
                        updatedAvailability[dateStr] = updatedAvailability[dateStr].map(s => {
                            if (s.time === selectedSlot.time) {
                                return { ...s, available: false };
                            }
                            return s;
                        });
                    }
                    return { ...c, availability: updatedAvailability };
                }
                return c;
            });
            setCoaches(updatedCoaches); // Update coaches state

            // Save booking to localStorage (in real app, this would be API call)
            const existingBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
            existingBookings.push(bookingData);
            localStorage.setItem('bookings', JSON.stringify(existingBookings));

            message.success('Booking request sent successfully! Coach will review and confirm.');
            setIsModalVisible(false);
            bookingForm.resetFields();
        } catch (error) {
            message.error('Failed to submit booking request');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        bookingForm.resetFields();
    };

    return (
        <div className="booking-page">
            <Navbar />

            <div className="booking-container">
                <div className="booking-header">
                    <Title level={1} style={{ color: '#333', marginBottom: 10 }}>
                        Book a Coach
                    </Title>
                    <Text style={{ color: '#666', fontSize: '1.2rem' }}>
                        Choose a certified coach to help you quit smoking
                    </Text>
                </div>

                {/* Date Selection */}
                <div className="date-selection">
                    <Card className="date-card">
                        <div className="date-picker-container">
                            <CalendarOutlined style={{ fontSize: '24px', color: '#52c41a', marginRight: 12 }} />
                            <div>
                                <Title level={4} style={{ marginBottom: 8 }}>Select Your Preferred Date</Title>
                                <Text type="secondary">Choose a date to see available coaches and time slots</Text>
                            </div>
                        </div>
                        <DatePicker
                            size="large"
                            style={{ width: '100%', marginTop: 16 }}
                            placeholder="Select date"
                            onChange={handleDateChange}
                            disabledDate={(current) => current && current < moment().startOf('day')}
                        />
                    </Card>
                </div>

                {/* Available Coaches */}
                {selectedDate && (
                    <div className="available-coaches">
                        <Title level={2} style={{ color: '#333', marginBottom: 20 }}>
                            Available Coaches for {selectedDate.format('MMMM DD, YYYY')}
                        </Title>

                        {availableCoaches.length === 0 ? (
                            <Card className="no-availability-card">
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <CalendarOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: 16 }} />
                                    <Title level={4} type="secondary">No coaches available on this date</Title>
                                    <Text type="secondary">Please select a different date</Text>
                                </div>
                            </Card>
                        ) : (
                            <Row gutter={[24, 24]}>
                                {availableCoaches.map((coach) => (
                                    <Col xs={24} md={12} lg={8} key={coach.id}>
                                        <Card className="coach-card">
                                            <div className="coach-info">
                                                <div className="coach-avatar">
                                                    <Avatar size={80} icon={<UserOutlined />} />
                                                </div>
                                                <div className="coach-details">
                                                    <h3>{coach.name}</h3>
                                                    <p className="specialization">{coach.specialization}</p>
                                                    <div className="rating">
                                                        <Rate disabled defaultValue={coach.rating} />
                                                        <span className="rating-text">{coach.rating}</span>
                                                    </div>
                                                    <div className="stats">
                                                        <Tag color="blue">{coach.experience} years exp.</Tag>
                                                        <Tag color="green">{coach.successRate}% success rate</Tag>
                                                        <Tag color="orange">{coach.totalSessions} sessions</Tag>
                                                    </div>
                                                    <p className="bio">{coach.bio}</p>
                                                </div>
                                            </div>

                                            <div className="available-slots">
                                                <h4>
                                                    <ClockCircleOutlined style={{ marginRight: 8 }} />
                                                    Available Time Slots:
                                                </h4>
                                                <div className="slots-grid">
                                                    {getAvailableSlots(coach, selectedDate).map((slot, index) => (
                                                        <Tag
                                                            key={index}
                                                            color={slot.available ? "blue" : "default"}
                                                            className={`time-slot ${!slot.available ? 'time-slot-disabled' : ''}`}
                                                            onClick={slot.available ? () => handleSelectSlotForBooking(coach, slot) : null}
                                                        >
                                                            {slot.time} ({slot.duration} min)
                                                        </Tag>
                                                    ))}
                                                </div>
                                            </div>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </div>
                )}

                {/* Show all coaches when no date is selected */}
                {!selectedDate && (
                    <div className="all-coaches">
                        <Title level={2} style={{ color: '#333', marginBottom: 20 }}>
                            All Available Coaches
                        </Title>
                        <Row gutter={[24, 24]}>
                            {coaches.map((coach) => (
                                <Col xs={24} md={12} lg={8} key={coach.id}>
                                    <Card className="coach-card">
                                        <div className="coach-info">
                                            <div className="coach-avatar">
                                                <Avatar size={80} icon={<UserOutlined />} />
                                            </div>
                                            <div className="coach-details">
                                                <h3>{coach.name}</h3>
                                                <p className="specialization">{coach.specialization}</p>
                                                <div className="rating">
                                                    <Rate disabled defaultValue={coach.rating} />
                                                    <span className="rating-text">{coach.rating}</span>
                                                </div>
                                                <div className="stats">
                                                    <Tag color="blue">{coach.experience} years exp.</Tag>
                                                    <Tag color="green">{coach.successRate}% success rate</Tag>
                                                    <Tag color="orange">{coach.totalSessions} sessions</Tag>
                                                </div>
                                                <p className="bio">{coach.bio}</p>
                                            </div>
                                        </div>

                                        <div className="coach-card-footer">
                                            <Text type="secondary">
                                                Select a date to see available time slots
                                            </Text>
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>
                )}

                {/* Fallback - Always show if something goes wrong */}
                {!selectedDate && coaches.length === 0 && (
                    <div className="fallback-section">
                        <Card className="fallback-card">
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <CalendarOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: 16 }} />
                                <Title level={4}>Loading coaches...</Title>
                                <Text type="secondary">Please wait while we load the available coaches</Text>
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {/* Booking Modal */}
            <Modal
                title={`Book Session with ${selectedCoach?.name}`}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={600}
            >
                <Form
                    form={bookingForm}
                    layout="vertical"
                    onFinish={handleBookingSubmit}
                >
                    <Form.Item
                        name="duration"
                        label="Session Duration"
                        rules={[{ required: true, message: 'Please select duration' }]}
                    >
                        <Select placeholder="Select duration">
                            <Option value={30}>30 minutes</Option>
                            <Option value={60}>1 hour</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="notes"
                        label="Additional Notes"
                    >
                        <TextArea
                            rows={4}
                            placeholder="Tell us about your smoking history, goals, or any specific concerns..."
                        />
                    </Form.Item>

                    <Form.Item>
                        <div className="modal-actions">
                            <Button onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Submit Booking Request
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default BookingPage; 