// Community Blog Page with enhanced UI and carousel
import React, { useEffect, useState } from "react";
import {
  Card,
  List,
  Button,
  Tag,
  Avatar,
  Typography,
  Badge,
  Spin,
  Empty,
  Modal,
  Form,
  Input,
  message,
  Layout,
  Divider,
  Carousel,
  Space,
} from "antd";
import { PlusOutlined, StarFilled } from "@ant-design/icons";
import axios from "axios";
import Navbar from "../../layouts/Navbar";
import CommentSection from "./CommentSection";
import "./Blog.css";

const { Title, Paragraph, Text } = Typography;
const { Content } = Layout;

export default function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [viewBlog, setViewBlog] = useState(null);
  const token = localStorage.getItem("token");

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/community");
      setBlogs(res.data);
    } catch (err) {
      message.error("Lỗi khi tải danh sách blog");
      console.error("Error fetching blogs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleCreateBlog = async (values) => {
    console.log("Form values:", values); // Debug log
    console.log("Token:", token); // Debug log

    if (!token) {
      message.error("Bạn cần đăng nhập để viết bài!");
      return;
    }

    try {
      console.log("Sending request with data:", values); // Debug log
      const response = await axios.post(
        "http://localhost:5000/api/community",
        values,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Response:", response.data); // Debug log
      setIsModalOpen(false);
      form.resetFields();
      message.success("Bài viết đã gửi và chờ duyệt.");
      fetchBlogs(); // Refresh the blog list
    } catch (err) {
      console.error("Error creating blog:", err); // Debug log
      console.error("Error response:", err.response); // Debug log
      message.error(err.response?.data?.message || "Lỗi khi gửi bài viết.");
    }
  };

  const handleModalOpen = () => {
    console.log("Opening modal"); // Debug log
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    console.log("Closing modal"); // Debug log
    setIsModalOpen(false);
    form.resetFields();
  };

  const featuredBlogs = blogs.slice(0, 2);
  const normalBlogs = blogs.slice(2);

  return (
    <Layout>
      <Navbar />
      <Content
        style={{
          background: "#d2f7c5",
          minHeight: "100vh",
          padding: "40px 16px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            background: "#fff",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
            padding: "40px 24px",
          }}
        >
          {/* ✅ Toàn bộ nội dung blog nằm trong đây */}
          <div className="blog-header">
            <Title level={2} style={{ color: "#389e0d" }}>
              Blog Cộng Đồng
            </Title>
            {token && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ background: "#52c41a", borderColor: "#52c41a" }}
                onClick={handleModalOpen}
              >
                Viết bài mới
              </Button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", margin: "50px 0" }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              {featuredBlogs.length > 0 && (
                <div className="featured-blogs">
                  <Title level={4} style={{ color: "#52c41a" }}>
                    Bài Viết Nổi Bật
                  </Title>
                  <Carousel autoplay dots={true}>
                    {featuredBlogs.map((item) => (
                      <div key={item.post_id}>
                        <Badge.Ribbon text="Nổi bật" color="green">
                          <Card
                            hoverable
                            onClick={() => setViewBlog(item)}
                            title={
                              <Text strong>
                                <StarFilled
                                  style={{ color: "#faad14", marginRight: 8 }}
                                />
                                {item.title}
                              </Text>
                            }
                            style={{ borderColor: "#52c41a", margin: "0 20px" }}
                          >
                            <Paragraph ellipsis={{ rows: 3 }}>
                              {item.content}
                            </Paragraph>
                            <Divider style={{ margin: "12px 0" }} />
                            <Space>
                              <Avatar src={item.avatar}>
                                {item.full_name?.[0] || "U"}
                              </Avatar>
                              <Text strong>{item.full_name || "Ẩn danh"}</Text>
                              <Text type="secondary">
                                •{" "}
                                {new Date(item.created_at).toLocaleDateString()}
                              </Text>
                            </Space>
                          </Card>
                        </Badge.Ribbon>
                      </div>
                    ))}
                  </Carousel>
                </div>
              )}

              <Divider />

              <div className="normal-blogs">
                <Title level={4} style={{ color: "#389e0d" }}>
                  Tất Cả Bài Viết
                </Title>
                <List
                  itemLayout="vertical"
                  dataSource={normalBlogs}
                  pagination={{ pageSize: 5 }}
                  locale={{
                    emptyText: <Empty description="Chưa có bài viết nào." />,
                  }}
                  renderItem={(item) => (
                    <List.Item>
                      <Card hoverable onClick={() => setViewBlog(item)}>
                        <Card.Meta
                          avatar={
                            <Avatar
                              src={item.avatar}
                              style={{ backgroundColor: "#87d068" }}
                            >
                              {item.full_name?.[0] || "U"}
                            </Avatar>
                          }
                          title={<Title level={5}>{item.title}</Title>}
                          description={`Đăng bởi ${
                            item.full_name || "Ẩn danh"
                          } vào ${new Date(
                            item.created_at
                          ).toLocaleDateString()}`}
                        />
                        <Paragraph
                          ellipsis={{ rows: 2 }}
                          style={{ marginTop: 16 }}
                        >
                          {item.content}
                        </Paragraph>
                      </Card>
                    </List.Item>
                  )}
                />
              </div>
            </>
          )}

          {/* Modal viết bài */}
          <Modal
            title="Viết bài mới"
            open={isModalOpen}
            onCancel={handleModalClose}
            footer={null}
            width={600}
            destroyOnClose
            maskClosable={false}
            style={{ zIndex: 1000 }}
            bodyStyle={{ padding: "24px" }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleCreateBlog}
              initialValues={{ title: "", content: "" }}
            >
              <Form.Item
                label="Tiêu đề"
                name="title"
                rules={[
                  { required: true, message: "Vui lòng nhập tiêu đề" },
                  { min: 5, message: "Tiêu đề phải có ít nhất 5 ký tự" },
                ]}
              >
                <Input
                  placeholder="Nhập tiêu đề bài viết..."
                  style={{ height: "40px" }}
                />
              </Form.Item>
              <Form.Item
                label="Nội dung"
                name="content"
                rules={[
                  { required: true, message: "Vui lòng nhập nội dung" },
                  { min: 20, message: "Nội dung phải có ít nhất 20 ký tự" },
                ]}
              >
                <Input.TextArea
                  rows={8}
                  placeholder="Nhập nội dung bài viết..."
                  showCount
                  maxLength={2000}
                />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{ width: "100%", height: "40px" }}
                >
                  Gửi Bài Viết
                </Button>
              </Form.Item>
            </Form>
          </Modal>

          {/* Modal xem bài viết */}
          <Modal
            open={!!viewBlog}
            onCancel={() => setViewBlog(null)}
            footer={null}
            title={viewBlog?.title}
            width={700}
          >
            <Paragraph>{viewBlog?.content}</Paragraph>
            <Divider />
            <Space>
              <Avatar src={viewBlog?.avatar}>
                {viewBlog?.full_name?.[0] || "U"}
              </Avatar>
              <Text strong>{viewBlog?.full_name || "Ẩn danh"}</Text>
              <Text type="secondary">
                {viewBlog && new Date(viewBlog.created_at).toLocaleDateString()}
              </Text>
            </Space>
            <Divider />
            {viewBlog && (
              <CommentSection postId={viewBlog.post_id} token={token} />
            )}
          </Modal>
        </div>
      </Content>
    </Layout>
  );
}
