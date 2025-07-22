// PostApprovalContent.jsx - Content-only version for AdminPage integration
import React, { useState, useEffect } from "react";
import {
  List,
  Button,
  message,
  Spin,
  Empty,
  Typography,
  Popconfirm,
  Avatar,
  Card,
  Space,
  Row,
  Col,
  Badge,
  Divider,
  Statistic,
} from "antd";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import axios from "axios";
import "./PostApproval.css";

const { Title, Paragraph, Text } = Typography;

const PostApprovalContent = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingPosts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/api/community/pending",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPosts(res.data);
    } catch (error) {
      message.error("Không thể tải danh sách bài viết chờ duyệt.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPosts();
  }, []);

  const handleApprove = async (postId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/community/${postId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      message.success("Bài viết đã được duyệt.");
      fetchPendingPosts();
    } catch (error) {
      message.error("Có lỗi xảy ra khi duyệt bài.");
      console.error(error);
    }
  };

  const handleDelete = async (postId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/community/admin/${postId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      message.success("Bài viết đã được xóa.");
      fetchPendingPosts();
    } catch (error) {
      message.error("Có lỗi xảy ra khi xóa bài viết.");
      console.error(error);
    }
  };

  return (
    <div className="post-approval-container">
      {/* Header with Title and Stats */}
      <div className="post-approval-header">
        <Row gutter={[24, 24]} align="middle">
          <Col span={12}>
            <Title level={3} style={{ margin: 0, color: "#1890ff" }}>
              <EyeOutlined style={{ marginRight: 8 }} />
              Quản lý bài viết
            </Title>
            <Text type="secondary">Duyệt và quản lý bài viết từ cộng đồng</Text>
          </Col>
          <Col span={12}>
            <Row gutter={16} justify="end">
              <Col>
                <Statistic
                  title="Bài viết chờ duyệt"
                  value={posts.length}
                  valueStyle={{ color: "#1890ff", fontSize: "24px" }}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </div>

      <Divider style={{ margin: "24px 0" }} />

      {/* Content */}
      <div className="post-approval-content">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
            <Text
              style={{ marginTop: 16, display: "block", textAlign: "center" }}
            >
              Đang tải danh sách bài viết...
            </Text>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-container">
            <Empty
              description={
                <div>
                  <Text style={{ fontSize: 16, color: "#666" }}>
                    Không có bài viết nào chờ duyệt
                  </Text>
                  <br />
                  <Text type="secondary">
                    Tất cả bài viết đã được xử lý hoặc chưa có bài viết mới
                  </Text>
                </div>
              }
              style={{ marginTop: 60 }}
            />
          </div>
        ) : (
          <List
            itemLayout="vertical"
            size="large"
            dataSource={posts}
            renderItem={(item) => (
              <List.Item key={item.post_id} className="post-item">
                <Card
                  hoverable
                  className="post-card"
                  actions={[
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleApprove(item.post_id)}
                      size="large"
                    >
                      Duyệt bài
                    </Button>,
                    <Popconfirm
                      title="Xóa bài viết"
                      description="Bạn có chắc muốn xóa vĩnh viễn bài viết này?"
                      onConfirm={() => handleDelete(item.post_id)}
                      okText="Xóa"
                      cancelText="Hủy"
                      okType="danger"
                    >
                      <Button danger icon={<DeleteOutlined />} size="large">
                        Xóa bài
                      </Button>
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        src={item.avatar}
                        size={48}
                        icon={<UserOutlined />}
                      >
                        {item.full_name?.[0] || "U"}
                      </Avatar>
                    }
                    title={
                      <div className="post-title">
                        <Text strong style={{ fontSize: 18, color: "#1890ff" }}>
                          {item.title}
                        </Text>
                        <Badge
                          status="processing"
                          text="Chờ duyệt"
                          style={{ marginLeft: 12 }}
                        />
                      </div>
                    }
                    description={
                      <Space
                        direction="vertical"
                        size={4}
                        style={{ width: "100%" }}
                      >
                        <Space>
                          <UserOutlined style={{ color: "#666" }} />
                          <Text type="secondary">
                            Tác giả:{" "}
                            <Text strong>{item.full_name || "Không rõ"}</Text>
                          </Text>
                        </Space>
                        <Space>
                          <CalendarOutlined style={{ color: "#666" }} />
                          <Text type="secondary">
                            Ngày gửi:{" "}
                            {new Date(item.created_at).toLocaleString("vi-VN")}
                          </Text>
                        </Space>
                      </Space>
                    }
                  />
                  <div className="post-content">
                    <Paragraph
                      style={{
                        marginTop: 16,
                        fontSize: 15,
                        lineHeight: 1.6,
                        color: "#333",
                      }}
                    >
                      {item.content}
                    </Paragraph>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default PostApprovalContent;
