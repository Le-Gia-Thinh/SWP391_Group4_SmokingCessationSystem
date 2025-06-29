// QuitPlanDetail.jsx (RankingBoard with tabs and improved style)
import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Typography,
  Card,
  Progress,
  Avatar,
  Tooltip,
  Button,
  Space,
  Badge,
} from "antd";
import { CrownTwoTone, StarTwoTone, UserOutlined } from "@ant-design/icons";
import Navbar from "../../layouts/Navbar";
import "./RankingBoard.css";
const { Title } = Typography;

const levelColors = {
  Beginner: "default",
  Intermediate: "blue",
  Advanced: "green",
  Master: "gold",
};

const token = localStorage.getItem("token");
let currentUserId = null;

if (token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    currentUserId = payload.id;
  } catch (e) {
    console.error("Lỗi giải mã token:", e);
  }
}

const RankingBoard = () => {
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState("ranking");

  useEffect(() => {
    fetch("http://localhost:5000/api/user-score/ranking")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .catch((err) => console.error("Lỗi lấy bảng xếp hạng:", err));
  }, []);

  const columns = [
    {
      title: "#",
      dataIndex: "rank",
      key: "rank",
      render: (rank) => (
        <Tag
          color={
            rank === 1
              ? "gold"
              : rank === 2
              ? "blue"
              : rank === 3
              ? "green"
              : "volcano"
          }
        >
          {rank === 1 ? (
            <CrownTwoTone twoToneColor="#faad14" style={{ fontSize: 20 }} />
          ) : (
            rank
          )}
        </Tag>
      ),
    },
    {
      title: "Người dùng",
      dataIndex: "full_name",
      key: "full_name",
      render: (text, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar src={record.avatar_url} icon={<UserOutlined />} />
          <span style={{ fontWeight: 600 }}>{text}</span>
        </div>
      ),
    },
    {
      title: "Cấp độ",
      dataIndex: "current_level",
      key: "current_level",
      render: (level) => (
        <Tag color={levelColors[level]} icon={<StarTwoTone />}>
          {level}
        </Tag>
      ),
    },
    {
      title: "Tổng điểm",
      dataIndex: "total_points",
      key: "total_points",
      render: (val) => <b>{val} 🪙</b>,
    },
    {
      title: "Tiến độ nâng cấp",
      dataIndex: "progress_to_next",
      key: "progress_to_next",
      render: (val) => (
        <Tooltip title="Tiến tới cấp độ tiếp theo">
          <Progress
            percent={val}
            size="small"
            strokeColor="#52c41a"
            showInfo={false}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: "#f6faff", minHeight: "100vh" }}>
      <Navbar />
      <Card
        style={{
          maxWidth: 1000,
          margin: "40px auto",
          border: "1px solid #91d5ff",
          borderRadius: 20,
          background: "#ffffff",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
        }}
      >
        <Space style={{ marginBottom: 16 }}>
          <Button
            type={activeTab === "ranking" ? "primary" : "default"}
            onClick={() => setActiveTab("ranking")}
          >
            🏆 Xếp Hạng
          </Button>

          <Button
            type={activeTab === "achievements" ? "primary" : "default"}
            onClick={() => setActiveTab("achievements")}
          >
            🥇 Thành Tựu
          </Button>
        </Space>

        <Title
          level={3}
          style={{
            textAlign: "center",
            color: "#1890ff",
            fontWeight: 800,
            marginBottom: 12,
            letterSpacing: 1,
          }}
        >
          🏆 Bảng Xếp Hạng Người Dùng
        </Title>

        {activeTab === "ranking" && (
          <Table
            columns={columns}
            dataSource={data}
            pagination={false}
            rowKey="user_id"
            rowClassName={(record) =>
              record.user_id === currentUserId ? "highlight-row" : ""
            }
            style={{ marginTop: 24 }}
          />
        )}

        {activeTab === "achievements" && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Title level={4}>🥇 Thành tựu sẽ được cập nhật sớm!</Title>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RankingBoard;
