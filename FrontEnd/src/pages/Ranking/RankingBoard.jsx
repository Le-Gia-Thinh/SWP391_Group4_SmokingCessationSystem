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
  Layout,
} from "antd";
import {
  CrownTwoTone,
  StarTwoTone,
  UserOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import Navbar from "../../layouts/Navbar";
import "./RankingBoard.css";

const { Header, Content } = Layout;
const { Title } = Typography;

const levelColors = {
  Beginner: "default",
  Intermediate: "blue",
  Advanced: "green",
  Master: "gold",
};

const RankingBoard = () => {
  const [data, setData] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [activeTab, setActiveTab] = useState("ranking");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [myRank, setMyRank] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(payload.id);
      } catch (e) {
        console.error("Lỗi giải mã token:", e);
      }
    }

    fetch("http://localhost:5000/api/user-score/ranking")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .catch((err) => console.error("Lỗi lấy bảng xếp hạng:", err));

    if (token) {
      fetch("http://localhost:5000/api/user-score/ranking/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.success && res.data) setMyRank(res.data);
        })
        .catch((err) =>
          console.error("Lỗi lấy thứ hạng người dùng hiện tại:", err)
        );

      fetch("http://localhost:5000/api/achievement/unlocked", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setAchievements(data);
          } else {
            console.error("Dữ liệu thành tựu không hợp lệ:", data);
            setAchievements([]);
          }
        })
        .catch((err) => console.error("Lỗi lấy thành tựu:", err));
    }
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
    <Layout style={{ minHeight: "100vh", background: "#f6faff" }}>
      <Header style={{ background: "#fff", padding: 0 }}>
        <Navbar />
      </Header>

      <Content style={{ margin: 0, padding: 0, width: "100%" }}>
        <Card className="ranking-board-container"
          style={{
            border: "1px solid #91d5ff",
            borderRadius: 20,
            background: "#ffffff",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
            margin: 0,
            width: "100%",
          }}
          bodyStyle={{ padding: 0 }}
        >
          <div style={{ padding: 24 }}>
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
              {activeTab === "ranking"
                ? "🏆 Bảng Xếp Hạng Người Dùng"
                : "🥇 Danh Sách Thành Tựu"}
            </Title>

            {activeTab === "ranking" && (
              <>
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

                {myRank && (
                  <>
                    <div
                      style={{
                        marginTop: 32,
                        fontWeight: "bold",
                        color: "#1890ff",
                        textAlign: "center",
                      }}
                    >
                      🌟 Vị trí của bạn
                    </div>
                    <Table
                      columns={columns}
                      dataSource={[myRank]}
                      pagination={false}
                      rowKey="user_id"
                      rowClassName="highlight-row"
                      style={{ marginTop: 12 }}
                    />
                  </>
                )}
              </>
            )}

            {activeTab === "achievements" && (
              <div style={{ padding: 16 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: 16,
                    marginTop: 24,
                  }}
                >
                  {achievements.map((ach, index) => (
                    <Card
                      key={ach.achievement_id}
                      className="animated-card"
                      title={
                        <div style={{ wordBreak: "break-word" }}>
                          <div style={{ fontWeight: 600 }}>
                            <TrophyOutlined /> {ach.title}
                          </div>
                          {ach.unlocked && (
                            <div style={{ marginTop: 4 }}>
                              <Tag color="green">✅ Đã đạt</Tag>
                            </div>
                          )}
                        </div>
                      }
                      bordered
                      style={{
                        animationDelay: `${index * 0.1}s`,
                        borderRadius: 12,
                        backgroundColor: ach.unlocked ? "#f6ffed" : "#ffffff",
                        borderColor: ach.unlocked ? "#b7eb8f" : undefined,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        height: "220px"
                      }}
                    >
                      <p style={{ marginBottom: 12 }}>{ach.description}</p>
                      <div className="tag-nowrap">
                        <Tag color="purple">Giai đoạn {ach.phase}</Tag>
                        <Tag color="blue">{ach.achievement_type}</Tag>
                        <Tag color="green">Độ khó: {ach.difficulty_level}</Tag>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default RankingBoard;
