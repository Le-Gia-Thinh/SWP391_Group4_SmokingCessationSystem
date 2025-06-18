// pages/RankingBoard.jsx
import React, { useEffect, useState } from "react";
import { Table, Tag, Typography, Card } from "antd";

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
        if (res.success) {
          const ranked = res.data.map((u, i) => ({
            ...u,
            rank: i + 1,
            key: u.user_id,
          }));
          setData(ranked);
        }
      })
      .catch((err) => console.error("Lỗi lấy bảng xếp hạng:", err));
  }, []);

  const columns = [
    {
      title: "#",
      dataIndex: "rank",
      key: "rank",
      render: (rank) => <b>{rank}</b>,
    },
    {
      title: "Tên người dùng",
      dataIndex: "full_name",
      key: "full_name",
    },
    {
      title: "Điểm",
      dataIndex: "total_points",
      key: "total_points",
    },
    {
      title: "Cấp độ",
      dataIndex: "current_level",
      key: "current_level",
      render: (level) => <Tag color={levelColors[level]}>{level}</Tag>,
    },
  ];

  return (
    <Card style={{ maxWidth: 700, margin: "40px auto" }}>
      <Title level={3} style={{ textAlign: "center" }}>
        🏆 Bảng Xếp Hạng Người Dùng
      </Title>
      <Table columns={columns} dataSource={data} pagination={false} />
    </Card>
  );
};

export default RankingBoard;
