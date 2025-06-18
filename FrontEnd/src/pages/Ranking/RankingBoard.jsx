import React, { useEffect, useState } from "react";
import { Table, Tag, Typography, Card, Progress, Avatar, Tooltip } from "antd";
import { CrownTwoTone, StarTwoTone, UserOutlined } from "@ant-design/icons";
import Navbar from "../../layouts/Navbar";

const { Title } = Typography;

const levelColors = {
  Beginner: "default",
  Intermediate: "blue",
  Advanced: "green",
  Master: "gold",
};

const RankingBoard = () => {
  const [data, setData] = useState([]);

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
      render: (rank) =>
        rank === 1 ? (
          <CrownTwoTone twoToneColor="#faad14" style={{ fontSize: 24 }} />
        ) : (
          <Tag color="volcano">{rank}</Tag>
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
          maxWidth: 900,
          margin: "40px auto",
          border: "2px solid #bae7ff",
          borderRadius: 16,
          boxShadow: "0 4px 12px rgba(24, 144, 255, 0.1)",
        }}
      >
        <Title
          level={3}
          style={{
            textAlign: "center",
            background: "linear-gradient(to right, #1890ff, #73d13d)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 700,
          }}
        >
          🏆 Bảng Xếp Hạng Người Dùng
        </Title>
        <Table
          columns={columns}
          dataSource={data}
          pagination={false}
          rowKey="user_id"
          style={{ marginTop: 24 }}
        />
      </Card>
    </div>
  );
};

export default RankingBoard;
