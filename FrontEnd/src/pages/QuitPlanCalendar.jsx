import React, { useState, useEffect, useMemo } from "react";
import {
  DatePicker,
  InputNumber,
  Select,
  Table,
  Typography,
  Input,
  Button,
  Tooltip,
  Badge,
  Progress,
  Alert,
  Tag,
  Divider,
  Card,
  Empty,
  Popover,
  Row,
  Col,
  message,
  Spin,
} from "antd";
import {
  CalendarOutlined,
  CheckCircleTwoTone,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "./QuitPlanCalendar.css";
import PlanSetupModal from "../pages/PlanSetupModal";
import axios from "axios";

const { Title } = Typography;

const PHASES = [
  { phase: "Giai đoạn 1", range: [0, 20], goal: "Nhận diện – Giảm nhẹ liều" },
  { phase: "Giai đoạn 2", range: [20, 40], goal: "Cắt giảm quyết liệt" },
  { phase: "Giai đoạn 3", range: [40, 60], goal: "Còn hút ít, chuẩn bị cai" },
  {
    phase: "Giai đoạn 4",
    range: [60, 80],
    goal: "Cai hoàn toàn – vẫn khó chịu",
  },
  {
    phase: "Giai đoạn 5",
    range: [80, 100],
    goal: "Củng cố, không hút trở lại",
  },
];

const BEHAVIOR_PLAN = [
  {
    time: "7h",
    behavior: "Cơn thèm do phản xạ",
    replacement: "Uống nước + đi bộ",
  },
  { time: "8h", behavior: "Sau ăn sáng", replacement: "Thiền hoặc kẹo bạc hà" },
  { time: "10h", behavior: "Căng thẳng nhẹ", replacement: "Kẹo không đường" },
  { time: "12h", behavior: "Sau ăn trưa", replacement: "Trái cây/di chuyển" },
  { time: "14h", behavior: "Buồn ngủ", replacement: "Nghe nhạc, giãn cơ" },
  { time: "16h", behavior: "Stress", replacement: "Thở 4-7-8, vươn vai" },
  { time: "18h", behavior: "Trước ăn tối", replacement: "Đi dạo nhanh" },
  { time: "20h", behavior: "Sau ăn tối", replacement: "Trà, đọc sách" },
  { time: "22h", behavior: "Trống trải", replacement: "Ghi nhật ký" },
];

const generateWeeklyQuota = (months, level) => {
  const totalWeeks = Math.round(months * 4.3);
  const startingQuota = { light: 35, medium: 70, heavy: 119 };
  const start = startingQuota[level];
  const step = start / totalWeeks;
  return Array.from({ length: totalWeeks }, (_, i) => ({
    week: i + 1,
    maxCigs: Math.round(Math.max(0, start - step * i)),
  }));
};

const distributeDailyQuota = (weeklyCigs) => {
  const basePattern = [14, 13, 12, 11, 9, 6, 5];
  const baseTotal = basePattern.reduce((a, b) => a + b, 0);
  return basePattern.map((val) => Math.round((val / baseTotal) * weeklyCigs));
};

const QuitPlan = () => {
  const [startDate, setStartDate] = useState(null);
  const [months, setMonths] = useState(null);
  const [showModal, setShowModal] = useState(true);
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState("week");
  const [smokingLog, setSmokingLog] = useState({});
  const [weeklyUsage, setWeeklyUsage] = useState({});
  const [currentWeekPage, setCurrentWeekPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) return;
    setUser(storedUser);
    axios
      .get(`http://localhost:5000/api/quitplan/exists/${storedUser.id}`)
      .then((res) => {
        if (res.data.hasPlan) {
          setStartDate(dayjs(res.data.start_date));
          setMonths(res.data.quit_months);
          setShowModal(false);
        } else {
          setShowModal(true);
        }
      })
      .catch((err) => {
        console.error("Lỗi kiểm tra kế hoạch:", err);
        message.error("Không thể kiểm tra kế hoạch");
      });
  }, []);
  const handlePlanReady = ({ startDate, months }) => {
    setStartDate(dayjs(startDate));
    setMonths(months);
    setShowModal(false);
  };

  const handleResetPlan = async () => {
    try {
      await axios.post("http://localhost:5000/api/quitplan/reset", {
        user_id: user.id,
      });
      message.success("Đã đặt lại kế hoạch");
      setShowModal(true);
    } catch (err) {
      console.error("Lỗi reset kế hoạch:", err);
      message.error("Không thể đặt lại kế hoạch");
    }
  };

  const totalDays = months ? months * 30 : 0;
  const level = "medium";
  const weeklyQuota = useMemo(
    () => generateWeeklyQuota(months, level),
    [months, level]
  );
  const getRemainingCigs = (
    dateStr,
    weeklyQuota,
    log = smokingLog,
    excludeCurrent = false
  ) => {
    const date = dayjs(dateStr, "DD/MM/YYYY");
    const weekIndex = Math.floor(date.diff(startDate, "day") / 7);
    const weekData = Object.entries(log).filter(([key]) => {
      const d = dayjs(key, "DD/MM/YYYY");
      const wi = Math.floor(d.diff(startDate, "day") / 7);
      return wi === weekIndex && (!excludeCurrent || key !== dateStr);
    });
    const used = weekData.reduce((sum, [, val]) => sum + Number(val || 0), 0);
    const quota = weeklyQuota[weekIndex]?.maxCigs || 0;
    return Math.max(0, quota - used);
  };

  // Sau đó mới khai báo planData
  const planData = useMemo(() => {
    if (!startDate || !months) return [];
    const data = [];
    for (let i = 0; i < totalDays; i++) {
      const currentDate = startDate.add(i, "day");
      const formattedDate = currentDate.format("DD/MM/YYYY");
      const progress = Math.round((i / (totalDays - 1)) * 100);
      const phase = PHASES.find(
        ({ range }) => progress >= range[0] && progress <= range[1]
      );
      const weekIndex = Math.floor(i / 7);
      const weeklyCigs = weeklyQuota[weekIndex]?.maxCigs || 0;
      const dailyPattern = distributeDailyQuota(weeklyCigs);
      const dailyQuota = dailyPattern[i % 7] || 0;
      const label =
        viewMode === "month"
          ? `Tháng ${Math.floor(i / 30) + 1} – Ngày ${(i % 30) + 1}`
          : `Tuần ${weekIndex + 1} – Ngày ${i - weekIndex * 7 + 1}`;
      data.push({
        key: i,
        date: formattedDate,
        rawDate: currentDate.toISOString(),
        progress: `${progress}%`,
        phase: `${phase.phase} – ${phase.goal}`,
        suggestedCigs: dailyQuota,
        actualCigs: smokingLog[formattedDate] || "",
        remainingCigs: getRemainingCigs(formattedDate, weeklyQuota, smokingLog),
        weekIndex,
        weekDayLabel: label,
        detailPlan: BEHAVIOR_PLAN,
      });
    }
    return data;
  }, [startDate, months, viewMode, smokingLog, weeklyUsage]);

  const updateWeeklyCigUsage = (dateStr, value) => {
    const date = dayjs(dateStr, "DD/MM/YYYY");
    const weekIndex = Math.floor(date.diff(startDate, "day") / 7);
    setWeeklyUsage((prev) => {
      const currentWeek = prev[weekIndex] || {};
      return { ...prev, [weekIndex]: { ...currentWeek, [dateStr]: value } };
    });
  };

  const columns = [
    {
      title: "Ngày kế hoạch",
      dataIndex: "weekDayLabel",
      key: "weekDayLabel",
      render: (text) => (
        <Tag color="geekblue" style={{ fontWeight: 600 }}>
          {text}
        </Tag>
      ),
    },
    { title: "Ngày", dataIndex: "date", key: "date" },
    {
      title: "Tiến trình",
      dataIndex: "progress",
      key: "progress",
      render: (val) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            justifyContent: "center",
          }}
        >
          <Progress
            type="circle"
            percent={parseInt(val)}
            size="small"
            strokeColor="#52c41a"
            format={(p) => <span style={{ fontSize: 12 }}>{p}%</span>}
          />
          {parseInt(val) === 100 && (
            <CheckCircleTwoTone
              twoToneColor="#52c41a"
              style={{ fontSize: 20 }}
            />
          )}
        </div>
      ),
    },
    {
      title: "Giai đoạn",
      dataIndex: "phase",
      key: "phase",
      render: (val) => {
        let color = "blue";
        if (val.includes("quyết liệt")) color = "orange";
        if (val.includes("chuẩn bị cai")) color = "purple";
        if (val.includes("hoàn toàn")) color = "red";
        if (val.includes("Củng cố")) color = "green";
        return <Tag color={color}>{val}</Tag>;
      },
    },
    {
      title: "Gợi ý",
      dataIndex: "suggestedCigs",
      key: "suggestedCigs",
      render: (val, record) => (
        <Popover
          title="Chi tiết hành vi thay thế"
          content={
            <div>
              {record.detailPlan.map((item, idx) => (
                <div key={idx} style={{ marginBottom: 4 }}>
                  <b>{item.time}:</b> {item.behavior} <br />
                  <span style={{ color: "#52c41a" }}>{item.replacement}</span>
                </div>
              ))}
            </div>
          }
          trigger="hover"
        >
          <Button size="small" icon={<InfoCircleOutlined />}>
            Gợi ý: {val} điếu
          </Button>
        </Popover>
      ),
    },
    {
      title: "Bạn hút",
      dataIndex: "date",
      key: "actualCigs",
      render: (date, record) => {
        const value = smokingLog[date] || 0;
        const suggested = record.suggestedCigs;
        const isOverLimit = value > suggested;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Tooltip
              title={
                isOverLimit
                  ? `Vượt quá gợi ý (${suggested} điếu)`
                  : "Nhập số điếu bạn đã hút"
              }
            >
              <InputNumber
                min={0}
                value={value}
                style={{
                  width: 70,
                  borderColor: isOverLimit ? "red" : undefined,
                  background: isOverLimit ? "#fff1f0" : undefined,
                }}
                onChange={(val) => {
                  setSmokingLog((prev) => ({ ...prev, [date]: val }));
                  updateWeeklyCigUsage(date, val);
                }}
              />
            </Tooltip>
            <Button
              size="small"
              type="link"
              onClick={() => {
                setSmokingLog((prev) => ({ ...prev, [date]: suggested }));
                updateWeeklyCigUsage(date, suggested);
              }}
              style={{ padding: 0 }}
            >
              Theo gợi ý
            </Button>
          </div>
        );
      },
    },
    {
      title: "Còn lại",
      dataIndex: "remainingCigs",
      key: "remainingCigs",
      render: (val, record) => {
        let color = "green";
        if (val <= 10) color = "orange";
        if (val <= 3) color = "red";
        const weekQuota = weeklyQuota[record.weekIndex]?.maxCigs || 0;
        const used = weekQuota - val;
        return (
          <Tooltip title={`Còn lại trong tuần này`}>
            <Badge
              count={val}
              style={{ backgroundColor: color, marginRight: 8 }}
              showZero
            />
            <Progress
              percent={weekQuota ? Math.round((used / weekQuota) * 100) : 0}
              size="small"
              status={val === 0 ? "exception" : "active"}
              style={{ width: 60, display: "inline-block" }}
              showInfo={false}
            />
            <span style={{ marginLeft: 8, color }}>{val} điếu</span>
          </Tooltip>
        );
      },
    },
  ];

  const weekPageSize = 7; // Số ngày trong 1 tuần
  const weekTotal = weeklyQuota.length; // Tổng số tuần dựa trên weeklyQuota

  if (showModal && user) {
    return (
      <PlanSetupModal
        userId={user.id}
        onPlanReady={handlePlanReady}
        onResetPlan={handleResetPlan}
      />
    );
  }

  if (!startDate || !months)
    return <Spin fullscreen tip="Đang tải kế hoạch..." />;

  return (
    <div
      className="quit-plan-wrapper"
      style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}
    >
      <Row justify="center">
        <Col xs={24} md={22} lg={20}>
          <Card variant="outlined" hoverable style={{ marginBottom: 24 }}>
            <Title level={3} style={{ marginBottom: 0, textAlign: "center" }}>
              <CalendarOutlined style={{ marginRight: 8 }} /> Kế hoạch cai
              nghiện thuốc lá
            </Title>
            <Divider style={{ margin: "12px 0" }} />
            <Alert
              message={
                <span style={{ fontWeight: 500 }}>
                  Mức độ nghiện hiện tại: Trung bình
                </span>
              }
              description={
                <span>
                  <b>Hãy tuân thủ kế hoạch</b> để đạt hiệu quả tốt nhất!
                  <Tag color="success" style={{ marginLeft: 8 }}>
                    Đang thực hiện
                  </Tag>
                </span>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16, textAlign: "center" }}
            />
            <div
              className="quit-plan-controls"
              style={{
                marginBottom: 16,
                display: "flex",
                gap: 12,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  background: "#f5f7fa",
                  borderRadius: 8,
                  padding: "12px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  fontWeight: 600,
                  fontSize: 18,
                }}
              >
                <span>
                  <span style={{ color: "#888" }}>Ngày bắt đầu:</span>{" "}
                  <span style={{ color: "#1890ff" }}>
                    {startDate?.format("YYYY-MM-DD")}
                  </span>
                </span>
                <span>
                  <span style={{ color: "#888" }}>Thời gian:</span>{" "}
                  <span style={{ color: "#52c41a" }}>{months} tháng</span>
                </span>
              </div>
              <Select
                value={viewMode}
                onChange={(val) => {
                  setViewMode(val);
                  setCurrentWeekPage(1);
                }}
                options={[
                  { label: "Xem theo tuần", value: "week" },
                  { label: "Xem theo tháng", value: "month" },
                ]}
                size="large"
                style={{
                  height: 48,
                  minWidth: 160,
                  fontWeight: 600,
                  fontSize: 16,
                  borderRadius: 8,
                  background: "#fff",
                }}
              />
              <Button
                danger
                onClick={handleResetPlan}
                style={{
                  height: 48,
                  fontWeight: 600,
                  fontSize: 16,
                  borderRadius: 8,
                  marginLeft: 8,
                }}
                size="large"
              >
                Đặt lại kế hoạch
              </Button>
            </div>
          </Card>

          <Card variant="outlined">
            <Divider orientation="left" plain>
              <Tag color="blue" style={{ fontSize: 16 }}>
                Bảng kế hoạch chi tiết
              </Tag>
            </Divider>
            <Table
              columns={columns}
              dataSource={planData}
              pagination={
                viewMode === "week"
                  ? {
                      current: currentWeekPage,
                      pageSize: weekPageSize,
                      total: planData.length,
                      showSizeChanger: false,
                      onChange: (page) => setCurrentWeekPage(page),
                      showTotal: () => `Tuần ${currentWeekPage} / ${weekTotal}`,
                    }
                  : { pageSize: 30 }
              }
              rowClassName={(record) => `week-row-${record.weekIndex % 5}`}
              locale={{
                emptyText: <Empty description="Không có dữ liệu kế hoạch" />,
              }}
              onRow={(record) => ({
                onClick: (e) => {
                  // Nếu click vào input, button, select thì không chuyển trang
                  if (
                    e.target.closest("input") ||
                    e.target.closest("button") ||
                    e.target.closest(".ant-input-number") ||
                    e.target.closest(".ant-select")
                  ) {
                    return;
                  }
                  navigate(
                    `/quit-plan-detail/${record.date.replaceAll("/", "-")}`,
                    { state: record }
                  );
                },
              })}
              style={{ background: "#fff" }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default QuitPlan;
