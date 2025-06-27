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
import Navbar from "../../layouts/Navbar";

const { Title, Paragraph } = Typography;

const QuitPlanDetail = () => {
  const location = useLocation();
  const { date } = useParams(); // dạng DD-MM-YYYY
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

  // ✅ Sử dụng ngày bắt đầu thật từ state truyền sang, không hard-code
  const planStartDate = location.state?.rawStartDate || "2025-06-17";
  const startDate = dayjs(planStartDate);

  let weekNumber = "Không xác định";
  if (info.date && startDate.isValid()) {
    const selectedDate = dayjs(info.date, "DD/MM/YYYY");
    const diffDays = selectedDate.diff(startDate, "day");
    weekNumber = Math.floor(diffDays / 7) + 1;
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    const formattedDate = dayjs(date, ["DD/MM/YYYY", "YYYY-MM-DD"]).format(
      "YYYY-MM-DD"
    );

    fetch(`http://localhost:5000/api/habit-log?date=${formattedDate}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(async (result) => {
        if (Array.isArray(result.data)) {
          setCompleted(result.data.map((x) => !!x));

          for (let i = 0; i < result.data.length; i++) {
            if (result.data[i] === true) {
              const tokenPayload = JSON.parse(atob(token.split(".")[1]));
              const user_id = tokenPayload.id;

              await fetch("http://localhost:5000/api/user-score/update", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  user_id,
                  date: formattedDate,
                  timeSlot: i,
                  point: 1,
                }),
              });
            }
          }
        }
      })
      .catch((err) => {
        console.error("Lỗi lấy habit log:", err);
      });
  }, [date]);

  const handleCheckbox = async (idx) => {
    const updated = [...completed];
    const newState = !updated[idx];
    updated[idx] = newState;
    setCompleted(updated);

    const token = localStorage.getItem("token");
    const formattedDate = dayjs(date, [
      "DD-MM-YYYY",
      "DD/MM/YYYY",
      "YYYY-MM-DD",
    ]).format("YYYY-MM-DD");

    try {
      await fetch("http://localhost:5000/api/habit-log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: formattedDate,
          timeSlot: idx,
          completed: newState,
          points: newState ? 1 : 0,
        }),
      });

      message.success(newState ? "✅ Đã ghi nhận!" : "🗑️ Đã bỏ tích!");
    } catch (err) {
      console.error("Lỗi khi ghi log:", err);
      message.error("Lỗi cập nhật hành vi.");
    }
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
      <Navbar />
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
        <Card
          size="small"
          bordered={false}
          style={{
            maxWidth: 500,
            margin: "0 auto 24px auto",
            borderRadius: 12,
            boxShadow: "0 2px 8px #0001",
            background: "#f9f9ff",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 18 }}>Giai đoạn:</span>
              <Tag color="purple" style={{ fontWeight: 600, fontSize: 16 }}>
                {info.phase}
              </Tag>
              <Tag
                color="cyan"
                style={{ fontWeight: 600, fontSize: 16, marginLeft: 8 }}
              >
                Tuần {weekNumber}
              </Tag>
            </div>
            <div style={{ width: "100%", marginTop: 8 }}>
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
        </Card>
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
