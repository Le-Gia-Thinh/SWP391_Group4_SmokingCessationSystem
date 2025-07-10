import React, { useState, useEffect } from "react";
import {
    Typography,
    Button,
    Spin,
    Divider,
    List,
    Card,
    Avatar,
    Empty,
    Badge,
    Carousel,
    Modal,
    Form,
    message,
    Space
} from "antd";
import {
    PlusOutlined,
    StarFilled
} from "@ant-design/icons";
import axios from "axios";
import CommentSection from "./CommentSection";

const { Paragraph, Title, Text } = Typography;

export default function BlogSection({ token }) {
    const [blogs, setBlogs] = useState([]);
    const [blogLoading, setBlogLoading] = useState(true);
    const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
    const [viewBlog, setViewBlog] = useState(null);
    const [blogForm] = Form.useForm();

    const fetchBlogs = async () => {
        setBlogLoading(true);
        try {
            const res = await axios.get("http://localhost:5000/api/community");
            setBlogs(res.data);
        } catch (err) {
            message.error("Lỗi khi tải danh sách blog");
        } finally {
            setBlogLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, []);

    const handleCreateBlog = async (values) => {
        if (!token) {
            message.error("Bạn cần đăng nhập để viết bài!");
            return;
        }
        try {
            await axios.post(
                "http://localhost:5000/api/community",
                values,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setIsBlogModalOpen(false);
            blogForm.resetFields();
            message.success("Bài viết đã gửi và chờ duyệt.");
            fetchBlogs();
        } catch (err) {
            message.error(err.response?.data?.message || "Lỗi khi gửi bài viết.");
        }
    };

    const featuredBlogs = blogs.slice(0, 2);
    const normalBlogs = blogs.slice(2);

    return (
        <div className="blog-section">
            <div className="blog-header">
                <Title level={2} style={{ color: "#389e0d" }}>
                    Blog Cộng Đồng
                </Title>
                {token && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        style={{ background: "#52c41a", borderColor: "#52c41a" }}
                        onClick={() => setIsBlogModalOpen(true)}
                    >
                        Viết bài mới
                    </Button>
                )}
            </div>
            {blogLoading ? (
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
                                                        <StarFilled style={{ color: "#faad14", marginRight: 8 }} />
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
                                                        • {new Date(item.created_at).toLocaleDateString()}
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
                                            description={`Đăng bởi ${item.full_name || "Ẩn danh"} vào ${new Date(item.created_at).toLocaleDateString()}`}
                                        />
                                        <Paragraph ellipsis={{ rows: 2 }} style={{ marginTop: 16 }}>
                                            {item.content}
                                        </Paragraph>
                                    </Card>
                                </List.Item>
                            )}
                        />
                    </div>
                </>
            )}
            {/* Blog Modal */}
            <Modal
                title="Viết bài mới"
                open={isBlogModalOpen}
                onCancel={() => setIsBlogModalOpen(false)}
                footer={null}
                width={600}
                destroyOnClose
                maskClosable={false}
                style={{ zIndex: 1000 }}
                bodyStyle={{ padding: "24px" }}
            >
                <Form
                    form={blogForm}
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
                        <input
                            placeholder="Nhập tiêu đề bài viết..."
                            style={{ height: "40px", width: "100%", borderRadius: 8, border: '1px solid #d9d9d9' }}
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
                        <textarea
                            rows={8}
                            placeholder="Nhập nội dung bài viết..."
                            maxLength={2000}
                            style={{ width: "100%", borderRadius: 8, border: '1px solid #d9d9d9', resize: 'vertical' }}
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
            {/* View Blog Modal */}
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
    );
} 