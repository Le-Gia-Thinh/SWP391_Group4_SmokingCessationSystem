import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  message,
  Avatar,
  Rate,
  Tag,
  Row,
  Col,
  Typography,
  Spin,
  Alert,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  StarFilled,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import FormModal from "../../components/ui/FormModal";
import Navbar from "../../layouts/Navbar";
import { useAuth } from "../../contexts/AuthContext";
import "./BookingPage.css";
import moment from "moment";

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
  const [userBookingStats, setUserBookingStats] = useState({
    weeklyCount: 0,
    maxAllowed: 3,
  });
  const [selectedTimeFrame, setSelectedTimeFrame] = useState(null);

  useEffect(() => {
    loadCoaches();
    loadUserBookingStats();
  }, []);

  const loadUserBookingStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/appointment/my-bookings",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const now = moment();
          const weekAgo = moment().subtract(7, "days");

          const weeklyBookings = data.data.filter((booking) => {
            const bookingTime = moment.parseZone(booking.scheduled_time);
            return (
              bookingTime.isBetween(weekAgo, now) &&
              ["pending", "accepted", "completed"].includes(
                booking.session_status
              )
            );
          });

          setUserBookingStats({
            weeklyCount: weeklyBookings.length,
            maxAllowed: 3,
          });
        }
      }
    } catch (error) {
      console.error("Error loading user booking stats:", error);
    }
  };

  const loadCoaches = async () => {
    try {
      setInitialLoading(true);
      const response = await fetch("http://localhost:5000/api/coach/list");

      if (!response.ok) {
        throw new Error("Failed to load coaches");
      }

      const data = await response.json();
      if (data.success) {
        // Transform the data to match the expected format
        const transformedCoaches = data.data.map((coach) => ({
          coach_id: coach.coach_id,
          name: coach.full_name,
          specialization: coach.specialization || "Huấn luyện viên bỏ thuốc lá",
          bio:
            coach.bio ||
            "Huấn luyện viên có kinh nghiệm giúp mọi người bỏ thuốc lá",
          rating: 4.5,
          totalSessions: 50,
          email: coach.email,
        }));
        setCoaches(transformedCoaches);
      } else {
        setCoaches([]);
      }
    } catch (error) {
      console.error("Error loading coaches:", error);
      message.error("Không thể tải danh sách huấn luyện viên");
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
  }, [selectedDate, selectedTimeFrame]);

  const loadAvailableSchedules = async () => {
    try {
      const dateStr = selectedDate.format("YYYY-MM-DD");
      const availableCoachesWithSchedules = [];

      for (const coach of coaches) {
        try {
          const response = await fetch(
            `http://localhost:5000/api/schedule/available/${coach.coach_id}`
          );

          if (!response.ok) {
            console.error(
              `Failed to load schedules for coach ${coach.coach_id}`
            );
            continue;
          }

          const data = await response.json();
          const schedules = data || [];

          // Filter schedules for selected date and check time constraints
          const now = moment();
          let daySchedules = schedules.filter((schedule) => {
            const scheduleDate = moment
              .parseZone(schedule.start_time)
              .format("YYYY-MM-DD");
            const scheduleTime = moment.parseZone(schedule.start_time);
            const diffInMinutes = scheduleTime.diff(now, "minutes");

            return (
              scheduleDate === dateStr &&
              !schedule.is_booked &&
              diffInMinutes >= 60
            ); // Chặn đặt lịch trong vòng 1 tiếng
          });

          // Lọc thêm theo khung giờ nếu có
          if (selectedTimeFrame) {
            daySchedules = daySchedules.filter((schedule) => {
              const hour = moment.parseZone(schedule.start_time).hour();
              
              switch (selectedTimeFrame) {
                case "morning":
                  return hour >= 8 && hour < 12;
                case "afternoon":
                  return hour >= 13 && hour < 17;
                case "evening":
                  return hour >= 18 && hour < 21;
                default:
                  return true;
              }
            });
          }

          if (daySchedules.length > 0) {
            availableCoachesWithSchedules.push({
              ...coach,
              availableSchedules: daySchedules,
            });
          }
        } catch (error) {
          console.error(
            `Error loading schedules for coach ${coach.coach_id}:`,
            error
          );
        }
      }

      setAvailableCoaches(availableCoachesWithSchedules);
    } catch (error) {
      console.error("Error loading available schedules:", error);
      message.error("Không thể tải lịch trình có sẵn");
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };
  
  const handleTimeFrameChange = (value) => {
    setSelectedTimeFrame(value);
  };

  const formatTimeSlot = (schedule) => {
    const startTime = moment.parseZone(schedule.start_time);
    const endTime = moment.parseZone(schedule.end_time);
    const duration = endTime.diff(startTime, "minutes");

    return {
      schedule_id: schedule.schedule_id,
      time: startTime.format("HH:mm"),
      endTime: endTime.format("HH:mm"),
      duration: duration,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
    };
  };

  const handleSelectSlotForBooking = (coach, schedule) => {
    // Kiểm tra giới hạn 3 cuộc hẹn/tuần
    if (userBookingStats.weeklyCount >= userBookingStats.maxAllowed) {
      message.error(
        `Bạn đã đặt ${userBookingStats.weeklyCount} buổi. Chỉ được phép tối đa ${userBookingStats.maxAllowed} buổi tư vấn mỗi tuần.`
      );
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
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/appointment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ schedule_id: selectedSlot.schedule_id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to book appointment");
      }

      message.success(
        "Đặt lịch thành công! Huấn luyện viên sẽ xem xét yêu cầu của bạn."
      );
      setIsModalVisible(false);
      bookingForm.resetFields();
      setSelectedCoach(null);
      setSelectedSlot(null);

      // Reload available schedules and user stats
      loadAvailableSchedules();
      loadUserBookingStats();
    } catch (error) {
      console.error("Error booking appointment:", error);
      message.error(error.message || "Không thể đặt lịch");
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
      <>
        <Navbar />
        <div className="booking-page">
          <div className="booking-loading-container">
            <div className="text-center">
              <div className="loading-icon">
                <Spin size="large" style={{ color: "#52c41a" }} />
              </div>
              <div
                style={{
                  fontSize: 20,
                  color: "#2c3e50",
                  fontWeight: "600",
                  textShadow: "2px 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                📅 Đang tải huấn luyện viên...
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "#7f8c8d",
                  marginTop: 8,
                  fontStyle: "italic",
                }}
              >
                Chuẩn bị danh sách huấn luyện viên cho bạn
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="booking-page">
        <div className="booking-wrapper">
          <div className="booking-container">
            {/* Header Section */}
            <div className="booking-header-section">
              <h1 className="booking-header-title">Đặt lịch huấn luyện</h1>
              <div className="booking-header-badge">
                📅 Hành trình cai nghiện thuốc lá của bạn
              </div>
              <p className="booking-header-subtitle">
                Chọn ngày và thời gian phù hợp để đặt lịch với các huấn luyện viên chuyên nghiệp. Chúng tôi sẽ hỗ trợ bạn trong hành trình cai thuốc lá thành công.
              </p>
            </div>

            {/* Hiển thị thống kê đặt lịch của user */}
            <Alert
              message={`Bạn đã đặt ${userBookingStats.weeklyCount}/${userBookingStats.maxAllowed} buổi tư vấn trong tuần này`}
              type={
                userBookingStats.weeklyCount >= userBookingStats.maxAllowed
                  ? "warning"
                  : "info"
              }
              showIcon
              style={{ marginTop: 16, marginBottom: 16 }}
              icon={<ExclamationCircleOutlined />}
            />

            <Card style={{ marginTop: 24 }}>
              <Row gutter={[24, 24]}>
                {/* Left Side - Date Selection */}
                <Col xs={24} md={8}>
                  <div className="booking-left-panel">
                    <div className="date-selection">
                      <Title level={4}>
                        <CalendarOutlined /> Chọn lịch hẹn
                      </Title>
                      <p className="date-selection-subtitle">Vui lòng chọn ngày và khung giờ để xem các huấn luyện viên có sẵn</p>
                      
                      <div className="date-selection-field">
                        <div className="field-label">Chọn ngày</div>
                        <DatePicker
                          style={{ width: "100%" }}
                          placeholder="Chọn một ngày"
                          onChange={handleDateChange}
                          disabledDate={(current) =>
                            current && current < moment().startOf("day")
                          }
                        />
                      </div>
                      
                      <div className="time-selection-field">
                        <div className="field-label">Chọn khung giờ</div>
                        <Select
                          placeholder="Tất cả khung giờ"
                          style={{ width: "100%" }}
                          disabled={!selectedDate}
                          onChange={handleTimeFrameChange}
                          allowClear
                        >
                          <Option value="morning">Buổi sáng (8:00 - 12:00)</Option>
                          <Option value="afternoon">Buổi chiều (13:00 - 17:00)</Option>
                          <Option value="evening">Buổi tối (18:00 - 21:00)</Option>
                        </Select>
                      </div>
                    </div>
                  </div>
                </Col>

                {/* Right Side - Available Coaches */}
                <Col xs={24} md={16}>
                  <div className="coaches-section">
                    <Title level={4}>
                      <UserOutlined /> Huấn luyện viên có sẵn
                    </Title>
                    <div className="coach-availability-subtitle">
                      {selectedDate ? 
                        `${availableCoaches.length} huấn luyện viên đang có sẵn vào ngày ${selectedDate.format('DD/MM/YYYY')}` : 
                        'Vui lòng chọn ngày ở bên trái để xem các huấn luyện viên có sẵn'}
                    </div>
                    
                    {selectedDate ? (
                      availableCoaches.length > 0 ? (
                        <div className="coach-list">
                          {availableCoaches.map((coach) => (
                            <Card className="coach-card-horizontal" key={coach.coach_id}>
                              <div className="coach-card-content">
                                <div className="coach-card-left">
                                  <Avatar
                                    size={80}
                                    icon={<UserOutlined />}
                                    style={{ backgroundColor: "#189c38" }}
                                  />
                                </div>
                                <div className="coach-card-middle">
                                  <div className="coach-name">{coach.name}</div>
                                  <div className="coach-specialization">{coach.specialization}</div>
                                </div>
                                <div className="coach-card-right">
                                  <div className="coach-slot-info">
                                    <div className="slot-title">
                                      <ClockCircleOutlined /> Slot tiếp theo:
                                    </div>
                                    <div className="available-slots">
                                      {coach.availableSchedules.map((schedule) => {
                                        const slot = formatTimeSlot(schedule);
                                        const isDisabled =
                                          userBookingStats.weeklyCount >=
                                          userBookingStats.maxAllowed;
                                        return (
                                          <Button
                                            key={schedule.schedule_id}
                                            type="primary"
                                            disabled={isDisabled}
                                            onClick={() =>
                                              handleSelectSlotForBooking(
                                                coach,
                                                schedule
                                              )
                                            }
                                            style={{
                                              margin: "4px",
                                              background: isDisabled
                                                ? "#d9d9d9"
                                                : "#52c41a",
                                              borderColor: isDisabled
                                                ? "#d9d9d9"
                                                : "#52c41a",
                                              borderRadius: 8,
                                            }}
                                          >
                                            {slot.time} - {slot.endTime}
                                          </Button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div
                          className="no-availability"
                          style={{ textAlign: "center", margin: "32px 0" }}
                        >
                          <Text type="secondary">
                            Không có huấn luyện viên nào có sẵn cho ngày đã chọn.
                            Vui lòng thử ngày khác.
                          </Text>
                        </div>
                      )
                    ) : (
                      <div
                        className="select-date-prompt"
                        style={{ textAlign: "center", margin: "32px 0" }}
                      >
                        <Text type="secondary">
                          Vui lòng chọn ngày ở bên trái để xem danh sách huấn luyện viên và khung giờ có sẵn.
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
            title="Xác nhận đặt lịch hẹn"
            visible={isModalVisible}
            onCancel={handleCancel}
            onSubmit={handleBookingSubmit}
            form={bookingForm}
            loading={loading}
            width={650}
            okText="Đặt lịch ngay"
            cancelText="Hủy"
          >
            {selectedCoach && selectedSlot && (
              <>
                <div className="booking-modal-content">
                  <div className="booking-modal-header">
                    <div className="booking-modal-title">Buổi tư vấn với huấn luyện viên</div>
                    <div className="booking-modal-subtitle">Vui lòng xác nhận thông tin đặt lịch của bạn</div>
                  </div>
                  
                  <div className="booking-modal-coach-info">
                    <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: "#189c38" }} />
                    <div className="booking-modal-coach-details">
                      <div className="booking-modal-coach-name">{selectedCoach.name}</div>
                      <div className="booking-modal-coach-specialization">{selectedCoach.specialization}</div>
                    </div>
                  </div>

                  <div className="booking-modal-details">
                    <div className="booking-modal-details-title">Chi tiết buổi tư vấn</div>
                    <div className="booking-modal-details-grid">
                      <div className="booking-modal-details-item">
                        <div className="booking-modal-details-label">Ngày</div>
                        <div className="booking-modal-details-value">
                          <CalendarOutlined /> {selectedDate?.format("DD/MM/YYYY")}
                        </div>
                      </div>
                      <div className="booking-modal-details-item">
                        <div className="booking-modal-details-label">Thời gian</div>
                        <div className="booking-modal-details-value">
                          <ClockCircleOutlined /> {selectedSlot.time} - {selectedSlot.endTime}
                        </div>
                      </div>
                      <div className="booking-modal-details-item">
                        <div className="booking-modal-details-label">Thời lượng</div>
                        <div className="booking-modal-details-value">{selectedSlot.duration} phút</div>
                      </div>
                    </div>
                  </div>

                  <Form.Item name="notes" label="Ghi chú bổ sung (Tùy chọn)">
                    <Input.TextArea
                      rows={3}
                      placeholder="Bất kỳ mối quan tâm cụ thể hoặc chủ đề nào bạn muốn thảo luận..."
                    />
                  </Form.Item>
                </div>
              </>
            )}
          </FormModal>
        </div>
      </div>
    </>
  );
};

export default BookingPage;
