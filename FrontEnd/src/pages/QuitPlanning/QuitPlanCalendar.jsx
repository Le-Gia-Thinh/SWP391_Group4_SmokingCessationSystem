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
  RocketOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "./QuitPlanCalendar.css";
import PlanSetupModal from "./PlanSetupModal";
import axios from "axios";
import Navbar from "../../layouts/Navbar";

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
  const startingQuota = { low: 35, medium: 70, high: 119 };
  const start = startingQuota[level];
  // Nếu chỉ có 1 tuần thì luôn là start
  if (totalWeeks <= 1) return [{ week: 1, maxCigs: start }];
  const step = (start - 0) / (totalWeeks - 1);
  return Array.from({ length: totalWeeks }, (_, i) => ({
    week: i + 1,
    maxCigs: Math.round(Math.max(0, start - step * i)),
  }));
};

const distributeDailyQuota = (weeklyCigs) => {
  const basePattern = [14, 13, 12, 11, 9, 6, 5];
  const baseTotal = basePattern.reduce((a, b) => a + b, 0);
  let raw = basePattern.map((val) => (val / baseTotal) * weeklyCigs);

  // Làm tròn xuống từng ngày
  let rounded = raw.map(Math.floor);
  let sum = rounded.reduce((a, b) => a + b, 0);

  // Phân bổ số còn thiếu (nếu tổng < weeklyCigs)
  let diff = Math.round(weeklyCigs - sum);
  while (diff > 0) {
    // Tìm ngày có phần thập phân lớn nhất để cộng thêm 1
    let maxIdx = 0;
    let maxFrac = 0;
    raw.forEach((v, i) => {
      const frac = v - Math.floor(v);
      if (frac > maxFrac) {
        maxFrac = frac;
        maxIdx = i;
      }
    });
    rounded[maxIdx]++;
    diff--;
  }
  return rounded;
};

const QuitPlan = () => {
  const [startDate, setStartDate] = useState(null);
  const [months, setMonths] = useState(null);
  const [showModal, setShowModal] = useState(true);
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState("week");
  const [smokingLog, setSmokingLog] = useState({});
  const [tempSmokingLog, setTempSmokingLog] = useState({});
  const [habitLogByDate, setHabitLogByDate] = useState({});

  const [currentWeekPage, setCurrentWeekPage] = useState(() => {
    const savedPage = sessionStorage.getItem("quitPlanPage");
    return savedPage ? parseInt(savedPage, 10) : 1;
  });
  const [ftndLevel, setFtndLevel] = useState("");
  const navigate = useNavigate();

  // Fetch habit log từng ngày
  useEffect(() => {
    if (!user?.id || !startDate || !months) return;
    const token = localStorage.getItem("token");
    const fetchLogs = async () => {
      const logs = {};
      for (let i = 0; i < months * 30; i++) {
        const date = startDate.clone().add(i, "day").format("YYYY-MM-DD");
        const res = await fetch(
          `http://localhost:5000/api/habit-log?date=${date}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        // Nếu BE trả về completedCount, totalSlots
        if (
          typeof data.completedCount === "number" &&
          typeof data.totalSlots === "number"
        ) {
          logs[date] = {
            completedCount: data.completedCount,
            totalSlots: data.totalSlots,
          };
        } else if (Array.isArray(data.data)) {
          // Nếu BE trả về mảng completed
          logs[date] = {
            completedCount: data.data.filter((x) => x === 1 || x === true)
              .length,
            totalSlots: data.data.length,
          };
        } else {
          logs[date] = { completedCount: 0, totalSlots: 9 };
        }
      }
      setHabitLogByDate(logs);
    };
    fetchLogs();
  }, [user?.id, startDate, months]);

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
        console.log("ftnd_level từ DB:", data.ftnd_level);
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

  useEffect(() => {
    if (!user?.id || !startDate || !months || !ftndLevel) return;

    fetch(`http://localhost:5000/api/smoking-summary/all/${user.id}`)
      .then((res) => res.json())
      .then(async (data) => {
        if (data.length === 0) {
          // Nếu user này chưa có dữ liệu, tự động lưu số điếu gợi ý vào DB
          const plan = [];
          const totalDays = months * 30;
          const weeklyQuota = generateWeeklyQuota(months, level);
          for (let i = 0; i < totalDays; i++) {
            const currentDate = startDate.add(i, "day");
            const formattedDate = currentDate.format("DD/MM/YYYY");
            const weekIndex = Math.floor(i / 7);
            const weeklyCigs = weeklyQuota[weekIndex]?.maxCigs || 0;
            console.log(
              "Ngày:",
              formattedDate,
              "weekIndex:",
              weekIndex,
              "weeklyCigs:",
              weeklyCigs
            );
            const dailyPattern = distributeDailyQuota(weeklyCigs);
            console.log("dailyPattern:", dailyPattern);
            const dailyQuota = dailyPattern[i % 7] || 0;
            plan.push({ date: formattedDate, total_cigarettes: dailyQuota });
          }
          // Gửi từng ngày lên server cho user này
          const token = localStorage.getItem("token");
          for (const item of plan) {
            await fetch("http://localhost:5000/api/smoking-summary/single", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                date: dayjs(item.date, "DD/MM/YYYY").format("YYYY-MM-DD"),
                total_cigarettes: item.total_cigarettes,
              }),
            });
          }
          // Sau khi lưu xong, reload lại dữ liệu cho user này
          fetch(`http://localhost:5000/api/smoking-summary/all/${user.id}`)
            .then((res) => res.json())
            .then((data) => {
              const log = {};
              data.forEach((entry) => {
                const formattedDate = dayjs(entry.date).format("DD/MM/YYYY");
                log[formattedDate] = entry.total_cigarettes;
              });
              setSmokingLog(log);
            });
        } else {
          // Nếu đã có dữ liệu thì chỉ cần set vào state
          const log = {};
          data.forEach((entry) => {
            const formattedDate = dayjs(entry.date).format("DD/MM/YYYY");
            log[formattedDate] = entry.total_cigarettes;
          });
          setSmokingLog(log);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải dữ liệu số điếu:", err);
      });
  }, [user?.id, startDate, months, ftndLevel]);

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
      // Xóa luôn log cũ
      // await axios.delete(`http://localhost:5000/api/smoking-summary/all/${user.id}`);
      sessionStorage.removeItem("quitPlanPage");
      message.success("Đã đặt lại kế hoạch");
      setShowModal(true);
    } catch (err) {
      console.error("Lỗi reset kế hoạch:", err);
      message.error("Không thể đặt lại kế hoạch");
    }
  };

  const totalDays = months ? months * 30 : 0;
  const normalizeLevel = (level) => {
    if (!level) return "medium";
    const l = level.trim().toLowerCase();
    if (l === "low") return "low";
    if (l === "medium") return "medium";
    if (l === "high") return "high";
    return "medium";
  };

  const level = useMemo(() => normalizeLevel(ftndLevel), [ftndLevel]);
  const weeklyQuota = useMemo(
    () =>
      startDate && months && ftndLevel
        ? generateWeeklyQuota(months, level)
        : [],
    [months, level, startDate, ftndLevel]
  );
  console.log("weeklyQuota:", weeklyQuota);
  const getRemainingCigs = (
    dateStr,
    weeklyQuota,
    log = smokingLog,
    tempLog = tempSmokingLog,
    excludeCurrent = false
  ) => {
    const date = dayjs(dateStr, "DD/MM/YYYY");
    const weekIndex = Math.floor(date.diff(startDate, "day") / 7);

    // Lấy tất cả ngày trong tuần từ cả log và tempLog
    const allDates = new Set([...Object.keys(log), ...Object.keys(tempLog)]);
    const weekDates = Array.from(allDates).filter((key) => {
      const d = dayjs(key, "DD/MM/YYYY");
      const wi = Math.floor(d.diff(startDate, "day") / 7);
      return wi === weekIndex && (!excludeCurrent || key !== dateStr);
    });

    // Tính tổng số điếu đã nhập (ưu tiên tempLog nếu có)
    let used = weekDates.reduce((sum, key) => {
      const tempVal = tempLog[key];
      const val = log[key];
      return sum + Number(tempVal !== undefined ? tempVal : val || 0);
    }, 0);

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
        // Sửa dòng này: truyền tempSmokingLog vào để tính luôn giá trị tạm thời
        remainingCigs: getRemainingCigs(
          formattedDate,
          weeklyQuota,
          smokingLog,
          tempSmokingLog // <-- thêm vào đây
        ),
        weekIndex,
        weekDayLabel: label,
        detailPlan: BEHAVIOR_PLAN_PHASES[PHASES.indexOf(phase)],
      });
    }
    return data;
  }, [startDate, months, viewMode, smokingLog, tempSmokingLog]); // <-- thêm tempSmokingLog vào dependency

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
      title: "Tiến trình ngày",
      dataIndex: "date",
      key: "progress",
      render: (date) => {
        const log =
          habitLogByDate[dayjs(date, "DD/MM/YYYY").format("YYYY-MM-DD")];
        const percent = log
          ? Math.round((log.completedCount / log.totalSlots) * 100)
          : 0;
        return (
          <div style={{ width: 100, minWidth: 80 }}>
            <Progress
              percent={percent}
              size="small"
              strokeColor={{
                "0%": "#108ee9",
                "100%": "#87d068",
              }}
              showInfo
              style={{ width: "100%" }}
            />
          </div>
        );
      },
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
      title: "Bạn hút",
      dataIndex: "date",
      key: "actualCigs",
      render: (date) => (
        <SmokingInputCell
          date={date}
          value={smokingLog[date] || 0}
          tempValue={tempSmokingLog[date]}
          isPast={dayjs(date, "DD/MM/YYYY").isBefore(dayjs(), "day")}
          setSmokingLog={setSmokingLog}
          setTempSmokingLog={setTempSmokingLog}
        />
      ),
    },

    {
      title: "Còn lại",
      dataIndex: "remainingCigs",
      key: "remainingCigs",
      render: (val, record) => {
        let color = "green";
        let groupDates = [];
        let quota = 0;
        if (viewMode === "week") {
          groupDates = planData
            .filter((r) => r.weekIndex === record.weekIndex)
            .map((r) => r.date);
          quota = weeklyQuota[record.weekIndex]?.maxCigs || 0;
        } else {
          // Lấy đúng 30 ngày của tháng này
          const monthIndex = Math.floor(record.key / 30);
          groupDates = planData
            .filter((r) => Math.floor(r.key / 30) === monthIndex)
            .map((r) => r.date);

          // Tổng quota tháng = tổng suggestedCigs của 30 ngày này
          quota = planData
            .filter((r) => Math.floor(r.key / 30) === monthIndex)
            .reduce((sum, r) => sum + (Number(r.suggestedCigs) || 0), 0);
        }
        // Tổng số điếu đã nhập (ưu tiên temp, nếu chưa thì lấy log)
        const totalUsed = groupDates.reduce((sum, date) => {
          const tempVal = tempSmokingLog[date];
          const val = tempVal !== undefined ? tempVal : smokingLog[date] || 0;
          return sum + Number(val);
        }, 0);
        const remain = Math.max(0, quota - totalUsed);

        if (remain <= 10) color = "orange";
        if (remain <= 3) color = "red";
        return (
          <Tooltip
            title={
              viewMode === "week"
                ? "Còn lại trong tuần này"
                : "Còn lại trong tháng này"
            }
          >
            <Badge
              count={remain}
              style={{ backgroundColor: color, marginRight: 8 }}
              showZero
            />
            <span style={{ marginLeft: 8, color }}>{remain} điếu</span>
          </Tooltip>
        );
      },
    },
  ];

  const weekPageSize = 7; // Số ngày trong 1 tuần
  const weekTotal = weeklyQuota.length; // Tổng số tuần dựa trên weeklyQuota

  // --- Tiến trình demo ---
  const percentThucTe =
    startDate && months
      ? Math.min(
          100,
          Math.round(
            ((dayjs().diff(startDate, "day") + 1) / (months * 30)) * 100
          )
        )
      : 0;
  const [animatedPercent, setAnimatedPercent] = useState(percentThucTe);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!isAnimating) setAnimatedPercent(percentThucTe);
  }, [percentThucTe, isAnimating]);

  const handleRocketClick = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    let current = animatedPercent;
    const target = 100;
    const speed = 1;
    const interval = setInterval(() => {
      current += speed;
      if (current >= target) {
        current = target;
        setAnimatedPercent(current);
        clearInterval(interval);
        setTimeout(() => {
          setIsAnimating(false);
          setAnimatedPercent(percentThucTe);
        }, 1200);
      } else {
        setAnimatedPercent(current);
      }
    }, 100);
  };

  if (showModal && user) {
    return (
      <PlanSetupModal
        userId={user.id}
        onPlanReady={handlePlanReady}
        onResetPlan={handleResetPlan}
      />
    );
  }

  if (!startDate || !months || !ftndLevel) {
    return <Spin fullscreen tip="Đang tải kế hoạch..." />;
  }

  return (
    <div
      className="quit-plan-wrapper"
      style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}
    >
      <Navbar />
      <Row justify="center">
        <Col xs={24} sm={24} md={24} lg={24}>
          <Card variant="outlined" hoverable style={{ marginBottom: 24 }}>
            <Title
              level={3}
              style={{
                marginBottom: 0,
                textAlign: "center",
                background: "linear-gradient(to right, #1890ff, #73d13d)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: 700,
                fontSize: 28,
              }}
            >
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
          </Card>

          <Card variant="outlined">
            <div
              style={{
                display: "flex",
                gap: 32,
                justifyContent: "center",
                alignItems: "center", // Đảm bảo căn giữa theo chiều dọc
                margin: "16px 0 24px 0",
                flexWrap: "wrap",
                width: "100%",
              }}
            >
              {/* Tiến trình cai */}
              <Card
                style={{
                  flex: 1,
                  minWidth: 320,
                  maxWidth: 420,
                  borderRadius: 20,
                  boxShadow: "0 4px 24px #e6f7ff",
                  background: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center", // Căn giữa nội dung
                  justifyContent: "center",
                  width: "100%", // Thêm width 100%
                  padding: 32,
                }}
                bodyStyle={{ padding: 0, width: "100%" }}
                bordered={false}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "100%", // Đảm bảo nội dung căn giữa
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: 140,
                      height: 140,
                      marginBottom: 8,
                      margin: "0 auto",
                    }}
                  >
                    <Progress
                      type="circle"
                      percent={animatedPercent}
                      width={140}
                      strokeWidth={10}
                      strokeColor={{
                        "0%": "#73d13d",
                        "50%": "#1890ff",
                        "100%": "#faad14",
                      }}
                      trailColor="#f0f0f0"
                      format={() => null}
                      style={{ filter: "drop-shadow(0 2px 8px #bae7ff)" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: 140,
                        height: 140,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                        userSelect: "none",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 36,
                          color: "#1890ff",
                          marginBottom: 2,
                          pointerEvents: "auto",
                          cursor: isAnimating ? "not-allowed" : "pointer",
                          transition: "color 0.2s",
                        }}
                        onClick={!isAnimating ? handleRocketClick : undefined}
                        title="Tăng tiến trình demo"
                      >
                        {animatedPercent}%
                      </span>
                      <RocketOutlined
                        style={{
                          fontSize: 32,
                          color: isAnimating ? "#faad14" : "#52c41a",
                          marginTop: 2,
                          pointerEvents: "auto",
                          cursor: isAnimating ? "not-allowed" : "pointer",
                          transition: "color 0.2s",
                          filter: isAnimating
                            ? "drop-shadow(0 0 8px #faad14)"
                            : "none",
                        }}
                        onClick={!isAnimating ? handleRocketClick : undefined}
                        title="Tăng tiến trình demo"
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
                    <Tag
                      color="blue"
                      style={{
                        fontSize: 16,
                        padding: "4px 16px",
                        borderRadius: 8,
                        fontWeight: 600,
                        background: "#e6f7ff",
                        color: "#1890ff",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                      icon={<CalendarOutlined />}
                    >
                      {startDate
                        ? `${Math.round(
                            (animatedPercent / 100) * totalDays
                          )} / ${totalDays} ngày`
                        : ""}
                    </Tag>
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 24,
                      color: "#1d39c4",
                      marginTop: 16,
                      textAlign: "center",
                      letterSpacing: 0.5,
                      textShadow: "0 2px 8px #e6f7ff",
                    }}
                  >
                    Tiến trình cai
                  </div>
                </div>
              </Card>

              {/* Giai đoạn hiện tại */}
              <Card
                style={{
                  flex: 2,
                  minWidth: 340,
                  maxWidth: 600,
                  borderRadius: 20,
                  boxShadow: "0 2px 12px #fffbe6",
                  padding: 32,
                  background: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
                bodyStyle={{ padding: 0, width: "100%" }}
                bordered={false}
              >
                <div
                  style={{
                    fontSize: 18,
                    color: "#fa8c16",
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  Giai đoạn hiện tại
                </div>
                <div
                  style={{
                    fontSize: 22,
                    color: "#fa8c16",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  {(() => {
                    const percent = animatedPercent;
                    const currentPhaseIdx = PHASES.findIndex(
                      ({ range }) => percent >= range[0] && percent <= range[1]
                    );
                    const currentPhase = PHASES[currentPhaseIdx];
                    return currentPhase
                      ? `${currentPhase.phase} - ${currentPhase.goal}`
                      : "";
                  })()}
                </div>
                <div style={{ fontSize: 16, color: "#222", marginBottom: 16 }}>
                  {(() => {
                    const percent = animatedPercent;
                    const currentPhaseIdx = PHASES.findIndex(
                      ({ range }) => percent >= range[0] && percent <= range[1]
                    );
                    const nextPhase = PHASES[currentPhaseIdx + 1];
                    if (!nextPhase) return "Bạn đã ở giai đoạn cuối!";
                    const percentToNext = nextPhase.range[0] - percent;
                    return percentToNext > 0
                      ? `Còn ${Math.ceil(percentToNext)}% nữa đến ${
                          nextPhase.phase
                        }`
                      : `Sắp sang giai đoạn tiếp theo!`;
                  })()}
                </div>
                <div
                  style={{
                    height: 8,
                    background: "#eee",
                    borderRadius: 4,
                    overflow: "hidden",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: `${animatedPercent}%`,
                      height: "100%",
                      background: "#faad14",
                      transition: "width 0.5s",
                    }}
                  />
                </div>
                {/* Tag màu mè cho Bắt đầu và Thời gian */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 8,
                    gap: 8,
                  }}
                >
                  <Tag
                    color="blue"
                    style={{
                      fontSize: 16,
                      padding: "4px 16px",
                      borderRadius: 8,
                      fontWeight: 600,
                      background: "#e6f7ff",
                      color: "#1890ff",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                    icon={<CalendarOutlined />}
                  >
                    Bắt đầu: {startDate?.format("DD/MM/YYYY")}
                  </Tag>
                  <Tag
                    color="green"
                    style={{
                      fontSize: 16,
                      padding: "4px 16px",
                      borderRadius: 8,
                      fontWeight: 600,
                      background: "#f6ffed",
                      color: "#52c41a",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                    icon={<InfoCircleOutlined />}
                  >
                    Thời gian: {months} tháng
                  </Tag>
                </div>
              </Card>
            </div>

            <Table
              columns={columns}
              dataSource={planData}
              title={() => (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    background: "#f5f7fa",
                    borderRadius: 12,
                    marginBottom: 8,
                    boxShadow: "0 2px 8px rgba(24,144,255,0.04)",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 20,
                      color: "#1d39c4",
                      letterSpacing: 0.5,
                    }}
                  >
                    <CalendarOutlined
                      style={{ marginRight: 8, color: "#1890ff" }}
                    />
                    Bảng kế hoạch chi tiết
                  </span>
                  <div style={{ display: "flex", gap: 12 }}>
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
                        minWidth: 170,
                        fontWeight: 600,
                        fontSize: 16,
                        borderRadius: 8,
                        background: "#fff",
                        boxShadow: "0 1px 4px rgba(24,144,255,0.07)",
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
                        marginLeft: 0,
                        boxShadow: "0 1px 4px rgba(255,77,79,0.07)",
                        border: "1.5px solid #ff4d4f",
                      }}
                      size="large"
                    >
                      Đặt lại kế hoạch
                    </Button>
                  </div>
                </div>
              )}
              pagination={
                viewMode === "week"
                  ? {
                      current: currentWeekPage,
                      pageSize: weekPageSize,
                      total: planData.length,
                      showSizeChanger: false,
                      onChange: (page) => {
                        setCurrentWeekPage(page);
                        sessionStorage.setItem("quitPlanPage", page);
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
                    {
                      state: {
                        ...record,
                        rawStartDate: startDate.toISOString(),
                      },
                    }
                  );
                },
              })}
              style={{ background: "#fff", width: "100%" }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const SmokingInputCell = ({
  date,
  value,
  tempValue,
  isPast,
  setSmokingLog,
  setTempSmokingLog,
}) => {
  const [inputValue, setInputValue] = useState(
    tempValue !== undefined ? tempValue : value
  );
  const [loading, setLoading] = useState(false);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    setInputValue(tempValue !== undefined ? tempValue : value);
  }, [value, tempValue]);

  const handleSave = async () => {
    setLoading(true);
    setClicked(true); // Thêm hiệu ứng
    setTimeout(() => setClicked(false), 400); // Reset hiệu ứng sau 0.4s
    const formatted = dayjs(date, "DD/MM/YYYY").format("YYYY-MM-DD");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        "http://localhost:5000/api/smoking-summary/single",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: formatted,
            total_cigarettes: inputValue,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        message.success("✅ Đã lưu!");
        setSmokingLog((prev) => ({ ...prev, [date]: inputValue }));
        setTempSmokingLog((prev) => {
          const { [date]: _, ...rest } = prev;
          return rest;
        });
      } else {
        message.error("❌ Không thể lưu.");
      }
    } catch {
      message.error("❌ Lỗi khi kết nối server.");
    }
    setLoading(false);
  };

  const handleChange = (val) => {
    setInputValue(val);
    setTempSmokingLog((prev) => ({ ...prev, [date]: val }));
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <InputNumber
        min={0}
        value={inputValue}
        style={{ width: 100, height: 44, fontSize: 18 }} // tăng width, height, font
        disabled={isPast}
        onChange={handleChange}
      />
      <Button
        size="large"
        type="primary"
        loading={loading}
        disabled={isPast || inputValue === value}
        onClick={handleSave}
        className={`confirm-btn${clicked ? " clicked" : ""}`}
        style={{ height: 44, fontSize: 16 }} // tăng size nút
      >
        Xác nhận
      </Button>
    </div>
  );
};

export default QuitPlan;
