import React, { useEffect, useState, useMemo } from "react";
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
import PlanSetupModal from "./PlanSetupModal";
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

const BEHAVIOR_PLAN_PHASES = [
  // Phase 1: Nhận diện – Giảm nhẹ liều
  [
    {
      time: "7h",
      behavior: "Thèm do phản xạ",
      replacement: "Kẹo nicotine 2mg (NRT) + đi bộ 5 phút",
    },
    {
      time: "8h",
      behavior: "Sau ăn sáng",
      replacement: "Miếng dán nicotine (16–24h)",
    },
    {
      time: "10h",
      behavior: "Căng nhẹ",
      replacement: "Trà thảo mộc + hít sâu 3 lần",
    },
    {
      time: "12h",
      behavior: "Sau ăn trưa",
      replacement: "Đi cầu thang thay vì hút thuốc",
    },
    { time: "14h", behavior: "Buồn ngủ", replacement: "Rửa mặt, đi bộ 3 phút" },
    {
      time: "16h",
      behavior: "Stress",
      replacement: "Gửi tin nhắn cho Coach để xin hướng dẫn",
    },
    {
      time: "18h",
      behavior: "Chờ ăn",
      replacement: "Kẹo ngậm không đường + 1 ly nước lạnh",
    },
    {
      time: "20h",
      behavior: "Sau ăn tối",
      replacement: "Đọc tài liệu bỏ thuốc trong hệ thống",
    },
    {
      time: "22h",
      behavior: "Trống trải",
      replacement: "Ghi nhật ký cảm xúc trong web",
    },
  ],
  // Phase 2: Cắt giảm quyết liệt
  [
    {
      time: "7h",
      behavior: "Thèm sáng",
      replacement: "Kẹo nicotine + thiền 3 phút",
    },
    {
      time: "8h",
      behavior: "Sau ăn sáng",
      replacement: "Miếng dán + viết nhật ký trên hệ thống",
    },
    {
      time: "10h",
      behavior: "Stress nhẹ",
      replacement: "Gửi Coach để hỏi cách kiểm soát cảm xúc",
    },
    {
      time: "12h",
      behavior: "Thèm sau ăn",
      replacement: "Mở khung chat hỏi nhanh Coach",
    },
    {
      time: "14h",
      behavior: "Buồn ngủ",
      replacement: "Tập thể dục nhẹ tại chỗ",
    },
    {
      time: "16h",
      behavior: "Cáu gắt",
      replacement: "Xem bài thở/vươn vai trong hệ thống",
    },
    {
      time: "18h",
      behavior: "Rảnh",
      replacement: "Làm nhiệm vụ trong kế hoạch hệ thống",
    },
    {
      time: "20h",
      behavior: "Sau ăn tối",
      replacement: "Nhắn tin cho Coach chia sẻ cảm giác",
    },
    {
      time: "22h",
      behavior: "Tự trách",
      replacement: "Đọc phản hồi động viên từ Coach",
    },
  ],
  // Phase 3: Chuẩn bị cai hoàn toàn
  [
    {
      time: "7h",
      behavior: "Còn thèm nhẹ",
      replacement: "Xịt nicotine hoặc bài tập thở trong hệ thống",
    },
    {
      time: "8h",
      behavior: "Sau ăn",
      replacement: "Viết lại tiến trình trong nhật ký hệ thống",
    },
    {
      time: "10h",
      behavior: "Stress nhẹ",
      replacement: "Gửi Coach nhờ hướng dẫn ứng phó",
    },
    {
      time: "12h",
      behavior: "Ăn no",
      replacement: "Tìm video hỗ trợ trong thư viện",
    },
    {
      time: "14h",
      behavior: "Mỏi đầu",
      replacement: "Chợp mắt ngắn + nhắn Coach báo tình trạng",
    },
    {
      time: "16h",
      behavior: "Thèm mạnh",
      replacement: "Bấm SOS Coach khẩn cấp nếu hệ thống có",
    },
    {
      time: "18h",
      behavior: "Chán",
      replacement: "Xem lại lý do bỏ thuốc đã ghi",
    },
    {
      time: "20h",
      behavior: "Sau ăn",
      replacement: "Nghe bài âm thanh thư giãn hệ thống cung cấp",
    },
    {
      time: "22h",
      behavior: "Cảm giác thiếu",
      replacement: "Xem lại phản hồi khích lệ từ Coach",
    },
  ],
  // Phase 4: Cai hoàn toàn – vẫn khó chịu
  [
    {
      time: "7h",
      behavior: "Thèm nhẹ",
      replacement: "Miếng dán duy trì hoặc bài thở ứng phó",
    },
    {
      time: "8h",
      behavior: "Sau ăn sáng",
      replacement: "Đánh răng + nhắn tin cảm ơn Coach hỗ trợ",
    },
    {
      time: "10h",
      behavior: "Lo lắng",
      replacement: "Gọi Coach video (nếu có) hoặc chat trực tiếp",
    },
    {
      time: "12h",
      behavior: "Ăn xong",
      replacement: "Gửi báo cáo cảm xúc cho Coach",
    },
    {
      time: "14h",
      behavior: "Mỏi",
      replacement: "Ra ngoài 5 phút hoặc mở app thư giãn",
    },
    {
      time: "16h",
      behavior: "Căng thẳng",
      replacement: "Coach hướng dẫn bài tập 3 bước chống tái nghiện",
    },
    {
      time: "18h",
      behavior: "Muốn thư giãn",
      replacement: "Xem video hướng dẫn thư giãn do Coach gửi",
    },
    {
      time: "20h",
      behavior: "Trống trải",
      replacement: "Trò chuyện lại nhật ký & Coach đọc phản hồi",
    },
    {
      time: "22h",
      behavior: "Mất ngủ",
      replacement: "Nghe podcast Coach gợi ý trước khi ngủ",
    },
  ],
  // Phase 5: Củng cố không tái nghiện
  [
    {
      time: "7h",
      behavior: "Thói quen cũ",
      replacement: "Mở app Coach & đọc lại mục tiêu đặt ra",
    },
    {
      time: "8h",
      behavior: "Gặp người hút",
      replacement: "Gửi Coach chia sẻ tình huống khó",
    },
    {
      time: "10h",
      behavior: "Căng đầu",
      replacement: "Xem lời động viên cá nhân Coach đã ghi",
    },
    {
      time: "12h",
      behavior: "Sau ăn",
      replacement: "Hoạt động thay thế: báo lại hệ thống",
    },
    {
      time: "14h",
      behavior: "Thèm nhẹ",
      replacement: "Chơi game kiểm soát cơn thèm (nếu có trong hệ thống)",
    },
    {
      time: "16h",
      behavior: "Bất chợt nhớ",
      replacement: "Mở lại nhật ký Coach từng đọc và phản hồi",
    },
    {
      time: "18h",
      behavior: "Tự thưởng",
      replacement: "Chia sẻ với Coach về việc bạn chọn phần thưởng mới",
    },
    {
      time: "20h",
      behavior: "Cô đơn",
      replacement: "Mở chat Coach và chia sẻ tâm sự",
    },
    {
      time: "22h",
      behavior: "Thèm nhẹ",
      replacement: "Xem báo cáo không hút liên tục của mình",
    },
  ],
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
  const [currentWeekPage, setCurrentWeekPage] = useState(() => {
    const savedPage = sessionStorage.getItem("quitPlanPage");
    return savedPage ? parseInt(savedPage, 10) : 1;
  });
  const [ftndLevel, setFtndLevel] = useState("");
  const navigate = useNavigate();

  // Lấy mức độ nghiện từ API
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.id) {
      setFtndLevel("Không xác định");
      return;
    }

    fetch(`http://localhost:5000/api/customer/ftnd-level/${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setFtndLevel(data.ftnd_level || "Không xác định");
      })
      .catch(() => setFtndLevel("Không xác định"));
  }, []);

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
  const handleSubmitDailyCigs = async () => {
    try {
      const today = dayjs().format("DD/MM/YYYY");
      const user_id = user?.id;
      const total_cigarettes = smokingLog[today] ?? 0;

      if (!user_id || total_cigarettes === undefined) {
        message.warning("Chưa có thông tin người dùng hoặc chưa nhập số điếu.");
        return;
      }

      await axios.post("http://localhost:5000/api/smoking-summary", {
        user_id,
        date: today,
        total_cigarettes,
      });

      message.success("✅ Đã gửi số điếu hút hôm nay!");
    } catch (err) {
      console.error(err);
      message.error("❌ Gửi dữ liệu thất bại.");
    }
  };

  const handleResetPlan = async () => {
    try {
      await axios.post("http://localhost:5000/api/quitplan/reset", {
        user_id: user.id,
      });
      sessionStorage.removeItem("quitPlanPage");
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
        detailPlan: BEHAVIOR_PLAN_PHASES[PHASES.indexOf(phase)],
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

        const isPast = dayjs(date, "DD/MM/YYYY").isBefore(dayjs(), "day");

        return (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Tooltip
              title={
                isPast
                  ? "Không thể sửa dữ liệu ngày trong quá khứ"
                  : isOverLimit
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
                disabled={isPast}
                onChange={(val) => {
                  setSmokingLog((prev) => ({ ...prev, [date]: val }));
                  updateWeeklyCigUsage(date, val);

                  const formatted = dayjs(date, "DD/MM/YYYY").format(
                    "YYYY-MM-DD"
                  );
                  const token = localStorage.getItem("token");

                  fetch("http://localhost:5000/api/smoking-summary/single", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      date: formatted,
                      total_cigarettes: val,
                    }),
                  })
                    .then((res) => res.json())
                    .then((res) => {
                      if (res.success) {
                        message.success("✅ Đã lưu!");
                      } else {
                        message.error("❌ Không thể lưu.");
                      }
                    })
                    .catch((err) => {
                      console.error("Lỗi khi lưu:", err);
                      message.error("❌ Lỗi khi kết nối server.");
                    });
                }}
              />
            </Tooltip>

            <Button
              size="small"
              type="link"
              disabled={isPast}
              onClick={() => {
                setSmokingLog((prev) => ({ ...prev, [date]: suggested }));
                updateWeeklyCigUsage(date, suggested);

                const formatted = dayjs(date, "DD/MM/YYYY").format(
                  "YYYY-MM-DD"
                );
                const token = localStorage.getItem("token");

                fetch("http://localhost:5000/api/smoking-summary/single", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    date: formatted,
                    total_cigarettes: suggested,
                  }),
                })
                  .then((res) => res.json())
                  .then((res) => {
                    if (res.success) {
                      message.success("✅ Đã lưu theo gợi ý!");
                    } else {
                      message.error("❌ Không thể lưu.");
                    }
                  })
                  .catch((err) => {
                    console.error("Lỗi khi lưu:", err);
                    message.error("❌ Lỗi khi kết nối server.");
                  });
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
                  Mức độ nghiện hiện tại: <b>{ftndLevel}</b>
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
                      onChange: (page) => {
                        setCurrentWeekPage(page);
                        sessionStorage.setItem("quitPlanPage", page); // Lưu vào session
                      },
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

            <div style={{ textAlign: "center", marginTop: 24 }}>
              <Button
                type="primary"
                style={{
                  backgroundColor: "#fa541c",
                  borderColor: "#fa541c",
                  fontWeight: 600,
                  padding: "8px 20px",
                }}
                onClick={handleSubmitDailyCigs}
              >
                Gửi số điếu hút hôm nay
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default QuitPlan;
