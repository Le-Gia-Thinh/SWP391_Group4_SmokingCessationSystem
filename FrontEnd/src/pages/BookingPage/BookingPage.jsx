import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Input, Select, DatePicker, TimePicker, message, Avatar, Rate, Tag } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, UserOutlined, StarFilled } from '@ant-design/icons';
import Navbar from '../../layouts/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import './BookingPage.css';

const { TextArea } = Input;
const { Option } = Select;

const BookingPage = () => {
    const { user } = useAuth();
    const [coaches, setCoaches] = useState([]);
    const [selectedCoach, setSelectedCoach] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [bookingForm] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // Mock data for coaches
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
            availableSlots: [
                { day: 'Monday', time: '09:00-10:00' },
                { day: 'Tuesday', time: '14:00-15:00' },
                { day: 'Wednesday', time: '16:00-17:00' },
                { day: 'Thursday', time: '10:00-11:00' },
                { day: 'Friday', time: '15:00-16:00' }
            ]
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
            availableSlots: [
                { day: 'Monday', time: '13:00-14:00' },
                { day: 'Tuesday', time: '09:00-10:00' },
                { day: 'Wednesday', time: '14:00-15:00' },
                { day: 'Thursday', time: '16:00-17:00' },
                { day: 'Friday', time: '11:00-12:00' }
            ]
        }
    ];

    useEffect(() => {
        // Simulate API call to fetch coaches
        setCoaches(mockCoaches);
    }, []);

    const handleBookCoach = (coach) => {
        setSelectedCoach(coach);
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
                date: values.date.format('YYYY-MM-DD'),
                time: values.time.format('HH:mm'),
                duration: values.duration,
                sessionType: values.sessionType,
                notes: values.notes,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

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
                    <h1>Book a Coach</h1>
                    <p>Choose a certified coach to help you quit smoking</p>
                </div>

                <div className="coaches-grid">
                    {coaches.map((coach) => (
                        <Card key={coach.id} className="coach-card">
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
                                <h4>Available Slots:</h4>
                                <div className="slots-grid">
                                    {coach.availableSlots.map((slot, index) => (
                                        <Tag key={index} color="cyan">
                                            {slot.day} {slot.time}
                                        </Tag>
                                    ))}
                                </div>
                            </div>

                            <Button
                                type="primary"
                                size="large"
                                block
                                onClick={() => handleBookCoach(coach)}
                                icon={<CalendarOutlined />}
                            >
                                Book Session
                            </Button>
                        </Card>
                    ))}
                </div>
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
                        name="date"
                        label="Preferred Date"
                        rules={[{ required: true, message: 'Please select a date' }]}
                    >
                        <DatePicker
                            style={{ width: '100%' }}
                            placeholder="Select date"
                            disabledDate={(current) => current && current < new Date().startOf('day')}
                        />
                    </Form.Item>

                    <Form.Item
                        name="time"
                        label="Preferred Time"
                        rules={[{ required: true, message: 'Please select a time' }]}
                    >
                        <TimePicker
                            style={{ width: '100%' }}
                            format="HH:mm"
                            placeholder="Select time"
                        />
                    </Form.Item>

                    <Form.Item
                        name="duration"
                        label="Session Duration"
                        rules={[{ required: true, message: 'Please select duration' }]}
                    >
                        <Select placeholder="Select duration">
                            <Option value="30">30 minutes</Option>
                            <Option value="60">1 hour</Option>
                            <Option value="90">1.5 hours</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="sessionType"
                        label="Session Type"
                        rules={[{ required: true, message: 'Please select session type' }]}
                    >
                        <Select placeholder="Select session type">
                            <Option value="initial">Initial Consultation</Option>
                            <Option value="followup">Follow-up Session</Option>
                            <Option value="emergency">Emergency Support</Option>
                            <Option value="group">Group Session</Option>
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