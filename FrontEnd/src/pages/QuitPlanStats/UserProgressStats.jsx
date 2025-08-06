import React, { useEffect, useState } from "react";
import {
  Tabs,
  Card,
  Typography,
  Spin,
  message,
  Progress,
  InputNumber,
  Button,
} from "antd";
import {
  DollarOutlined,
  CalendarOutlined,
  FireOutlined,
  TrophyOutlined,
  HeartOutlined,
  GiftOutlined,
} from "@ant-design/icons";
import axios from "axios";
import Navbar from "../../layouts/Navbar";
import "./UserProgressStats.css";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const UserProgressStats = () => {
  const [activeTab, setActiveTab] = useState("1");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadedTabs, setLoadedTabs] = useState({});
  const [stats, setStats] = useState({
    savings: {},
    achievements: [],
  });
  const [progressSummary, setProgressSummary] = useState({
    avoidedCigarettes: 0,
    smokeFreeDays: 0,
  });

  // Thêm state để lưu số tiền tiết kiệm đến thời điểm hiện tại
  const [savedMoneyNow, setSavedMoneyNow] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [percentOfDay, setPercentOfDay] = useState(0);
  const [pricePerCigarette, setPricePerCigarette] = useState();
  const [updatingPrice, setUpdatingPrice] = useState(false);
  const [todaySavings, setTodaySavings] = useState(0);

  const fetchSavings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/user/savings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats((prev) => ({ ...prev, savings: res.data }));
      setLoadedTabs((prev) => ({ ...prev, 1: true }));
    } catch (err) {
      console.error("❌ Lỗi tải tiết kiệm:", err);
      message.error("Không thể tải dữ liệu tiết kiệm");
    }
  };

  const fetchAchievements = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/user/achievements", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats((prev) => ({
        ...prev,
        achievements: res.data.achievements || [],
      }));
      setLoadedTabs((prev) => ({ ...prev, 2: true }));
    } catch (err) {
      console.error("❌ Lỗi tải thành tựu:", err);
      message.error("Không thể tải dữ liệu thành tựu");
    }
  };

  const fetchProgressSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/user/progress-summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProgressSummary(res.data);
    } catch (err) {
      console.error("❌ Lỗi lấy tiến trình bỏ thuốc:", err);
      message.error("Không thể tải tiến trình bỏ thuốc");
    }
  };

  const fetchTodaySavings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/user/saving-per-day", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodaySavings(res.data.amount || 0);
    } catch (err) {
      setTodaySavings(0);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (loadedTabs[activeTab]) return;

      setLoading(true);
      if (activeTab === "1") {
        await fetchSavings();
        await fetchProgressSummary();
        await fetchTodaySavings(); // Thêm dòng này
      }
      if (activeTab === "2") await fetchAchievements();
      setLoading(false);
      setInitialLoading(false);
    };

    fetchData();
  }, [activeTab, loadedTabs]);

  useEffect(() => {
    let interval;
    if (stats.savings.amount) {
      interval = setInterval(() => {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const second = now.getSeconds();
        const currentHour = hour + minute / 60 + second / 3600;
        const saved = stats.savings.amount * (currentHour / 24);
        setSavedMoneyNow(saved);

        // Hiển thị giờ hiện tại
        setCurrentTimeStr(
          `${hour.toString().padStart(2, "0")}:${minute
            .toString()
            .padStart(2, "0")}:${second.toString().padStart(2, "0")}`
        );
        // Tính phần trăm thời gian đã qua trong ngày
        setPercentOfDay(Math.round((currentHour / 24) * 100));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stats.savings.amount]);

  const handleUpdatePrice = async () => {
    setUpdatingPrice(true);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));
      const user_id = user?.id;
      if (!user_id) {
        message.error("Không tìm thấy user_id!");
        setUpdatingPrice(false);
        return;
      }

      await axios.post(
        "/api/ftnd/updatePricePerCigarette",
        { user_id, pricePerCigarette: pricePerCigarette * 1000 }, // nhân 1000
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Cập nhật giá tiền thành công!");
      fetchSavings();
    } catch (err) {
      message.error("Cập nhật giá tiền thất bại!");
    }
    setUpdatingPrice(false);
  };

  const { savings, achievements } = stats;

  if (initialLoading) {
    return (
      <>
        <Navbar />
        <div className="user-progress-page">
          <div className="user-progress-loading-container">
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
                📊 Đang tải tiến trình...
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "#7f8c8d",
                  marginTop: 8,
                  fontStyle: "italic",
                }}
              >
                Chuẩn bị thống kê bỏ thuốc cho bạn
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
      <div className="user-progress-page">
        <div className="user-progress-wrapper">
          <div className="user-progress-container">
            {/* Header Section */}
            <div className="user-progress-header-section">
              <h1 className="user-progress-header-title">
                Tiến trình bỏ thuốc
              </h1>
              <div className="user-progress-header-badge">
                📊 Theo dõi hành trình của bạn
              </div>
              <p className="user-progress-header-subtitle">
                Xem tiến trình bỏ thuốc, số tiền tiết kiệm được và các thành tựu
                đã đạt được trong hành trình cai nghiện của bạn.
              </p>
            </div>

            <Card className="user-progress-tabs">
              <Tabs
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key)}
                centered
              >
                <TabPane
                  tab={
                    <span>
                      <DollarOutlined /> Tiết kiệm
                    </span>
                  }
                  key="1"
                >
                  <div className="user-progress-tab-content">
                    {loading ? (
                      <div style={{ textAlign: "center", padding: "60px 0" }}>
                        <Spin size="large" />
                        <div style={{ marginTop: 16, color: "#666" }}>
                          Đang tải dữ liệu...
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="savings-stats-container">
                          <div className="savings-stat-card">
                            <DollarOutlined
                              className="savings-stat-icon"
                              style={{ color: "#52c41a" }}
                            />
                            <div className="savings-stat-value">
                              {savings.amount
                                ? savings.amount.toLocaleString()
                                : "0"}{" "}
                              VND
                            </div>
                            <div className="savings-stat-label">
                              Số tiền tiết kiệm cho đến hết ngày hôm nay
                            </div>
                          </div>

                          <div className="savings-stat-card">
                            <CalendarOutlined
                              className="savings-stat-icon"
                              style={{ color: "#1890ff" }}
                            />
                            <div className="savings-stat-value">
                              {progressSummary.smokeFreeDays || 0}
                            </div>
                            <div className="savings-stat-label">
                              Ngày không hút thuốc
                            </div>
                          </div>

                          <div className="savings-stat-card">
                            <FireOutlined
                              className="savings-stat-icon"
                              style={{ color: "#faad14" }}
                            />
                            <div className="savings-stat-value">
                              {progressSummary.avoidedCigarettes || 0}
                            </div>
                            <div className="savings-stat-label">
                              Điếu thuốc đã tránh
                            </div>
                          </div>
                        </div>

                        {/* Thêm thanh tiến độ tiết kiệm hôm nay và giờ hiện tại */}
                        <div style={{ width: "100%", margin: "24px 0" }}>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>
                            Tiết kiệm hôm nay (tính đến {currentTimeStr}):
                          </div>
                          <Progress
                            percent={percentOfDay}
                            format={() =>
                              `${savedMoneyNow.toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })} VND`
                            }
                            strokeColor={{
                              from: "#1890ff",
                              to: "#52c41a",
                            }}
                            strokeWidth={24}
                            showInfo={true}
                            status="active"
                          />
                          <div
                            style={{
                              fontSize: 12,
                              color: "#888",
                              marginTop: 4,
                            }}
                          >
                            Số tiền bạn đã tiết kiệm được hôm nay:{" "}
                            <span style={{ color: "#52c41a", fontWeight: 600 }}>
                              {todaySavings.toLocaleString()} VND
                            </span>
                          </div>
                        </div>

                        <div className="savings-summary-card">
                          <div className="savings-summary-title">
                            <HeartOutlined /> Thông tin bổ sung
                          </div>
                          <div className="savings-summary-text">
                            <strong>Ngày bắt đầu cai:</strong>{" "}
                            {savings.startDate
                              ? dayjs(savings.startDate).format("DD/MM/YYYY")
                              : "Chưa cập nhật"}
                            <br />
                            <br />
                            Chúc mừng bạn đã kiên trì trong hành trình bỏ thuốc
                            lá! Mỗi ngày bạn không hút thuốc là một chiến thắng
                            lớn cho sức khỏe và tài chính của bạn.
                            <br />
                            <br />
                            <strong>💡 Bạn có biết?</strong> Sau 20 phút không
                            hút thuốc, nhịp tim và huyết áp của bạn đã bắt đầu
                            giảm xuống mức bình thường.
                          </div>
                        </div>

                        {/* Thêm ô nhập giá tiền mỗi điếu thuốc */}
                        <div style={{ margin: "24px 0" }}>
                          <div style={{ marginBottom: 8, fontWeight: 600 }}>
                            Tiền mỗi điếu thuốc bạn hút (x 1000 VNĐ)
                          </div>
                          <InputNumber
                            min={1}
                            step={1}
                            value={pricePerCigarette}
                            onChange={setPricePerCigarette}
                            placeholder="Nhập số, mỗi đơn vị là 1000 VNĐ"
                            style={{ marginRight: 8, width: 280 }}
                          />
                          <Button
                            type="primary"
                            loading={updatingPrice}
                            onClick={handleUpdatePrice}
                            disabled={!pricePerCigarette}
                          >
                            Cập nhật
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </TabPane>

                <TabPane
                  tab={
                    <span>
                      <TrophyOutlined /> Thành tựu
                    </span>
                  }
                  key="2"
                >
                  <div className="user-progress-tab-content">
                    {loading ? (
                      <div style={{ textAlign: "center", padding: "60px 0" }}>
                        <Spin size="large" />
                        <div style={{ marginTop: 16, color: "#666" }}>
                          Đang tải dữ liệu...
                        </div>
                      </div>
                    ) : (
                      <>
                        {achievements.length > 0 ? (
                          <div className="achievements-container">
                            {achievements.map((achievement, index) => (
                              <div key={index} className="achievement-card">
                                <div className="achievement-content">
                                  <div className="achievement-title">
                                    {achievement.title}
                                  </div>
                                  <div className="achievement-description">
                                    {achievement.description}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="no-achievements">
                            <GiftOutlined className="no-achievements-icon" />
                            <div className="no-achievements-text">
                              Bạn chưa có thành tựu nào. Hãy tiếp tục cố gắng!
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </TabPane>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProgressStats;
