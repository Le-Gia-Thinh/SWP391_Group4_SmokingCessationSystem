import React, { useState, useEffect } from "react";
import {
  Typography,
  Card,
  Radio,
  Button,
  Spin,
  message,
  Descriptions,
  Table,
  Space,
} from "antd";
import {
  CheckCircleTwoTone,
  CreditCardOutlined,
  CalendarOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import Navbar from "../../layouts/Navbar";
import "./CheckoutPage.css";

const { Title, Paragraph } = Typography;
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("buy");

  // --- Mua gói state ---
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // --- Thông tin gói state ---
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [remainingDays, setRemainingDays] = useState(null);

  // --- Lịch sử mua gói state ---
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const [currentSub, setCurrentSub] = useState(null);

  // 1. state để lưu countdown
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // 2. hàm tính timeLeft dựa trên currentSub.end_date
  const calculateTimeLeft = () => {
    if (!currentSub?.end_date) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    const now = dayjs();
    const end = dayjs(currentSub.end_date);
    const diff = end.diff(now);
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    const msPerDay = 24 * 60 * 60 * 1000;
    const msPerHour = 60 * 60 * 1000;
    const msPerMinute = 60 * 1000;

    const days = Math.floor(diff / msPerDay);
    const hours = Math.floor((diff % msPerDay) / msPerHour);
    const minutes = Math.floor((diff % msPerHour) / msPerMinute);
    const seconds = Math.floor((diff % msPerMinute) / 1000);

    return { days, hours, minutes, seconds };
  };

  // 3. useEffect khởi tạo timer khi đã có currentSub
  useEffect(() => {
    if (!currentSub) return;
    // ngay lập tức tính 1 lượt, rồi đặt interval
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [currentSub]);
  // Fetch packages
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await axios.get(
          `${baseURL}/api/subscriptions/packages`
        );
        if (response.data) {
          setPackages(response.data);
          if (response.data.length > 0) {
            setSelectedPackage(response.data[0].package_id);
          }
        } else {
          throw new Error("Không có dữ liệu packages");
        }
      } catch (error) {
        console.error("Error fetching packages:", error);
        message.error("Không thể tải danh sách gói dịch vụ: " + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);


  // Cập nhật hàm fetchCurrent để không cần gọi fetchRemaining riêng
  const fetchCurrent = async () => {
    setLoadingInfo(true);
    try {
      const res = await axios.get(
        `${baseURL}/api/subscriptions/current`,
        { headers }
      );
      setCurrentSub(res.data.subscription);

      // Nếu có subscription, set remaining days từ response
      if (res.data.subscription) {
        setRemainingDays(res.data.subscription.remaining_days);
      } else {
        setRemainingDays(0);
      }
    } catch (err) {
      console.error('Error fetching current subscription:', err);
      message.error("Không tải được thông tin gói hiện tại");
    } finally {
      setLoadingInfo(false);
    }
  };
  // Fetch history
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(
        `${baseURL}/api/subscriptions/history`,
        { headers }
      );
      const data = res.data.history.map(item => ({
        key: item.subscription_id,
        ...item,
        start_date: dayjs(item.start_date).format("DD/MM/YYYY"),
        end_date: dayjs(item.end_date).format("DD/MM/YYYY"),
        payment_date: dayjs(item.payment_date).format("DD/MM/YYYY HH:mm"),
      }));
      setHistory(data);
    } catch (err) {
      message.error("Không tải được lịch sử mua gói");
    } finally {
      setLoadingHistory(false);
    }
  };

  const historyColumns = [
    { title: "Gói", dataIndex: "package_name" },
    { title: "Ngày thanh toán", dataIndex: "payment_date" },
    {
      title: "Số tiền",
      dataIndex: "paid_amount",
      render: v => v.toLocaleString() + " đ",
    },
    { title: "Mã đơn", dataIndex: "order_code" },
  ];

  const handleContinue = async () => {
    const packageData = packages.find(
      pkg => pkg.package_id === selectedPackage
    );
    if (!packageData) {
      message.error("Vui lòng chọn gói dịch vụ");
      return;
    }
    setProcessing(true);
    try {
      if (!token) {
        message.error("Vui lòng đăng nhập để tiếp tục");
        navigate("/login");
        return;
      }
      const response = await axios.post(
        `${baseURL}/api/payment`,
        {
          packageId: packageData.package_id,
          amount: packageData.price,
          description: `Thanh toán gói ${packageData.package_name}`,
        },
        { headers: { ...headers, "Content-Type": "application/json" } }
      );
      if (response.data.success && response.data.checkoutUrl) {
        localStorage.setItem(
          "pendingOrder",
          JSON.stringify({
            orderCode: response.data.orderCode,
            packageId: packageData.package_id,
            amount: packageData.price,
          })
        );
        window.location.href = response.data.checkoutUrl;
      } else {
        throw new Error(
          response.data.message || "Không nhận được URL thanh toán"
        );
      }
    } catch (error) {
      console.error("❌ Payment error:", error);
      const errorMessage =
        error.response?.data?.message || error.response?.data?.error ||
        error.message;
      message.error(`Lỗi thanh toán: ${errorMessage}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="checkout-page">
        <div className="checkout-wrapper">
          <div className="checkout-content">
            {/* Tab Buttons */}
            <Space style={{ marginBottom: 16 }}>
              <Button
                type={activeTab === "buy" ? "primary" : "default"}
                onClick={() => setActiveTab("buy")}
              >
                <CreditCardOutlined /> Mua gói
              </Button>
              <Button
                type={activeTab === "info" ? "primary" : "default"}
                onClick={() => {
                  setActiveTab("info");
                  if (currentSub === null) {
                    fetchCurrent(); // Chỉ cần gọi fetchCurrent, không cần fetchRemaining
                  }
                }}
              >
                <CalendarOutlined /> Thông tin gói
              </Button>
              <Button
                type={activeTab === "history" ? "primary" : "default"}
                onClick={() => {
                  setActiveTab("history");
                  if (history.length === 0) fetchHistory();
                }}
              >
                <HistoryOutlined /> Lịch sử mua gói
              </Button>
            </Space>

            {/* Mua gói (giữ nguyên) */}
            {activeTab === "buy" && (
              loading ? (
                <>
                  <Navbar />
                  <div className="checkout-page">
                    <div className="loading-container">
                      <div className="text-center">
                        <div className="loading-icon">
                          <Spin size="large" style={{ color: "#52c41a" }} />
                        </div>
                        <div style={{ fontSize: 20, color: "#2c3e50", fontWeight: "600", textShadow: "2px 2px 8px rgba(0,0,0,0.1)" }}>
                          🚭 Đang tải danh sách gói dịch vụ...
                        </div>
                        <div style={{ fontSize: 14, color: "#7f8c8d", marginTop: 8, fontStyle: "italic" }}>
                          Chuẩn bị hành trình cai nghiện thuốc lá cho bạn
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : packages.length === 0 ? (
                <>
                  <Navbar />
                  <div className="checkout-page">
                    <div className="loading-container">
                      <div className="text-center">
                        <div className="loading-icon">
                          <CreditCardOutlined style={{ fontSize: 64, color: "#fff" }} />
                        </div>
                        <Title level={2} style={{ color: "#2c3e50", textShadow: "2px 2px 8px rgba(0,0,0,0.1)", marginBottom: 16 }}>
                          🚭 Không có gói dịch vụ nào
                        </Title>
                        <Paragraph style={{ color: "#7f8c8d", fontSize: 16, marginBottom: 30 }}>
                          Vui lòng liên hệ quản trị viên để được hỗ trợ về các gói dịch vụ cai nghiện thuốc lá.
                        </Paragraph>
                        <Button
                          type="primary"
                          size="large"
                          onClick={() => navigate("/home")}
                          className="continue-button"
                          style={{ background: "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)", borderColor: "#52c41a", borderRadius: 25, padding: "12px 40px", fontSize: 16, fontWeight: "bold", boxShadow: "0 8px 24px rgba(82, 196, 26, 0.4)", height: 50 }}
                        >
                          <i className="bi bi-house me-2"></i> Về trang chủ
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="header-section fade-in">
                    <div className="header-icon d-inline-block p-4 rounded-circle mb-4">
                      <CreditCardOutlined style={{ fontSize: 48, color: "#fff" }} />
                    </div>
                    <h1 className="header-title">Chọn gói dịch vụ</h1>
                    <div className="header-badge">🚭 Hành trình cai nghiện thuốc lá của bạn</div>
                    <p className="header-subtitle">Chọn gói dịch vụ phù hợp để được hỗ trợ tốt nhất trên con đường tự do khỏi thuốc lá</p>
                  </div>
                  <Radio.Group onChange={e => setSelectedPackage(e.target.value)} value={selectedPackage} style={{ width: "100%" }}>
                    <div className="packages-container slide-up">
                      {packages.map((pkg) => (
                        <div key={pkg.package_id} className={`package-card ${selectedPackage === pkg.package_id ? "selected" : ""}`} onClick={() => setSelectedPackage(pkg.package_id)}>
                          {pkg.package_name.includes("1 tháng") && <div className="package-badge popular">PHỔ BIẾN</div>}
                          {pkg.package_name.includes("3 tháng") && <div className="package-badge best">TỐT NHẤT</div>}
                          <div className="package-header">
                            <Radio value={pkg.package_id} style={{ marginBottom: 15 }}><h3 className="package-title">{pkg.package_name}</h3></Radio>
                            <div className="package-price">{pkg.price === 0 ? "Miễn phí" : `${pkg.price.toLocaleString()} đ`}</div>
                            <div className="package-description"><p>{pkg.description}</p></div>
                            <div className="package-duration">⏱️ Thời hạn: {pkg.duration_days} ngày</div>
                          </div>
                          <div className="features-list">
                            {pkg.community_access && <div className="feature-item"><div className="feature-icon"><CalendarOutlined /></div><span>Tự lập kế hoạch cai nghiện</span></div>}
                            {pkg.coach_access && <div className="feature-item"><div className="feature-icon"><i className="bi bi-person-check"></i></div><span>Tư vấn từ huấn luyện viên chuyên nghiệp</span></div>}
                            {pkg.community_access && <div className="feature-item"><div className="feature-icon"><i className="bi bi-people"></i></div><span>Tham gia cộng đồng hỗ trợ</span></div>}
                            {pkg.premium_content && <div className="feature-item"><div className="feature-icon"><i className="bi bi-star"></i></div><span>Nội dung và tài liệu cao cấp</span></div>}
                          </div>
                          {selectedPackage === pkg.package_id && <div className="selection-indicator"><i className="bi bi-check"></i></div>}
                        </div>
                      ))}
                    </div>
                  </Radio.Group>
                  <div className="continue-section fade-in">
                    <Button type="primary" size="large" onClick={handleContinue} disabled={!selectedPackage || processing} loading={processing} className="continue-button">
                      {processing ? (<span><i className="bi bi-hourglass-split me-2"></i>Đang xử lý...</span>) : (<span><i className="bi bi-credit-card me-2"></i>Tiếp tục thanh toán</span>)}
                    </Button>
                    <div className="security-info"><i className="bi bi-shield-check me-2"></i><span>Bảo mật với PayOS - Thanh toán an toàn</span></div>
                    <div className="support-info">💡 Hỗ trợ 24/7 cho hành trình cai nghiện của bạn</div>
                  </div>
                </>
              )
            )}


            {activeTab === "info" && (
              loadingInfo ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin size="large" />
                </div>
              ) : currentSub ? (
                <div>
                  <Descriptions
                    title="Thông tin gói hiện tại"
                    bordered
                    column={1}
                    style={{ background: '#fff', padding: 16, marginBottom: 16 }}
                  >
                    {/* Tên các gói */}
                    <Descriptions.Item label="Các gói đã mua">
                      <div>
                        {currentSub.package_names && currentSub.package_names.length > 0 ? (
                          <div>
                            {currentSub.package_names.map((name, index) => (
                              <span key={index} style={{
                                display: 'inline-block',
                                background: '#f0f0f0',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                marginRight: '8px',
                                marginBottom: '4px'
                              }}>
                                {name}
                              </span>
                            ))}
                            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                              Tổng cộng: {currentSub.package_names.length} gói
                            </div>
                          </div>
                        ) : '—'}
                      </div>
                    </Descriptions.Item>

                    {/* Tổng thời hạn */}
                    <Descriptions.Item label="Tổng thời hạn">
                      <div>
                        <span style={{ fontSize: 16, fontWeight: 'bold', color: '#1890ff' }}>
                          {currentSub.total_days >= 30 ? (
                            <>
                              {Math.floor(currentSub.total_days / 30)} tháng
                              {currentSub.total_days % 30 > 0 && ` ${currentSub.total_days % 30} ngày`}
                            </>
                          ) : (
                            `${currentSub.total_days} ngày`
                          )}
                        </span>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                          ({currentSub.total_days} ngày)
                        </div>
                      </div>
                    </Descriptions.Item>

                    {/* Ngày bắt đầu */}
                    <Descriptions.Item label="Ngày bắt đầu">
                      <div>
                        <span style={{ fontWeight: 'bold' }}>
                          {dayjs(currentSub.start_date).format("DD/MM/YYYY")}
                        </span>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {dayjs(currentSub.start_date).format("dddd, DD/MM/YYYY HH:mm")}
                        </div>
                      </div>
                    </Descriptions.Item>

                    {/* Ngày hết hạn */}
                    <Descriptions.Item label="Ngày hết hạn">
                      <div>
                        <span style={{
                          fontWeight: 'bold',
                          color: dayjs(currentSub.end_date).isAfter(dayjs()) ? '#52c41a' : '#ff4d4f'
                        }}>
                          {dayjs(currentSub.end_date).format("DD/MM/YYYY")}
                        </span>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {dayjs(currentSub.end_date).format("dddd, DD/MM/YYYY HH:mm")}
                        </div>
                      </div>
                    </Descriptions.Item>

                    {/* Số ngày còn lại */}
                    <Descriptions.Item label="Thời gian còn lại">
                      {timeLeft.days > 0 ||
                        timeLeft.hours > 0 ||
                        timeLeft.minutes > 0 ||
                        timeLeft.seconds > 0 ? (
                        <span style={{ fontSize: 16, fontWeight: 'bold', color: '#52c41a' }}>
                          Còn
                          {timeLeft.days > 0 && ` ${timeLeft.days} ngày`}
                          {timeLeft.hours > 0 && ` ${timeLeft.hours} giờ`}
                          {timeLeft.minutes > 0 && ` ${timeLeft.minutes} phút`}
                          {` ${timeLeft.seconds} giây`}
                        </span>
                      ) : (
                        <span style={{ fontSize: 16, fontWeight: 'bold', color: '#ff4d4f' }}>
                          Đã hết hạn
                        </span>
                      )}
                    </Descriptions.Item>


                    {/* Ngày gia hạn cuối cùng */}
                    <Descriptions.Item label="Lần mua gói cuối">
                      <div>
                        {currentSub.last_payment_date ? (
                          <div>
                            <span style={{ fontWeight: 'bold' }}>
                              {dayjs(currentSub.last_payment_date).format("DD/MM/YYYY HH:mm")}
                            </span>
                            <div style={{ fontSize: 12, color: '#666' }}>
                              {dayjs(currentSub.last_payment_date).format("dddd, DD/MM/YYYY HH:mm")}
                            </div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </div>
                    </Descriptions.Item>
                  </Descriptions>


                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ fontSize: 16, color: '#666' }}>
                    Bạn chưa có gói nào hoạt động.
                  </div>
                  <Button
                    type="primary"
                    style={{ marginTop: 16 }}
                    onClick={() => setActiveTab('buy')}
                  >
                    Mua gói ngay
                  </Button>
                </div>
              )
            )}
            {/* Lịch sử mua gói */}
            {activeTab === "history" && (
              loadingHistory ? (
                <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
              ) : (
                <Table dataSource={history} columns={historyColumns} pagination={{ pageSize: 5 }} />
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
