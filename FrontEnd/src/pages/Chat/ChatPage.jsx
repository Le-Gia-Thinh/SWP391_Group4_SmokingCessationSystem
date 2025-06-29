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
    Empty
} from "antd";
import {
    SendOutlined,
    PlusOutlined,
    MessageOutlined,
    UserOutlined,
    ClockCircleOutlined
} from "@ant-design/icons";
import axios from "axios";
import Navbar from "../../layouts/Navbar";
import "./ChatPage.css";

const { Content } = Layout;
const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function ChatPage() {
    const [activeTab, setActiveTab] = useState("community");
    const [topics, setTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [communityMessages, setCommunityMessages] = useState([]);
    const [topicMessages, setTopicMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [topicsLoading, setTopicsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const token = localStorage.getItem("token");
    const [form] = Form.useForm();

    // Auto scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [communityMessages, topicMessages]);

    // Fetch topics
    const fetchTopics = async () => {
        if (!token) return;
        setTopicsLoading(true);
        try {
            const response = await axios.get(
                "http://localhost:5000/api/topic-chat/topics",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTopics(response.data);
        } catch (err) {
            message.error("Lỗi khi tải danh sách chủ đề");
        } finally {
            setTopicsLoading(false);
        }
    };

    // Fetch community messages
    const fetchCommunityMessages = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                "http://localhost:5000/api/community-chat",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCommunityMessages(response.data);
        } catch (err) {
            message.error("Lỗi khi tải tin nhắn cộng đồng");
        } finally {
            setLoading(false);
        }
    };

    // Fetch topic messages
    const fetchTopicMessages = async (topicId) => {
        if (!topicId) return;
        setLoading(true);
        try {
            const response = await axios.get(
                `http://localhost:5000/api/topic-chat/messages/${topicId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTopicMessages(response.data);
        } catch (err) {
            message.error("Lỗi khi tải tin nhắn chủ đề");
        } finally {
            setLoading(false);
        }
    };

    // Load initial data
    useEffect(() => {
        fetchCommunityMessages();
        if (token) {
            fetchTopics();
        }
    }, [token]);

    // Handle topic selection
    const handleTopicSelect = (topic) => {
        setSelectedTopic(topic);
        fetchTopicMessages(topic.topic_id);
    };

    // Send community message
    const sendCommunityMessage = async () => {
        if (!token) {
            message.error("Bạn cần đăng nhập để gửi tin nhắn!");
            return;
        }
        if (!newMessage.trim()) {
            message.error("Vui lòng nhập nội dung tin nhắn!");
            return;
        }

        try {
            await axios.post(
                "http://localhost:5000/api/community-chat",
                { content: newMessage },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewMessage("");
            fetchCommunityMessages();
        } catch (err) {
            message.error("Lỗi khi gửi tin nhắn");
        }
    };

    // Send topic message
    const sendTopicMessage = async () => {
        if (!token) {
            message.error("Bạn cần đăng nhập để gửi tin nhắn!");
            return;
        }
        if (!newMessage.trim()) {
            message.error("Vui lòng nhập nội dung tin nhắn!");
            return;
        }
        if (!selectedTopic) {
            message.error("Vui lòng chọn chủ đề!");
            return;
        }

        try {
            await axios.post(
                "http://localhost:5000/api/topic-chat/messages",
                {
                    topic_id: selectedTopic.topic_id,
                    content: newMessage
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewMessage("");
            fetchTopicMessages(selectedTopic.topic_id);
        } catch (err) {
            message.error("Lỗi khi gửi tin nhắn");
        }
    };

    // Create new topic
    const createTopic = async (values) => {
        if (!token) {
            message.error("Bạn cần đăng nhập để tạo chủ đề!");
            return;
        }

        try {
            await axios.post(
                "http://localhost:5000/api/topic-chat/topics",
                values,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setIsTopicModalOpen(false);
            form.resetFields();
            message.success("Tạo chủ đề thành công!");
            fetchTopics();
        } catch (err) {
            message.error("Lỗi khi tạo chủ đề");
        }
    };

    // Handle tab change
    const handleTabChange = (key) => {
        setActiveTab(key);
        setSelectedTopic(null);
        setTopicMessages([]);
        if (key === "community") {
            fetchCommunityMessages();
        }
    };

    // Handle enter key
    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (activeTab === "community") {
                sendCommunityMessage();
            } else {
                sendTopicMessage();
            }
        }
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString("vi-VN");
    };

    return (
        <Layout className="chat-page">
            <Navbar />
            <Content className="chat-content">
                <div className="chat-container">
                    <Card className="chat-card">
                        <Tabs
                            activeKey={activeTab}
                            onChange={handleTabChange}
                            items={[
                                {
                                    key: "community",
                                    label: (
                                        <span>
                                            <MessageOutlined />
                                            Chat Cộng Đồng
                                        </span>
                                    ),
                                    children: (
                                        <div className="chat-section">
                                            <div className="messages-container">
                                                {loading ? (
                                                    <div className="loading-container">
                                                        <Spin size="large" />
                                                    </div>
                                                ) : communityMessages.length === 0 ? (
                                                    <Empty description="Chưa có tin nhắn nào" />
                                                ) : (
                                                    <List
                                                        dataSource={communityMessages}
                                                        renderItem={(msg) => (
                                                            <List.Item className="message-item">
                                                                <div className="message-content">
                                                                    <div className="message-header">
                                                                        <Avatar icon={<UserOutlined />} />
                                                                        <Text strong>{msg.full_name || "Ẩn danh"}</Text>
                                                                        <Text type="secondary">
                                                                            <ClockCircleOutlined /> {formatDate(msg.sent_at)}
                                                                        </Text>
                                                                    </div>
                                                                    <Paragraph className="message-text">
                                                                        {msg.content}
                                                                    </Paragraph>
                                                                </div>
                                                            </List.Item>
                                                        )}
                                                    />
                                                )}
                                                <div ref={messagesEndRef} />
                                            </div>
                                            <Divider />
                                            <div className="message-input">
                                                <TextArea
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    onKeyPress={handleKeyPress}
                                                    placeholder="Nhập tin nhắn..."
                                                    rows={3}
                                                    maxLength={500}
                                                    showCount
                                                />
                                                <Button
                                                    type="primary"
                                                    icon={<SendOutlined />}
                                                    onClick={sendCommunityMessage}
                                                    disabled={!newMessage.trim()}
                                                    className="send-button"
                                                >
                                                    Gửi
                                                </Button>
                                            </div>
                                        </div>
                                    ),
                                },
                                {
                                    key: "topics",
                                    label: (
                                        <span>
                                            <MessageOutlined />
                                            Chat Theo Chủ Đề
                                        </span>
                                    ),
                                    children: (
                                        <div className="topics-section">
                                            <div className="topics-sidebar">
                                                <div className="topics-header">
                                                    <Title level={5}>Chủ Đề</Title>
                                                    {token && (
                                                        <Button
                                                            type="primary"
                                                            icon={<PlusOutlined />}
                                                            size="small"
                                                            onClick={() => setIsTopicModalOpen(true)}
                                                        >
                                                            Tạo Chủ Đề
                                                        </Button>
                                                    )}
                                                </div>
                                                {topicsLoading ? (
                                                    <Spin />
                                                ) : (
                                                    <List
                                                        dataSource={topics}
                                                        renderItem={(topic) => (
                                                            <List.Item
                                                                className={`topic-item ${selectedTopic?.topic_id === topic.topic_id ? 'selected' : ''}`}
                                                                onClick={() => handleTopicSelect(topic)}
                                                            >
                                                                <div className="topic-content">
                                                                    <Text strong>{topic.title}</Text>
                                                                    <Text type="secondary" className="topic-creator">
                                                                        Bởi: {topic.full_name}
                                                                    </Text>
                                                                    <Paragraph ellipsis={{ rows: 2 }} className="topic-description">
                                                                        {topic.description}
                                                                    </Paragraph>
                                                                </div>
                                                            </List.Item>
                                                        )}
                                                    />
                                                )}
                                            </div>
                                            <div className="topic-chat">
                                                {selectedTopic ? (
                                                    <>
                                                        <div className="topic-header">
                                                            <Title level={4}>{selectedTopic.title}</Title>
                                                            <Text type="secondary">{selectedTopic.description}</Text>
                                                        </div>
                                                        <div className="messages-container">
                                                            {loading ? (
                                                                <div className="loading-container">
                                                                    <Spin size="large" />
                                                                </div>
                                                            ) : topicMessages.length === 0 ? (
                                                                <Empty description="Chưa có tin nhắn nào trong chủ đề này" />
                                                            ) : (
                                                                <List
                                                                    dataSource={topicMessages}
                                                                    renderItem={(msg) => (
                                                                        <List.Item className="message-item">
                                                                            <div className="message-content">
                                                                                <div className="message-header">
                                                                                    <Avatar icon={<UserOutlined />} />
                                                                                    <Text strong>{msg.full_name || "Ẩn danh"}</Text>
                                                                                    <Text type="secondary">
                                                                                        <ClockCircleOutlined /> {formatDate(msg.sent_at)}
                                                                                    </Text>
                                                                                </div>
                                                                                <Paragraph className="message-text">
                                                                                    {msg.content}
                                                                                </Paragraph>
                                                                            </div>
                                                                        </List.Item>
                                                                    )}
                                                                />
                                                            )}
                                                            <div ref={messagesEndRef} />
                                                        </div>
                                                        <Divider />
                                                        <div className="message-input">
                                                            <TextArea
                                                                value={newMessage}
                                                                onChange={(e) => setNewMessage(e.target.value)}
                                                                onKeyPress={handleKeyPress}
                                                                placeholder="Nhập tin nhắn..."
                                                                rows={3}
                                                                maxLength={500}
                                                                showCount
                                                            />
                                                            <Button
                                                                type="primary"
                                                                icon={<SendOutlined />}
                                                                onClick={sendTopicMessage}
                                                                disabled={!newMessage.trim()}
                                                                className="send-button"
                                                            >
                                                                Gửi
                                                            </Button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="no-topic-selected">
                                                        <Empty description="Chọn một chủ đề để bắt đầu chat" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ),
                                },
                            ]}
                        />
                    </Card>
                </div>

                {/* Modal tạo chủ đề mới */}
                <Modal
                    title="Tạo Chủ Đề Mới"
                    open={isTopicModalOpen}
                    onCancel={() => setIsTopicModalOpen(false)}
                    footer={null}
                >
                    <Form form={form} layout="vertical" onFinish={createTopic}>
                        <Form.Item
                            label="Tiêu đề"
                            name="title"
                            rules={[
                                { required: true, message: "Vui lòng nhập tiêu đề" },
                                { min: 5, message: "Tiêu đề phải có ít nhất 5 ký tự" }
                            ]}
                        >
                            <Input placeholder="Nhập tiêu đề chủ đề..." />
                        </Form.Item>
                        <Form.Item
                            label="Mô tả"
                            name="description"
                            rules={[
                                { required: true, message: "Vui lòng nhập mô tả" },
                                { min: 10, message: "Mô tả phải có ít nhất 10 ký tự" }
                            ]}
                        >
                            <TextArea rows={4} placeholder="Nhập mô tả chủ đề..." />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" block>
                                Tạo Chủ Đề
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>
            </Content>
        </Layout>
    );
} 