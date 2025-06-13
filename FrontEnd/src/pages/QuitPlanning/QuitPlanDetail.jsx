// pages/QuitPlanDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  Typography,
  Table,
  Checkbox,
  message,
  Card,
  Tag,
  Progress,
  Divider,
  Badge,
} from "antd";
import {
  SmileTwoTone,
  FireTwoTone,
  CheckCircleTwoTone,
} from "@ant-design/icons";
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
    <div style={{ padding: 24, background: "#f6faff", minHeight: "100vh" }}>
      <Card
        style={{
          maxWidth: 700,
          margin: "0 auto",
          borderRadius: 16,
          boxShadow: "0 4px 24px #0001",
          background: "#fff",
        }}
        bodyStyle={{ padding: 32 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <FireTwoTone twoToneColor="#ff7875" style={{ fontSize: 36 }} />
          <Title level={3} style={{ margin: 0 }}>
            Chi tiết kế hoạch cho ngày:{" "}
            <Tag color="geekblue" style={{ fontSize: 18, padding: "2px 12px" }}>
              {info.date}
            </Tag>
          </Title>
        </div>
        <Divider />
        <div style={{ display: "flex", gap: 32, marginBottom: 16 }}>
          <Badge.Ribbon text={`Tuần ${weekNumber}`} color="cyan">
            <Card size="small" bordered={false} style={{ minWidth: 160 }}>
              <Paragraph>
                <strong>Tiến trình:</strong>{" "}
                <Tag color="success" style={{ fontWeight: 600 }}>
                  {info.progress}
                </Tag>
              </Paragraph>
              <Paragraph>
                <strong>Giai đoạn:</strong>{" "}
                <Tag color="purple" style={{ fontWeight: 600 }}>
                  {info.phase}
                </Tag>
              </Paragraph>
            </Card>
          </Badge.Ribbon>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <Progress
              percent={Math.min(
                Math.round(
                  (completed.filter(Boolean).length /
                    (info.detailPlan?.length || 1)) *
                    100
                ),
                100
              )}
              status="active"
              strokeColor={{
                "0%": "#108ee9",
                "100%": "#87d068",
              }}
              showInfo
              style={{ width: "100%" }}
            />
          </div>
        </div>
        <Divider orientation="left" plain>
          <SmileTwoTone twoToneColor="#52c41a" /> Thời điểm dễ gây ham muốn &
          hành vi thay thế
        </Divider>
        {Array.isArray(info.detailPlan) && info.detailPlan.length > 0 ? (
          <Table
            columns={columns}
            dataSource={info.detailPlan.map((item, idx) => ({
              ...item,
              key: idx,
            }))}
            pagination={false}
            bordered
            rowClassName={(_, idx) =>
              completed[idx] ? "ant-table-row-success" : ""
            }
          />
        ) : (
          <Paragraph type="secondary" italic>
            Không có dữ liệu chi tiết cho ngày này.
          </Paragraph>
        )}

        <Divider orientation="left" plain>
          <CheckCircleTwoTone twoToneColor="#13c2c2" /> Chi tiết nhiệm vụ
        </Divider>
        <ul style={{ paddingLeft: 24 }}>
          {(info.tasks || []).map((task, i) => (
            <li key={i} style={{ marginBottom: 8, fontSize: 16 }}>
              <Tag color="magenta" style={{ fontSize: 15 }}>
                {task}
              </Tag>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default QuitPlanDetail;
