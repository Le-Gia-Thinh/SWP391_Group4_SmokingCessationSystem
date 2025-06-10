// ✅ Fixed version of QuitPlan component

import React, { useState, useMemo } from "react";
import {
  DatePicker,
  InputNumber,
  Select,
  Table,
  Typography,
  Input,
  Button,
} from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "./QuitPlanCalendar.css";

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
    time: "7h – Sau khi thức dậy",
    behavior: "Cơn thèm do phản xạ",
    replacement: "Uống nước + đi bộ nếu trì hoãn được",
  },
  {
    time: "8h – Sau ăn sáng",
    behavior: "Thói quen sau ăn",
    replacement: "Có thể thay bằng thiền hoặc kẹo bạc hà",
  },
  {
    time: "10h – Giữa buổi sáng",
    behavior: "Căng thẳng nhẹ",
    replacement: "Kẹo không đường, đi quanh phòng",
  },
  {
    time: "12h – Sau ăn trưa",
    behavior: "Nguy cơ cao",
    replacement: "Nên thay bằng trái cây/di chuyển",
  },
  {
    time: "14h – Đầu giờ chiều",
    behavior: "Buồn ngủ / mệt mỏi",
    replacement: "Nghe nhạc, tập giãn cơ",
  },
  {
    time: "16h – Cuối giờ làm việc",
    behavior: "Stress cuối ngày",
    replacement: "Tập thở 4–7–8 hoặc vươn vai 5 phút",
  },
  {
    time: "18h – Trước ăn tối",
    behavior: "Chuyển đổi môi trường",
    replacement: "Đi dạo nhanh thay thế",
  },
  {
    time: "20h – Sau ăn tối",
    behavior: "Nguy cơ cao",
    replacement: "Chuyển sang uống trà, đọc sách",
  },
  {
    time: "22h – Trước khi ngủ",
    behavior: "Cảm giác trống trải cuối ngày",
    replacement: "Ghi nhật ký, nghe podcast thư giãn",
  },
];

const generateWeeklyQuota = (months, level) => {
  const totalWeeks = Math.round(months * 4.3);
  const startingQuota = {
    light: 35,
    medium: 70,
    heavy: 119,
  };
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
  const [startDate, setStartDate] = useState(dayjs("2025-06-08"));
  const [months, setMonths] = useState(7);
  const level = "medium";
  const [viewMode, setViewMode] = useState("day");
  const [smokingLog, setSmokingLog] = useState({});
  const [weeklyUsage, setWeeklyUsage] = useState({});
  const navigate = useNavigate();

  const totalDays = months * 30;

  const updateWeeklyCigUsage = (dateStr, value) => {
    const date = dayjs(dateStr, "DD/MM/YYYY");
    const weekIndex = Math.floor(date.diff(startDate, "day") / 7);
    setWeeklyUsage((prev) => {
      const currentWeek = prev[weekIndex] || {};
      return { ...prev, [weekIndex]: { ...currentWeek, [dateStr]: value } };
    });
  };

  const getRemainingCigs = (dateStr, weeklyQuota, log = smokingLog) => {
    const date = dayjs(dateStr, "DD/MM/YYYY");
    const weekIndex = Math.floor(date.diff(startDate, "day") / 7);

    const weekData = Object.entries(log).filter(([key]) => {
      const d = dayjs(key, "DD/MM/YYYY");
      const wi = Math.floor(d.diff(startDate, "day") / 7);
      return wi === weekIndex && key !== dateStr; // ⚠️ loại trừ chính ngày đang xét
    });

    const used = weekData.reduce((sum, [, val]) => sum + Number(val || 0), 0);
    const quota = weeklyQuota[weekIndex]?.maxCigs || 0;
    return Math.max(0, quota - used);
  };

  const planData = useMemo(() => {
    const data = [];
    const weeklyQuota = generateWeeklyQuota(months, level);

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
        remainingCigs: getRemainingCigs(formattedDate, weeklyQuota),
        weekIndex,
        weekDayLabel: label,
        detailPlan: BEHAVIOR_PLAN,
      });
    }

    if (viewMode === "week") return data.filter((_, i) => i % 7 === 0);
    if (viewMode === "month") return data.filter((_, i) => i % 30 === 0);
    return data;
  }, [startDate, months, viewMode, smokingLog, weeklyUsage]);

  const columns = [
    {
      title: "Ngày kế hoạch",
      dataIndex: "weekDayLabel",
      key: "weekDayLabel",
      render: (text) => <strong>{text}</strong>,
    },
    { title: "Ngày", dataIndex: "date", key: "date" },
    { title: "Tiến trình", dataIndex: "progress", key: "progress" },
    { title: "Giai đoạn", dataIndex: "phase", key: "phase" },
    {
      title: "Gợi ý",
      dataIndex: "suggestedCigs",
      key: "suggestedCigs",
      render: (val, record) => (
        <div>
          Gợi ý: {val} điếu
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setSmokingLog((prev) => ({ ...prev, [record.date]: val }));
              updateWeeklyCigUsage(record.date, val);
            }}
          >
            Theo Hệ Thống
          </Button>
        </div>
      ),
    },
    {
      title: "Bạn hút",
      dataIndex: "date",
      key: "actualCigs",
      render: (date) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Input
            type="number"
            min={0}
            style={{ width: 60 }}
            value={smokingLog[date] || ""}
            onChange={(e) => {
              let value = Number(e.target.value);
              const simulatedLog = { ...smokingLog, [date]: value };
              const remaining = getRemainingCigs(
                date,
                generateWeeklyQuota(months, level),
                simulatedLog
              );
              if (value > remaining) value = remaining;
              setSmokingLog((prev) => ({ ...prev, [date]: value }));
              updateWeeklyCigUsage(date, value);
            }}
          />
        </div>
      ),
    },
    {
      title: "Còn lại",
      dataIndex: "remainingCigs",
      key: "remainingCigs",
      render: (val) => `${val} điếu`,
    },
  ];

  return (
    <div className="quit-plan-wrapper">
      <Title level={3}>
        <CalendarOutlined style={{ marginRight: 8 }} /> Kế hoạch cai nghiện
        thuốc lá
      </Title>
      <p>
        <strong>Mức độ nghiện hiện tại:</strong> Trung bình
      </p>

      <div className="quit-plan-controls">
        <DatePicker
          value={startDate}
          onChange={setStartDate}
          format="YYYY-MM-DD"
        />
        <InputNumber
          min={1}
          value={months}
          onChange={setMonths}
          addonAfter="tháng"
        />
        <Select
          value={viewMode}
          onChange={setViewMode}
          options={[
            { label: "Xem theo ngày", value: "day" },
            { label: "Xem theo tuần", value: "week" },
            { label: "Xem theo tháng", value: "month" },
          ]}
        />
      </div>

      <Table
        columns={columns}
        dataSource={planData}
        pagination={{ pageSize: 10 }}
        rowClassName={(record) => `week-row-${record.weekIndex % 5}`}
        onRow={(record) => ({
          onClick: () => {
            navigate(`/quit-plan-detail/${record.date.replaceAll("/", "-")}`, {
              state: record,
            });
          },
        })}
      />
    </div>
  );
};

export default QuitPlan;
