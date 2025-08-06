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
  Modal,
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
import "../Community/BlogSection.css"; // Import CSS cho styling HTML content

const { Title, Paragraph, Text } = Typography;

const PostApprovalContent = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewModal, setPreviewModal] = useState({
    visible: false,
    post: null,
  });

  // Cho phép scroll background khi modal mở
  useEffect(() => {
    if (previewModal.visible) {
      document.body.style.overflow = "unset";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [previewModal.visible]);

  // Function to get preview text from HTML content
  const getPreviewText = (htmlContent, maxLength = 200) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent || "";
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    return textContent.length > maxLength
      ? textContent.substring(0, maxLength) + "..."
      : textContent;
  };

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

  const showPreviewModal = (post) => {
    setPreviewModal({
      visible: true,
      post: post,
    });
  };

  const hidePreviewModal = () => {
    setPreviewModal({
      visible: false,
      post: null,
    });
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
                      type="default"
                      icon={<EyeOutlined />}
                      onClick={() => showPreviewModal(item)}
                      size="large"
                    >
                      Xem đầy đủ
                    </Button>,
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
                            {new Date(item.created_at).toLocaleString("vi-VN", {
                              timeZone: "UTC",
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: false,
                            })}
                          </Text>
                        </Space>
                      </Space>
                    }
                  />
                  <div className="post-content blog-content">
                    <div
                      style={{
                        marginTop: 16,
                        fontSize: 15,
                        lineHeight: 1.6,
                        color: "#333",
                        maxHeight: "400px",
                        overflow: "auto",
                        border: "1px solid #f0f0f0",
                        borderRadius: "6px",
                        padding: "16px",
                        backgroundColor: "#fafafa",
                      }}
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                    {/* Preview text for accessibility */}
                    <Text
                      type="secondary"
                      style={{
                        display: "block",
                        marginTop: 8,
                        fontSize: 12,
                        fontStyle: "italic",
                      }}
                    >
                      Preview: {getPreviewText(item.content, 100)}
                    </Text>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        )}
      </div>

      {/* Preview Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <EyeOutlined style={{ color: "#1890ff" }} />
            <span>Xem trước bài viết</span>
          </div>
        }
        open={previewModal.visible}
        onCancel={hidePreviewModal}
        width="80%"
        style={{ maxWidth: "1000px" }}
        footer={[
          <Button key="cancel" onClick={hidePreviewModal}>
            Đóng
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => {
              handleApprove(previewModal.post?.post_id);
              hidePreviewModal();
            }}
          >
            Duyệt bài
          </Button>,
          <Popconfirm
            key="delete"
            title="Xóa bài viết"
            description="Bạn có chắc muốn xóa vĩnh viễn bài viết này?"
            onConfirm={() => {
              handleDelete(previewModal.post?.post_id);
              hidePreviewModal();
            }}
            okText="Xóa"
            cancelText="Hủy"
            okType="danger"
          >
            <Button danger icon={<DeleteOutlined />}>
              Xóa bài
            </Button>
          </Popconfirm>,
        ]}
      >
        {previewModal.post && (
          <div>
            <div
              style={{
                marginBottom: 24,
                padding: 16,
                background: "#fafafa",
                borderRadius: 8,
              }}
            >
              <Title level={3} style={{ margin: 0, color: "#1890ff" }}>
                {previewModal.post.title}
              </Title>
              <Space style={{ marginTop: 12 }}>
                <Avatar
                  src={previewModal.post.avatar}
                  size={32}
                  icon={<UserOutlined />}
                >
                  {previewModal.post.full_name?.[0] || "U"}
                </Avatar>
                <div>
                  <Text strong>
                    {previewModal.post.full_name || "Không rõ"}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(previewModal.post.created_at).toLocaleString(
                      "vi-VN",
                      {
                        timeZone: "UTC",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      }
                    )}
                  </Text>
                </div>
              </Space>
            </div>

            <div
              className="blog-content"
              style={{
                padding: 20,
                border: "1px solid #f0f0f0",
                borderRadius: 8,
                backgroundColor: "#fff",
                maxHeight: "500px",
                overflow: "auto",
              }}
              dangerouslySetInnerHTML={{ __html: previewModal.post.content }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PostApprovalContent;
