import React, { useEffect, useState } from "react";
import { Card, List, Button, Tag, Avatar, Typography, Badge, Spin, Empty, Modal, Form, Input, message, Layout, Divider } from "antd";
import { PlusOutlined, StarFilled } from "@ant-design/icons";
import axios from "axios";
import Navbar from "../../layouts/Navbar";
import "./Blog.css";

const { Title, Paragraph } = Typography;
const { Content } = Layout;

export default function BlogList() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const token = localStorage.getItem("token"); // Get token once
    const [viewBlog, setViewBlog] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentLoading, setCommentLoading] = useState(false);
    const [commentContent, setCommentContent] = useState("");

    const fetchBlogs = async () => {
        setLoading(true);
        try {
            // API giờ chỉ trả về các bài đã duyệt
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

    useEffect(() => {
        if (viewBlog) {
            fetchComments(viewBlog.post_id);
        }
    }, [viewBlog]);

    const fetchComments = async (postId) => {
        setCommentLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/comment/${postId}`);
            setComments(res.data);
        } catch (err) {
            message.error("Lỗi khi tải bình luận");
        } finally {
            setCommentLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!commentContent.trim()) return;
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                "http://localhost:5000/api/comment/",
                { post_id: viewBlog.post_id, content: commentContent },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCommentContent("");
            fetchComments(viewBlog.post_id); // Refresh comment list
        } catch (err) {
            message.error("Lỗi khi gửi bình luận");
        }
    };

    // Coi 2 bài mới nhất là bài nổi bật
    const featuredBlogs = blogs.slice(0, 2);
    const normalBlogs = blogs.slice(2);

    const handleCreateBlog = async (values) => {
        if (!token) {
            message.error("Bạn cần đăng nhập để viết bài!");
            return;
        }
        try {
            await axios.post(
                "http://localhost:5000/api/community",
                {
                    title: values.title,
                    content: values.content,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setIsModalOpen(false);
            form.resetFields();
            message.success("Đã gửi bài viết thành công! Bài viết của bạn sẽ được hiển thị sau khi được duyệt.");
            // Không cần fetchBlogs() lại vì bài mới chưa được duyệt
        } catch (err) {
            message.error(
                err.response?.data?.message || "Lỗi khi gửi bài viết, hãy thử lại!"
            );
        }
    };

    return (
        <Layout>
            <Navbar />
            <Content style={{ padding: '0 50px', marginTop: '20px' }}>
                <div className="blog-page">
                    <div className="blog-content-container">
                        <div className="blog-header">
                            <Title level={2} style={{ color: "#389e0d" }}>Blog Cộng Đồng</Title>
                            {token && (
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    style={{ background: "#52c41a", borderColor: "#52c41a" }}
                                    onClick={() => setIsModalOpen(true)}
                                >
                                    Viết bài mới
                                </Button>
                            )}
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', margin: '50px 0' }}>
                                <Spin size="large" />
                            </div>
                        ) : (
                            <>
                                {/* Blog nổi bật */}
                                {featuredBlogs.length > 0 && (
                                    <div className="featured-blogs">
                                        <Title level={4} style={{ color: "#52c41a" }}>Bài Viết Nổi Bật</Title>
                                        <List
                                            grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
                                            dataSource={featuredBlogs}
                                            renderItem={item => (
                                                <List.Item>
                                                    <Badge.Ribbon text="Nổi bật" color="green">
                                                        <Card
                                                            hoverable
                                                            onClick={() => setViewBlog(item)}
                                                            title={
                                                                <span style={{ fontWeight: 'bold' }}>
                                                                    <StarFilled style={{ color: "#faad14", marginRight: 8 }} /> {item.title}
                                                                </span>
                                                            }
                                                            style={{ borderColor: "#52c41a" }}
                                                        >
                                                            <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: 'Xem thêm' }}>{item.content}</Paragraph>
                                                            <div className="blog-meta">
                                                                <Avatar src={item.avatar} style={{ backgroundColor: "#87d068" }}>{item.full_name?.[0] || "U"}</Avatar>
                                                                <span style={{ marginLeft: 8, fontWeight: 500 }}>{item.full_name || "Ẩn danh"}</span>
                                                                <span style={{ float: "right", color: "#888" }}>{new Date(item.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                        </Card>
                                                    </Badge.Ribbon>
                                                </List.Item>
                                            )}
                                        />
                                    </div>
                                )}

                                <Divider />

                                {/* Blog thường */}
                                <div className="normal-blogs">
                                    <Title level={4} style={{ color: "#389e0d" }}>Tất Cả Bài Viết</Title>
                                    <List
                                        itemLayout="vertical"
                                        dataSource={normalBlogs}
                                        pagination={{
                                            pageSize: 5,
                                        }}
                                        locale={{ emptyText: <Empty description="Chưa có bài viết nào." /> }}
                                        renderItem={item => (
                                            <List.Item>
                                                <Card hoverable>
                                                    <Card.Meta
                                                        avatar={<Avatar src={item.avatar} style={{ backgroundColor: "#87d068" }}>{item.full_name?.[0] || "U"}</Avatar>}
                                                        title={<Title level={5}>{item.title}</Title>}
                                                        description={`Đăng bởi ${item.full_name || "Ẩn danh"} vào ${new Date(item.created_at).toLocaleDateString()}`}
                                                    />
                                                    <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: 'Xem thêm' }} style={{ marginTop: 16 }}>
                                                        {item.content}
                                                    </Paragraph>
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
                                    Gửi Bài Viết
                                </Button>
                            </Form>
                        </Modal>

                        <Modal
                            open={!!viewBlog}
                            onCancel={() => setViewBlog(null)}
                            footer={null}
                            title={viewBlog?.title}
                        >
                            <Paragraph>{viewBlog?.content}</Paragraph>
                            <div>
                                <Avatar src={viewBlog?.avatar} style={{ backgroundColor: "#87d068" }}>
                                    {viewBlog?.full_name?.[0] || "U"}
                                </Avatar>
                                <span style={{ marginLeft: 8, fontWeight: 500 }}>{viewBlog?.full_name || "Ẩn danh"}</span>
                                <span style={{ float: "right", color: "#888" }}>{viewBlog && new Date(viewBlog.created_at).toLocaleDateString()}</span>
                            </div>
                            <Divider />
                            <Typography.Title level={5}>Bình luận</Typography.Title>
                            {commentLoading ? <Spin /> : (
                                <List
                                    dataSource={comments}
                                    locale={{ emptyText: "Chưa có bình luận nào." }}
                                    renderItem={item => (
                                        <List.Item>
                                            <List.Item.Meta
                                                avatar={<Avatar>{item.full_name?.[0] || "U"}</Avatar>}
                                                title={item.full_name || "Ẩn danh"}
                                                description={item.content}
                                            />
                                            <span style={{ color: "#888", fontSize: 12 }}>{new Date(item.created_at).toLocaleString()}</span>
                                        </List.Item>
                                    )}
                                />
                            )}
                            {token && (
                                <Input.Group compact style={{ marginTop: 8 }}>
                                    <Input.TextArea
                                        value={commentContent}
                                        onChange={e => setCommentContent(e.target.value)}
                                        rows={2}
                                        placeholder="Nhập bình luận..."
                                        style={{ width: "80%" }}
                                    />
                                    <Button type="primary" onClick={handleAddComment}>Gửi</Button>
                                </Input.Group>
                            )}
                        </Modal>
                    </div>
                </div>
            </Content>
        </Layout>
    );
} 