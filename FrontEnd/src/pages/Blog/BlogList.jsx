import React, { useEffect, useState } from "react";
import { Card, List, Button, Tag, Avatar, Typography, Badge, Spin, Empty, Modal, Form, Input, message, Layout } from "antd";
import { PlusOutlined, StarFilled } from "@ant-design/icons";
import axios from "axios";
import Navbar from "../../layouts/Navbar";
import "./Blog.css";

const { Title, Paragraph } = Typography;

export default function BlogList() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    // Lấy danh sách blog từ API
    const fetchBlogs = async () => {
        setLoading(true);
        try {
            const res = await axios.get("http://localhost:5000/api/community");
            setBlogs(res.data);
        } catch (err) {
            message.error("Lỗi khi tải danh sách blog");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, []);

    // Phân loại blog nổi bật
    const featuredBlogs = blogs.filter((b) => b.is_featured);
    const normalBlogs = blogs.filter((b) => !b.is_featured);

    // Gửi bài viết mới
    const handleCreateBlog = async (values) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                "http://localhost:5000/api/community",
                {
                    title: values.title,
                    content: values.content,
                },
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    withCredentials: true,
                }
            );
            setIsModalOpen(false);
            form.resetFields();
            message.success("Đã gửi bài viết, chờ duyệt!");
            fetchBlogs(); // Refresh lại danh sách
        } catch (err) {
            message.error(
                err.response?.data?.message || "Lỗi khi gửi bài viết, hãy thử lại!"
            );
        }
    };

    return (
        <Layout>
            <Navbar />
            <div className="blog-page">
                <div className="blog-content-container">
                    <div className="blog-header">
                        <Title level={2} style={{ color: "#389e0d" }}>Blog cộng đồng</Title>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            style={{ background: "#52c41a", borderColor: "#52c41a" }}
                            onClick={() => setIsModalOpen(true)}
                        >
                            Viết bài mới
                        </Button>
                    </div>

                    {loading ? (
                        <Spin size="large" />
                    ) : (
                        <>
                            {/* Blog nổi bật */}
                            {featuredBlogs.length > 0 && (
                                <div className="featured-blogs">
                                    <Title level={4} style={{ color: "#52c41a" }}>Bài viết nổi bật</Title>
                                    <List
                                        grid={{ gutter: 16, column: 2 }}
                                        dataSource={featuredBlogs}
                                        renderItem={item => (
                                            <List.Item>
                                                <Badge.Ribbon text="Nổi bật" color="green">
                                                    <Card
                                                        title={
                                                            <span>
                                                                <StarFilled style={{ color: "#faad14" }} /> {item.title}
                                                            </span>
                                                        }
                                                        extra={<Tag color={item.status === "approved" ? "green" : "orange"}>{item.status === "approved" ? "Đã duyệt" : "Chờ duyệt"}</Tag>}
                                                        style={{ borderColor: "#52c41a" }}
                                                    >
                                                        <Paragraph ellipsis={{ rows: 3 }}>{item.content}</Paragraph>
                                                        <div className="blog-meta">
                                                            <Avatar src={item.avatar} style={{ backgroundColor: "#87d068" }}>{item.author?.[0] || "U"}</Avatar>
                                                            <span style={{ marginLeft: 8 }}>{item.author || item.full_name || "Ẩn danh"}</span>
                                                            <span style={{ float: "right", color: "#888" }}>{item.created_at?.slice(0, 10)}</span>
                                                        </div>
                                                    </Card>
                                                </Badge.Ribbon>
                                            </List.Item>
                                        )}
                                    />
                                </div>
                            )}

                            {/* Blog thường */}
                            <div className="normal-blogs">
                                <Title level={4} style={{ color: "#389e0d" }}>Tất cả bài viết</Title>
                                <List
                                    itemLayout="vertical"
                                    dataSource={normalBlogs}
                                    locale={{ emptyText: <Empty description="Chưa có bài viết nào" /> }}
                                    renderItem={item => (
                                        <List.Item>
                                            <Card
                                                title={item.title}
                                                extra={<Tag color={item.status === "approved" ? "green" : "orange"}>{item.status === "approved" ? "Đã duyệt" : "Chờ duyệt"}</Tag>}
                                            >
                                                <Paragraph ellipsis={{ rows: 2 }}>{item.content}</Paragraph>
                                                <div className="blog-meta">
                                                    <Avatar src={item.avatar} style={{ backgroundColor: "#87d068" }}>{item.author?.[0] || "U"}</Avatar>
                                                    <span style={{ marginLeft: 8 }}>{item.author || item.full_name || "Ẩn danh"}</span>
                                                    <span style={{ float: "right", color: "#888" }}>{item.created_at?.slice(0, 10)}</span>
                                                </div>
                                            </Card>
                                        </List.Item>
                                    )}
                                />
                            </div>
                        </>
                    )}

                    <Modal
                        title="Viết bài mới"
                        open={isModalOpen}
                        onCancel={() => setIsModalOpen(false)}
                        footer={null}
                    >
                        <Form form={form} layout="vertical" onFinish={handleCreateBlog}>
                            <Form.Item
                                label="Tiêu đề"
                                name="title"
                                rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                label="Nội dung"
                                name="content"
                                rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
                            >
                                <Input.TextArea rows={5} />
                            </Form.Item>
                            <Button type="primary" htmlType="submit" style={{ background: "#52c41a", borderColor: "#52c41a" }}>
                                Gửi bài viết
                            </Button>
                        </Form>
                    </Modal>
                </div>
            </div>
        </Layout>
    );
} 