import React, { useState, useEffect, useRef } from "react";
import {
    Layout,
    Card,
    Input,
    Button,
    List,
    Avatar,
    Typography,
    Tabs,
    Modal,
    Form,
    message,
    Space,
    Divider,
    Badge,
    Spin,
    Empty,
    Tag,
    Carousel,
} from "antd";
import {
    SendOutlined,
    PlusOutlined,
    MessageOutlined,
    UserOutlined,
    ClockCircleOutlined,
    TeamOutlined,
    FileTextOutlined,
    StarFilled,
} from "@ant-design/icons";
import axios from "axios";
import Navbar from "../../layouts/Navbar";
import { useSocket } from "../../contexts/SocketContext";
import CommentSection from "./CommentSection";
import "./CommunityPage.css";
import moment from 'moment-timezone';
import BlogSection from "./BlogSection";
import ChatSection from "./ChatSection";

const { Content } = Layout;
const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function CommunityPage() {
    // Blog states
    const [blogs, setBlogs] = useState([]);
    const [blogLoading, setBlogLoading] = useState(true);
    const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
    const [viewBlog, setViewBlog] = useState(null);
    const [blogForm] = Form.useForm();

    // Common states
    const [activeMainTab, setActiveMainTab] = useState("blog");
    const messagesEndRef = useRef(null);
    const token = localStorage.getItem("token");
    const [topicForm] = Form.useForm();

    // Socket.IO
    const { socket, isConnected } = useSocket();

    // Auto scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [blogs]);

    // ========== BLOG FUNCTIONS ==========
    const fetchBlogs = async () => {
        setBlogLoading(true);
        try {
            const res = await axios.get("http://localhost:5000/api/community");
            setBlogs(res.data);
        } catch (err) {
            message.error("Lỗi khi tải danh sách blog");
            console.error("Error fetching blogs:", err);
        } finally {
            setBlogLoading(false);
        }
    };

    const handleCreateBlog = async (values) => {
        if (!token) {
            message.error("Bạn cần đăng nhập để viết bài!");
            return;
        }

        try {
            const response = await axios.post(
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

    // Handle main tab change
    const handleMainTabChange = (key) => {
        setActiveMainTab(key);
        if (key === "blog") {
            fetchBlogs();
        }
    };

    // Format functions
    const formatDate = (dateString) => {
        if (!dateString) return '';
        return moment.parseZone(dateString).format('HH:mm:ss DD/MM/YYYY');
    };

    const formatSessionTime = (dateTimeString) => {
        if (!dateTimeString) return '';
        return moment.parseZone(dateTimeString).format('HH:mm:ss DD/MM/YYYY');
    };

    const isSessionActive = (session) => {
        const now = moment();
        const start = moment.parseZone(session.scheduled_time);
        const end = moment(start).add(session.duration_minutes, 'minutes');
        const allowedStart = moment(start).subtract(15, 'minutes');
        const allowedEnd = moment(end).add(15, 'minutes');
        return now.isBetween(allowedStart, allowedEnd, null, '[]');
    };

    // Load initial data
    useEffect(() => {
        fetchBlogs();
    }, []);

    const featuredBlogs = blogs.slice(0, 2);
    const normalBlogs = blogs.slice(2);

    return (
        <Layout className="community-page">
            <Navbar />
            <Content className="community-content">
                <div className="community-container">
                    <Card className="community-card">
                        <Tabs
                            activeKey={activeMainTab}
                            onChange={handleMainTabChange}
                            items={[
                                {
                                    key: "blog",
                                    label: (
                                        <span>
                                            <FileTextOutlined />
                                            Blog Cộng Đồng
                                        </span>
                                    ),
                                    children: (
                                        <BlogSection token={token} />
                                    ),
                                },
                                {
                                    key: "chat",
                                    label: (
                                        <span>
                                            <MessageOutlined />
                                            Chat Cộng Đồng
                                        </span>
                                    ),
                                    children: (
                                        <ChatSection token={token} socket={socket} isConnected={isConnected} />
                                    ),
                                },
                            ]}
                        />
                    </Card>
                </div>
            </Content>

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
        </Layout>
    );
} 