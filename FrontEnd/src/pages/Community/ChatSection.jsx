import React, { useState, useEffect, useRef } from "react";
import {
    Tabs,
    List,
    Avatar,
    Typography,
    Button,
    Spin,
    Divider,
    Empty,
    Tag,
    Space,
    Modal,
    Form,
    message,
    Input
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
import moment from 'moment-timezone';
import { useAuth } from '../../contexts/AuthContext';

const { Paragraph, Title, Text } = Typography;
const { TextArea } = Input;

export default function ChatSection({ token, socket, isConnected }) {
    // Chat states
    const [activeChatTab, setActiveChatTab] = useState("community");
    const [topics, setTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [communityMessages, setCommunityMessages] = useState([]);
    const [topicMessages, setTopicMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
    const [chatLoading, setChatLoading] = useState(false);
    const [topicsLoading, setTopicsLoading] = useState(false);
    // Coach chat states
    const [coachingSessions, setCoachingSessions] = useState([]);
    const [selectedCoach, setSelectedCoach] = useState(null);
    const [coachMessages, setCoachMessages] = useState([]);
    const [coachLoading, setCoachLoading] = useState(false);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const communityEndRef = useRef(null);
    const topicEndRef = useRef(null);
    const coachEndRef = useRef(null);
    const [topicForm] = Form.useForm();
    const { user } = useAuth();

    // Auto scroll to bottom
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    // Community scroll
    useEffect(() => {
        if (activeChatTab === "community" && communityMessages.length > 0) {
            requestAnimationFrame(() => {
                communityEndRef.current?.scrollIntoView({ behavior: "smooth" });
            });
        }
    }, [communityMessages, activeChatTab]);

    // Topic scroll
    useEffect(() => {
        if (activeChatTab === "topics" && topicMessages.length > 0) {
            requestAnimationFrame(() => {
                topicEndRef.current?.scrollIntoView({ behavior: "smooth" });
            });
        }
    }, [topicMessages, activeChatTab]);

    // Coach scroll
    useEffect(() => {
        if (activeChatTab === "coach" && coachMessages.length > 0) {
            requestAnimationFrame(() => {
                coachEndRef.current?.scrollIntoView({ behavior: "smooth" });
            });
        }
    }, [coachMessages, activeChatTab]);

    // Socket.IO event listeners
    useEffect(() => {
        if (!socket) return;
        // Listen for guided chat messages (coach-member)
        socket.on('receiveGuidedMessage', (messageData) => {
            // Chỉ cần check nếu đã chọn coach
            if (selectedCoach) {
                setCoachMessages(prev => [...prev, {
                    message_id: Date.now(),
                    thread_id: messageData.thread_id,
                    sender_id: messageData.sender_id,
                    sender_role: messageData.sender_role || 'member',
                    message: messageData.message,
                    file_url: messageData.file_url,
                    sent_at: messageData.sent_at,
                    is_read: 0
                }]);
            }
        });
        // Community chat
        socket.on('communityMessage', (messageData) => {
            setCommunityMessages(prev => {
                const updated = [...prev, messageData];
                return updated;
            });
        });
        // Topic chat
        socket.on('topicMessage', (messageData) => {
            if (selectedTopic && messageData.topic_id === selectedTopic.topic_id) {
                setTopicMessages(prev => [...prev, messageData]);
            }
        });
        return () => {
            socket.off('receiveGuidedMessage');
            socket.off('communityMessage');
            socket.off('topicMessage');
        };
    }, [socket, selectedCoach, selectedTopic]);

    // Join socket room khi chọn coach (nếu cần room theo coach)
    useEffect(() => {
        if (!socket || !selectedCoach) return;
        // Nếu backend dùng room theo coach_id
        const threadRoom = `chat-coach-${selectedCoach.coach_id}`;
        socket.emit('joinRoom', threadRoom);
        return () => {
            socket.emit('leaveRoom', threadRoom);
        };
    }, [socket, selectedCoach]);

    // ========== API FUNCTIONS ==========
    const fetchCoachingSessions = async () => {
        if (!token) return;
        setSessionsLoading(true);
        try {
            const response = await axios.get(
                "http://localhost:5000/api/appointment/my-bookings",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
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
    const fetchCoachMessages = async (partnerId) => {
        if (!partnerId) return;
        setCoachLoading(true);
        try {
            const response = await axios.get(
                `http://localhost:5000/api/chat/guided/${partnerId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                console.log('API messages:', response.data.data);
                setCoachMessages(response.data.data); // Không reverse nữa
            }
        } catch (err) {
            message.error("Lỗi khi tải tin nhắn");
        } finally {
            setCoachLoading(false);
        }
    };
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
    const fetchCommunityMessages = async () => {
        setChatLoading(true);
        try {
            const response = await axios.get(
                "http://localhost:5000/api/community-chat",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCommunityMessages(response.data);
        } catch (err) {
            message.error("Lỗi khi tải tin nhắn cộng đồng");
        } finally {
            setChatLoading(false);
        }
    };
    const fetchTopicMessages = async (topicId) => {
        if (!topicId) return;
        setChatLoading(true);
        try {
            const response = await axios.get(
                `http://localhost:5000/api/topic-chat/messages/${topicId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTopicMessages(response.data);
        } catch (err) {
            message.error("Lỗi khi tải tin nhắn chủ đề");
        } finally {
            setChatLoading(false);
        }
    };
    // ========== HANDLERS ========== 
    // Gộp các phiên tư vấn theo coach_id
    const groupedCoaches = Object.values(
        coachingSessions.reduce((acc, session) => {
            if (!acc[session.coach_id]) {
                acc[session.coach_id] = {
                    coach_id: session.coach_id,
                    coach_name: session.coach_name,
                    sessions: []
                };
            }
            acc[session.coach_id].sessions.push(session);
            return acc;
        }, {})
    );

    // Khi chọn coach, lấy toàn bộ tin nhắn với coach đó
    const handleCoachSelect = (coach) => {
        setSelectedCoach(coach);
        fetchCoachMessages(coach.coach_id);
    };
    const handleTopicSelect = (topic) => {
        setSelectedTopic(topic);
        fetchTopicMessages(topic.topic_id);
    };
    const handleChatTabChange = (key) => {
        setActiveChatTab(key);
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
    // ========== SEND MESSAGE ==========
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
            // fetchCommunityMessages(); // ĐÃ BỎ, rely vào socket realtime
        } catch (err) {
            message.error("Lỗi khi gửi tin nhắn");
        }
    };
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
        } catch (err) {
            message.error("Lỗi khi gửi tin nhắn");
        }
    };
    const sendCoachMessage = async () => {
        if (!token) {
            message.error("Bạn cần đăng nhập để gửi tin nhắn!");
            return;
        }
        if (!newMessage.trim()) {
            message.error("Vui lòng nhập nội dung tin nhắn!");
            return;
        }
        if (!selectedCoach) {
            message.error("Vui lòng chọn coach!");
            return;
        }
        try {
            const formData = new FormData();
            formData.append('message', newMessage);
            // Xác định recipient_id là coach_id hoặc member_id
            let recipientId;
            if (!user) {
                message.error("Không xác định được người dùng hiện tại");
                return;
            }
            if (user.role === 'coach') {
                // Nếu là coach, gửi cho member đầu tiên trong danh sách sessions
                recipientId = selectedCoach.sessions[0]?.member_id;
            } else if (user.role === 'member') {
                recipientId = selectedCoach.coach_id;
            } else {
                message.error("Vai trò không hợp lệ");
                return;
            }
            formData.append('recipient_id', recipientId);
            // Thêm log để debug
            console.log('recipient_id:', recipientId, 'message:', newMessage, 'selectedCoach:', selectedCoach, 'user:', user);
            for (let pair of formData.entries()) {
                console.log('formData', pair[0] + ': ' + pair[1]);
            }
            const response = await axios.post(
                `http://localhost:5000/api/chat/guided/send`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                        // KHÔNG set 'Content-Type', axios sẽ tự động set đúng boundary
                    }
                }
            );
            if (response.data.success) {
                // Thêm tin nhắn mới vào mảng coachMessages (không fetch lại toàn bộ)
                setCoachMessages(prev => [
                    ...prev,
                    response.data.data // backend trả về bản ghi vừa lưu
                ]);
                setNewMessage("");
            }
        } catch (err) {
            if (err.response?.status === 403) {
                message.error("Chỉ được chat trong khung giờ tư vấn");
            } else {
                message.error("Lỗi khi gửi tin nhắn");
            }
        }
    };
    // ========== TOPIC MODAL ==========
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
            topicForm.resetFields();
            message.success("Tạo chủ đề thành công!");
            fetchTopics();
        } catch (err) {
            message.error("Lỗi khi tạo chủ đề");
        }
    };
    // ========== FORMAT ==========
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
    // ========== INIT ==========
    useEffect(() => {
        fetchCommunityMessages();
        if (token) {
            fetchTopics();
            fetchCoachingSessions();
        }
    }, [token]);
    // ========== KEY PRESS ==========
    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (activeChatTab === "community") {
                sendCommunityMessage();
            } else if (activeChatTab === "topics") {
                sendTopicMessage();
            } else if (activeChatTab === "coach") {
                sendCoachMessage();
            }
        }
    };
    // ========== UI ==========
    return (
        <div className="chat-section">
            <Tabs
                activeKey={activeChatTab}
                onChange={handleChatTabChange}
                items={[
                    {
                        key: "community",
                        label: (
                            <span>
                                <MessageOutlined />
                                Chat Chung
                            </span>
                        ),
                        children: (
                            <div className="chat-section">
                                <div className="messages-container">
                                    {chatLoading ? (
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
                                    <div ref={communityEndRef} />
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
                                <div className="topic-chat">
                                    {selectedTopic ? (
                                        <>
                                            <div className="topic-header">
                                                <Title level={4}>{selectedTopic.title}</Title>
                                                <Text type="secondary">{selectedTopic.description}</Text>
                                            </div>
                                            <div className="messages-container">
                                                {chatLoading ? (
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
                                                <div ref={topicEndRef} />
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
                                                    onClick={sendTopicMessage}
                                                    disabled={!newMessage.trim() || !isConnected}
                                                    style={{ marginTop: 8 }}
                                                >
                                                    Gửi
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="no-topic-selected">
                                            <Empty description="Chọn chủ đề để bắt đầu chat" />
                                        </div>
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
                                        <Title level={5}>Coach đã từng chat</Title>
                                    </div>
                                    <div className="sessions-list">
                                        {sessionsLoading ? (
                                            <Spin />
                                        ) : groupedCoaches.length === 0 ? (
                                            <Empty description="Chưa từng chat với coach nào" />
                                        ) : (
                                            <List
                                                dataSource={groupedCoaches}
                                                renderItem={(coach) => (
                                                    <List.Item
                                                        className={`session-item ${selectedCoach?.coach_id === coach.coach_id ? 'selected' : ''}`}
                                                        onClick={() => handleCoachSelect(coach)}
                                                    >
                                                        <div>
                                                            <Text strong>
                                                                {coach.coach_name || `Coach ${coach.coach_id}`}
                                                            </Text>
                                                        </div>
                                                    </List.Item>
                                                )}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="topic-chat">
                                    {selectedCoach ? (
                                        <>
                                            <div className="session-header">
                                                <Title level={4}>
                                                    {selectedCoach.coach_name || `Coach ${selectedCoach.coach_id}`}
                                                </Title>
                                            </div>
                                            <div className="messages-container">
                                                {coachLoading ? (
                                                    <div className="loading-container">
                                                        <Spin size="large" />
                                                    </div>
                                                ) : (
                                                    <List
                                                        dataSource={coachMessages}
                                                        locale={{ emptyText: 'Chưa có tin nhắn nào với coach này. Hãy bắt đầu cuộc trò chuyện!' }}
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
                                                <div ref={coachEndRef} />
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
                                                    onClick={sendCoachMessage}
                                                    disabled={!newMessage.trim() || !isConnected}
                                                    style={{ marginTop: 8 }}
                                                >
                                                    Gửi
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="no-topic-selected">
                                            <Empty description="Chọn coach để bắt đầu chat" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ),
                    },
                ]}
            />
            {/* Create Topic Modal */}
            <Modal
                title="Tạo Chủ Đề Mới"
                open={isTopicModalOpen}
                onCancel={() => setIsTopicModalOpen(false)}
                footer={null}
            >
                <Form form={topicForm} onFinish={createTopic} layout="vertical">
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
        </div>
    );
} 