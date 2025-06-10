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
  Tooltip,
  Badge,
  Progress,
  Alert,
  Tag,
  Divider,
  Card,
  Empty,
  Spin,
  Popover,
  Row,
  Col,
} from "antd";
import {
  CalendarOutlined,
  CheckCircleTwoTone,
  InfoCircleOutlined,
} from "@ant-design/icons";
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
  const level = "medium",
    [viewMode, setViewMode] = useState("day"),
    [smokingLog, setSmokingLog] = useState({}),
    [weeklyUsage, setWeeklyUsage] = useState({});
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
      // Nếu excludeCurrent = true thì loại ngày hiện tại, ngược lại giữ lại
      return wi === weekIndex && (!excludeCurrent || key !== dateStr);
    });

    const used = weekData.reduce((sum, [, val]) => sum + Number(val || 0), 0);
    const quota = weeklyQuota[weekIndex]?.maxCigs || 0;
    return Math.max(0, quota - used);
  };

  const weeklyQuota = useMemo(
    () => generateWeeklyQuota(months, level),
    [months, level]
  );

  const planData = useMemo(() => {
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

    if (viewMode === "week") return data.filter((_, i) => i % 7 === 0);
    if (viewMode === "month") return data.filter((_, i) => i % 30 === 0);
    return data;
  }, [startDate, months, viewMode, smokingLog, weeklyUsage]);

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
            size="small" // Sửa width thành size
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
          <Button
            size="small"
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 4 }}
          >
            Gợi ý: {val} điếu
          </Button>
        </Popover>
      ),
    },
    {
      title: "Bạn hút",
      dataIndex: "date",
      key: "actualCigs",
      render: (date) => {
        const max = getRemainingCigs(date, weeklyQuota, smokingLog, true);
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Tooltip title="Nhập số điếu bạn đã hút hôm nay">
              <InputNumber
                min={0}
                max={max}
                step={1}
                style={{ width: 70 }}
                value={smokingLog[date] || ""}
                onChange={(value) => {
                  setSmokingLog((prev) => ({ ...prev, [date]: value }));
                  updateWeeklyCigUsage(date, value);
                }}
              />
            </Tooltip>
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
                style={{ minWidth: 140 }}
              />
              <Popover
                content="Chọn ngày bắt đầu, số tháng và chế độ xem để cá nhân hóa kế hoạch."
                title="Hướng dẫn nhanh"
              >
                <Button type="link" style={{ marginLeft: 8 }}>
                  ?
                </Button>
              </Popover>
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
              pagination={{ pageSize: 10 }}
              rowClassName={(record) => `week-row-${record.weekIndex % 5}`}
              locale={{
                emptyText: <Empty description="Không có dữ liệu kế hoạch" />,
              }}
              onRow={(record) => ({
                onClick: () => {
                  navigate(
                    `/quit-plan-detail/${record.date.replaceAll("/", "-")}`,
                    {
                      state: record,
                    }
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
