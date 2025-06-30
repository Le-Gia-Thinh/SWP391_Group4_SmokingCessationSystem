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
    Tag
} from "antd";
import {
    SendOutlined,
    PlusOutlined,
    MessageOutlined,
    UserOutlined,
    ClockCircleOutlined,
    TeamOutlined
} from "@ant-design/icons";
import axios from "axios";
import Navbar from "../../layouts/Navbar";
import { useSocket } from "../../contexts/SocketContext";
import "./ChatPage.css";
import moment from 'moment-timezone';

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

    // Coach chat states
    const [coachingSessions, setCoachingSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [coachMessages, setCoachMessages] = useState([]);
    const [coachLoading, setCoachLoading] = useState(false);
    const [sessionsLoading, setSessionsLoading] = useState(false);

    // Socket.IO
    const { socket, isConnected, joinSession, leaveSession } = useSocket();

    // Auto scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [communityMessages, topicMessages, coachMessages]);

    // Socket.IO event listeners
    useEffect(() => {
        if (!socket) return;

        // Listen for new messages in coach chat
        socket.on('receiveMessage', (messageData) => {
            console.log('📨 Received real-time message:', messageData);

            // Add new message to coach messages if it's for current session
            if (selectedSession && messageData.session_id === selectedSession.session_id) {
                setCoachMessages(prev => [...prev, {
                    message_id: Date.now(), // Temporary ID
                    session_id: messageData.session_id,
                    sender_id: messageData.sender_id,
                    sender_role: messageData.sender_role || 'member',
                    message: messageData.message,
                    file_url: messageData.file_url,
                    sent_at: messageData.sent_at,
                    is_read: 0
                }]);
            }
        });

        // Listen for community chat messages
        socket.on('communityMessage', (messageData) => {
            console.log('📨 Received community message:', messageData);
            setCommunityMessages(prev => [...prev, messageData]);
        });

        // Listen for topic chat messages
        socket.on('topicMessage', (messageData) => {
            console.log('📨 Received topic message:', messageData);
            if (selectedTopic && messageData.topic_id === selectedTopic.topic_id) {
                setTopicMessages(prev => [...prev, messageData]);
            }
        });

        return () => {
            socket.off('receiveMessage');
            socket.off('communityMessage');
            socket.off('topicMessage');
        };
    }, [socket, selectedSession, selectedTopic]);

    // Join session room when session changes
    useEffect(() => {
        if (selectedSession && isConnected) {
            // Leave previous session room
            if (selectedSession.session_id) {
                leaveSession(selectedSession.session_id);
            }
            // Join new session room
            joinSession(selectedSession.session_id);
        }
    }, [selectedSession, isConnected, joinSession, leaveSession]);

    // Fetch coaching sessions
    const fetchCoachingSessions = async () => {
        if (!token) return;
        setSessionsLoading(true);
        try {
            const response = await axios.get(
                "http://localhost:5000/api/appointment/my-bookings",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                // Chỉ lấy các session đã được accept
                const acceptedSessions = response.data.data.filter(
                    session => session.session_status === 'accepted'
                );
                setCoachingSessions(acceptedSessions);
            }
        } catch (err) {
            message.error("Lỗi khi tải danh sách phiên tư vấn");
        } finally {
            setSessionsLoading(false);
        }
    };

    // Fetch coach messages
    const fetchCoachMessages = async (sessionId) => {
        if (!sessionId) return;
        setCoachLoading(true);
        try {
            const response = await axios.get(
                `http://localhost:5000/api/chat/${sessionId}/messages`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                setCoachMessages(response.data.data.reverse()); // Đảo ngược để hiển thị tin nhắn cũ trước
            }
        } catch (err) {
            message.error("Lỗi khi tải tin nhắn");
        } finally {
            setCoachLoading(false);
        }
    };

    // Send coach message
    const sendCoachMessage = async () => {
        if (!token) {
            message.error("Bạn cần đăng nhập để gửi tin nhắn!");
            return;
        }
        if (!newMessage.trim()) {
            message.error("Vui lòng nhập nội dung tin nhắn!");
            return;
        }
        if (!selectedSession) {
            message.error("Vui lòng chọn phiên tư vấn!");
            return;
        }

        try {
            const formData = new FormData();
            formData.append('message', newMessage);

            const response = await axios.post(
                `http://localhost:5000/api/chat/${selectedSession.session_id}/message`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data.success) {
                setNewMessage("");
                // Không cần fetch lại vì Socket.IO sẽ tự động update
                // fetchCoachMessages(selectedSession.session_id);
            }
        } catch (err) {
            if (err.response?.status === 403) {
                message.error("Chỉ được chat trong khung giờ tư vấn");
            } else {
                message.error("Lỗi khi gửi tin nhắn");
            }
        }
    };

    // Handle session selection
    const handleSessionSelect = (session) => {
        setSelectedSession(session);
        fetchCoachMessages(session.session_id);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        return moment.parseZone(dateString).format('HH:mm:ss DD/MM/YYYY');
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        return moment.parseZone(dateString).format('HH:mm:ss DD/MM/YYYY');
    };

    // Format session time
    const formatSessionTime = (dateTimeString) => {
        if (!dateTimeString) return '';
        return moment.parseZone(dateTimeString).format('HH:mm:ss DD/MM/YYYY');
    };

    // Check if session is currently active (within chat time window)
    const isSessionActive = (session) => {
        const now = moment();
        const start = moment.parseZone(session.scheduled_time);
        const end = moment(start).add(session.duration_minutes, 'minutes');
        const allowedStart = moment(start).subtract(15, 'minutes');
        const allowedEnd = moment(end).add(15, 'minutes');
        return now.isBetween(allowedStart, allowedEnd, null, '[]');
    };

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
            fetchCoachingSessions();
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
            // Không cần fetch lại vì Socket.IO sẽ tự động update
            // fetchCommunityMessages();
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
            // Không cần fetch lại vì Socket.IO sẽ tự động update
            // fetchTopicMessages(selectedTopic.topic_id);
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
        setSelectedSession(null);
        setCoachMessages([]);
        if (key === "community") {
            fetchCommunityMessages();
        } else if (key === "coach") {
            fetchCoachingSessions();
        }
    };

    // Handle enter key
    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (activeTab === "community") {
                sendCommunityMessage();
            } else if (activeTab === "topics") {
                sendTopicMessage();
            } else if (activeTab === "coach") {
                sendCoachMessage();
            }
        }
    };

    return (
        <Layout className="chat-page">
            <Navbar />
            <Content className="chat-content">
                <div className="chat-container">
                    <Card className="chat-card">
                        {/* Socket.IO Connection Status */}
                        <div style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            zIndex: 1000
                        }}>
                            <Tag color={isConnected ? 'green' : 'red'}>
                                {isConnected ? '🟢 Online' : '🔴 Offline'}
                            </Tag>
                        </div>

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
                                                    autoSize={{ minRows: 2, maxRows: 4 }}
                                                    disabled={!isConnected}
                                                />
                                                <Button
                                                    type="primary"
                                                    icon={<SendOutlined />}
                                                    onClick={sendCommunityMessage}
                                                    disabled={!newMessage.trim() || !isConnected}
                                                    style={{ marginTop: 8 }}
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
                                            <TeamOutlined />
                                            Chủ Đề
                                        </span>
                                    ),
                                    children: (
                                        <div className="topics-section">
                                            <div className="topics-sidebar">
                                                <div className="topics-header">
                                                    <Space>
                                                        <Button
                                                            type="primary"
                                                            icon={<PlusOutlined />}
                                                            onClick={() => setIsTopicModalOpen(true)}
                                                        >
                                                            Tạo Chủ Đề
                                                        </Button>
                                                    </Space>
                                                </div>
                                                <div className="topics-list">
                                                    {topicsLoading ? (
                                                        <Spin />
                                                    ) : topics.length === 0 ? (
                                                        <Empty description="Chưa có chủ đề nào" />
                                                    ) : (
                                                        <List
                                                            dataSource={topics}
                                                            renderItem={(topic) => (
                                                                <List.Item
                                                                    className={`topic-item ${selectedTopic?.topic_id === topic.topic_id ? 'selected' : ''}`}
                                                                    onClick={() => handleTopicSelect(topic)}
                                                                >
                                                                    <div>
                                                                        <Text strong>{topic.title}</Text>
                                                                        <br />
                                                                        <Text type="secondary">{topic.description}</Text>
                                                                    </div>
                                                                </List.Item>
                                                            )}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="messages-container">
                                                {selectedTopic ? (
                                                    <>
                                                        <div className="topic-header">
                                                            <Title level={4}>{selectedTopic.title}</Title>
                                                            <Text type="secondary">{selectedTopic.description}</Text>
                                                        </div>
                                                        {loading ? (
                                                            <div className="loading-container">
                                                                <Spin size="large" />
                                                            </div>
                                                        ) : topicMessages.length === 0 ? (
                                                            <Empty description="Chưa có tin nhắn nào" />
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
                                                        <Divider />
                                                        <div className="message-input">
                                                            <TextArea
                                                                value={newMessage}
                                                                onChange={(e) => setNewMessage(e.target.value)}
                                                                onKeyPress={handleKeyPress}
                                                                placeholder="Nhập tin nhắn..."
                                                                autoSize={{ minRows: 2, maxRows: 4 }}
                                                                disabled={!isConnected}
                                                            />
                                                            <Button
                                                                type="primary"
                                                                icon={<SendOutlined />}
                                                                onClick={sendTopicMessage}
                                                                disabled={!newMessage.trim() || !isConnected}
                                                                style={{ marginTop: 8 }}
                                                            >
                                                                Gửi
                                                            </Button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <Empty description="Chọn chủ đề để bắt đầu chat" />
                                                )}
                                            </div>
                                        </div>
                                    ),
                                },
                                {
                                    key: "coach",
                                    label: (
                                        <span>
                                            <UserOutlined />
                                            Chat Coach
                                        </span>
                                    ),
                                    children: (
                                        <div className="topics-section">
                                            <div className="sessions-sidebar">
                                                <div className="sessions-header">
                                                    <Title level={5}>Phiên Tư Vấn</Title>
                                                </div>
                                                <div className="sessions-list">
                                                    {sessionsLoading ? (
                                                        <Spin />
                                                    ) : coachingSessions.length === 0 ? (
                                                        <Empty description="Chưa có phiên tư vấn nào" />
                                                    ) : (
                                                        <List
                                                            dataSource={coachingSessions}
                                                            renderItem={(session) => (
                                                                <List.Item
                                                                    className={`session-item ${selectedSession?.session_id === session.session_id ? 'selected' : ''}`}
                                                                    onClick={() => handleSessionSelect(session)}
                                                                >
                                                                    <div>
                                                                        <Text strong>
                                                                            {session.coach_name || `Coach ${session.coach_id}`}
                                                                        </Text>
                                                                        <br />
                                                                        <Text type="secondary">
                                                                            {formatSessionTime(session.scheduled_time)}
                                                                        </Text>
                                                                        <br />
                                                                        <Tag color={isSessionActive(session) ? 'green' : 'default'}>
                                                                            {isSessionActive(session) ? 'Đang hoạt động' : 'Không hoạt động'}
                                                                        </Tag>
                                                                    </div>
                                                                </List.Item>
                                                            )}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="messages-container">
                                                {selectedSession ? (
                                                    <>
                                                        <div className="session-header">
                                                            <Title level={4}>
                                                                {selectedSession.coach_name || `Coach ${selectedSession.coach_id}`}
                                                            </Title>
                                                            <Text type="secondary">
                                                                {formatSessionTime(selectedSession.scheduled_time)} - {selectedSession.duration_minutes} phút
                                                            </Text>
                                                            <Tag color={isSessionActive(selectedSession) ? 'green' : 'red'}>
                                                                {isSessionActive(selectedSession) ? '🟢 Có thể chat' : '🔴 Không thể chat'}
                                                            </Tag>
                                                        </div>
                                                        {coachLoading ? (
                                                            <div className="loading-container">
                                                                <Spin size="large" />
                                                            </div>
                                                        ) : coachMessages.length === 0 ? (
                                                            <Empty description="Chưa có tin nhắn nào" />
                                                        ) : (
                                                            <List
                                                                dataSource={coachMessages}
                                                                renderItem={(msg) => (
                                                                    <List.Item className="message-item">
                                                                        <div className="message-content">
                                                                            <div className="message-header">
                                                                                <Avatar icon={<UserOutlined />} />
                                                                                <Text strong>
                                                                                    {msg.sender_role === 'coach' ? 'Coach' : 'Bạn'}
                                                                                </Text>
                                                                                <Text type="secondary">
                                                                                    <ClockCircleOutlined /> {formatDate(msg.sent_at)}
                                                                                </Text>
                                                                            </div>
                                                                            <Paragraph className="message-text">
                                                                                {msg.message}
                                                                            </Paragraph>
                                                                        </div>
                                                                    </List.Item>
                                                                )}
                                                            />
                                                        )}
                                                        <div ref={messagesEndRef} />
                                                        <Divider />
                                                        <div className="message-input">
                                                            <TextArea
                                                                value={newMessage}
                                                                onChange={(e) => setNewMessage(e.target.value)}
                                                                onKeyPress={handleKeyPress}
                                                                placeholder="Nhập tin nhắn..."
                                                                autoSize={{ minRows: 2, maxRows: 4 }}
                                                                disabled={!isSessionActive(selectedSession) || !isConnected}
                                                            />
                                                            <Button
                                                                type="primary"
                                                                icon={<SendOutlined />}
                                                                onClick={sendCoachMessage}
                                                                disabled={!newMessage.trim() || !isSessionActive(selectedSession) || !isConnected}
                                                                style={{ marginTop: 8 }}
                                                            >
                                                                Gửi
                                                            </Button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <Empty description="Chọn phiên tư vấn để bắt đầu chat" />
                                                )}
                                            </div>
                                        </div>
                                    ),
                                },
                            ]}
                        />
                    </Card>
                </div>
            </Content>

            {/* Create Topic Modal */}
            <Modal
                title="Tạo Chủ Đề Mới"
                open={isTopicModalOpen}
                onCancel={() => setIsTopicModalOpen(false)}
                footer={null}
            >
                <Form form={form} onFinish={createTopic} layout="vertical">
                    <Form.Item
                        name="title"
                        label="Tiêu đề"
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
                    >
                        <Input placeholder="Nhập tiêu đề chủ đề" />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Mô tả"
                        rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
                    >
                        <TextArea placeholder="Nhập mô tả chủ đề" rows={3} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            Tạo Chủ Đề
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </Layout>
    );
} 