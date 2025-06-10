// pages/QuitPlanDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Typography, Table, Checkbox, message } from "antd";
import dayjs from "dayjs";

const { Title, Paragraph } = Typography;

const QuitPlanDetail = () => {
  const location = useLocation();
  const { date } = useParams();
  const data = location.state;
  const [completed, setCompleted] = useState(Array(9).fill(false));

  const fallback = {
    date,
    progress: "Không xác định",
    phase: "Không xác định",
    detailPlan: [],
    tasks: [
      "Không có dữ liệu cụ thể. Hãy vào từ trang kế hoạch để xem chi tiết.",
    ],
  };

  const info = data && data.detailPlan ? data : fallback;

  const startDate = dayjs("2025-06-08", "YYYY-MM-DD");
  let weekNumber = "Không xác định";
  if (info.date) {
    const selectedDate = dayjs(info.date, "DD/MM/YYYY");
    const diffDays = selectedDate.diff(startDate, "day");
    weekNumber = Math.floor(diffDays / 7) + 1;
  }

  // Giả lập fetch lại khi quay lại trang
  useEffect(() => {
    fetch(`/api/habit-log?date=${date}`)
      .then((res) => res.json())
      .then((result) => {
        if (Array.isArray(result)) {
          setCompleted(result);
        }
      })
      .catch(() => {});
  }, [date]);

  const handleCheckbox = (idx) => {
    const updated = [...completed];
    updated[idx] = !updated[idx];
    setCompleted(updated);

    fetch("/api/habit-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        timeSlot: idx,
        completed: updated[idx],
        points: 1,
      }),
    });

    message.success("Đã ghi nhận hành vi không hút thuốc!");
  };

  const columns = [
    {
      title: "Thời điểm",
      dataIndex: "time",
      key: "time",
      render: (text, _, index) => (
        <strong>
          {index + 1}. {text}
        </strong>
      ),
    },
    {
      title: "Hành vi / hoàn cảnh",
      dataIndex: "behavior",
      key: "behavior",
    },
    {
      title: "Ghi chú thay thế",
      dataIndex: "replacement",
      key: "replacement",
    },
    {
      title: "Đã không hút",
      key: "check",
      render: (_, __, index) => (
        <Checkbox
          checked={completed[index]}
          onChange={() => handleCheckbox(index)}
        >
          Tôi đã không hút
        </Checkbox>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Chi tiết kế hoạch cho ngày: {info.date}</Title>
      <Paragraph>
        <strong>Tuần hiện tại:</strong> Tuần {weekNumber}
      </Paragraph>
      <Paragraph>
        <strong>Tiến trình:</strong> {info.progress}
      </Paragraph>
      <Paragraph>
        <strong>Giai đoạn:</strong> {info.phase}
      </Paragraph>

      <Title level={4}>Thời điểm dễ gây ham muốn & hành vi thay thế:</Title>
      {Array.isArray(info.detailPlan) && info.detailPlan.length > 0 ? (
        <Table
          columns={columns}
          dataSource={info.detailPlan.map((item, idx) => ({
            ...item,
            key: idx,
          }))}
          pagination={false}
          bordered
        />
      ) : (
        <Paragraph type="secondary" italic>
          Không có dữ liệu chi tiết cho ngày này.
        </Paragraph>
      )}

      <Title level={4} style={{ marginTop: 24 }}>
        Chi tiết nhiệm vụ:
      </Title>
      <ul>
        {(info.tasks || []).map((task, i) => (
          <li key={i}>{task}</li>
        ))}
      </ul>
    </div>
  );
};

export default QuitPlanDetail;
