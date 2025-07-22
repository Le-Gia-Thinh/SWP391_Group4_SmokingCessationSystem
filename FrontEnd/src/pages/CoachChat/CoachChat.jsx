import React, { useState, useEffect, useRef } from "react";
import {
    Layout,
    Card,
    Input,
    Button,
    List,
    Avatar,
    Typography,
    message,
    Space,
    Divider,
    Spin,
    Empty,
    Tag,
} from "antd";
import {
    SendOutlined,
    ClockCircleOutlined,
    UserOutlined
} from "@ant-design/icons";
import axios from "axios";
import { useSocket } from "../../contexts/SocketContext";
import "../Community/CommunityPage.css";
import moment from 'moment-timezone';

const { Content } = Layout;
const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function CoachChat() {
    const [chatThreads, setChatThreads] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [coachMessages, setCoachMessages] = useState([]);
    const [coachLoading, setCoachLoading] = useState(false);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);
    const token = localStorage.getItem("token");

    // Socket.IO
    const { socket, isConnected, joinSession, leaveSession } = useSocket();

    // Auto scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [coachMessages]);

    // Socket.IO event listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('receiveGuidedMessage', (messageData) => {
            console.log('📨 Coach received real-time message:', messageData);

            if (selectedSession && messageData.thread_id === selectedSession.thread_id) {
                setCoachMessages(prev => [...prev, {
                    message_id: Date.now(), // Temporary ID
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

        return () => {
            socket.off('receiveGuidedMessage');
        };
    }, [socket, selectedSession]);

    // Join session room when session changes
    useEffect(() => {
        if (selectedSession && isConnected) {
            if (selectedSession.thread_id) {
                leaveSession(selectedSession.thread_id);
            }
            joinSession(selectedSession.thread_id);
        }
    }, [selectedSession, isConnected, joinSession, leaveSession]);

    // Fetch coaching sessions for coach
    const fetchChatThreads = async () => {
        if (!token) return;
        setSessionsLoading(true);
        try {
            const response = await axios.get(
                 "http://localhost:5000/api/chat/guided",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                setChatThreads(response.data.data);
            }
        } catch (err) {
            message.error("Lỗi khi tải danh sách phiên tư vấn");
        } finally {
            setSessionsLoading(false);
        }
    };

    // Fetch coach messages (Guided Support)
    const fetchCoachMessages = async (partnerId) => {
        if (!partnerId) return;
        setCoachLoading(true);

        try {
            const response = await axios.get(
                `http://localhost:5000/api/chat/guided/${partnerId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setCoachMessages(response.data.data); // Đã được sắp xếp tăng dần theo thời gian gửi
            } else {
                message.error("Không thể lấy dữ liệu tin nhắn");
            }
        } catch (err) {
            console.error("❌ Lỗi khi lấy tin nhắn:", err);
            message.error("Lỗi khi tải tin nhắn");
        } finally {
            setCoachLoading(false);
        }
    };  

    // Send coach message
    const sendCoachMessage = async () => {
        if (!token || !newMessage.trim() || !selectedSession) {
            message.error("Vui lòng nhập nội dung và chọn phiên tư vấn!");
            return;
        }

        try {
            const formData = new FormData();
            formData.append('message', newMessage);
            formData.append('recipient_id', selectedSession.member_id || selectedSession.coach_id);

            const response = await axios.post(
                `http://localhost:5000/api/chat/guided/send`,
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
    const handleSessionSelect = (thread) => {
    setSelectedSession(thread);
    const partnerId = thread.member_id || thread.coach_id;
    fetchCoachMessages(partnerId);
    };  

    // Check if session is currently active
    const isSessionActive = (session) => {
        if (!session) return false;
        const now = moment();
        const start = moment.parseZone(session.scheduled_time);
        const end = moment(start).add(session.duration_minutes, 'minutes');
        const allowedStart = moment(start).subtract(15, 'minutes');
        const allowedEnd = moment(end).add(15, 'minutes');
        return now.isBetween(allowedStart, allowedEnd, null, '[]');
    };

    // Format session time
    const formatSessionTime = (dateTimeString) => {
        return moment.parseZone(dateTimeString).format('HH:mm DD/MM/YYYY');
    };

    // Format message time
    const formatTime = (dateString) => {
        if (!dateString) return '';
        return moment.parseZone(dateString).format('HH:mm:ss DD/MM/YYYY');
    };

    // Load initial data
    useEffect(() => {
        if (token) {
            fetchChatThreads();
        }
    }, [token]);

    // Handle enter key
    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendCoachMessage();
        }
    };

    return (
        <Content className="chat-content" style={{ height: 'calc(100vh - 64px)', padding: '20px' }}>
            <div className="chat-container">
                <Card className="chat-card" style={{ height: '100%' }}>
                    <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
                        <Tag color={isConnected ? 'green' : 'red'}>
                            {isConnected ? '🟢 Online' : '🔴 Offline'}
                        </Tag>
                    </div>

                    <div className="topics-section" style={{ height: '100%' }}>
                        <div className="sessions-sidebar">
                            <div className="sessions-header">
                                <Title level={5}>Phiên Tư Vấn</Title>
                            </div>
                            <div className="sessions-list">
                                {sessionsLoading ? (
                                    <div style={{ textAlign: 'center', padding: '20px' }}><Spin /></div>
                                ) : chatThreads.length === 0 ? (
                                    <Empty description="Chưa có phiên tư vấn nào" />
                                ) : (
                                    <List
                                        dataSource={chatThreads}
                                        renderItem={(thread) => (
                                            <List.Item
                                                className={`session-item ${selectedSession?.thread_id === thread.thread_id ? 'selected' : ''}`}
                                                onClick={() => handleSessionSelect(thread)}
                                            >
                                                <div>
                                                    <Text strong>{thread.member_name || thread.coach_name}</Text>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                                        🗨 {thread.last_message || 'Chưa có tin nhắn'}
                                                    </Text>
                                                    <br />
                                                    <Text type="secondary">
                                                        🕒 {formatTime(thread.last_time)}
                                                    </Text>
                                                </div>
                                            </List.Item>
                                        )}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="topic-chat">
                            {selectedSession ? (
                                <>
                                    <div className="session-header">
                                        <Title level={4} style={{ margin: 0 }}>
                                            Chat với {selectedSession.member_name || `Member ${selectedSession.user_id}`}
                                        </Title>
                                        {selectedSession.scheduled_time && selectedSession.duration_minutes ? (
                                            <>
                                                <Text type="secondary">
                                                    {formatSessionTime(selectedSession.scheduled_time)} - {selectedSession.duration_minutes} phút
                                                </Text>
                                                <br />
                                                <Tag color={isSessionActive(selectedSession) ? 'green' : 'red'} style={{ marginTop: '8px' }}>
                                                    {isSessionActive(selectedSession) ? '🟢 Có thể chat' : '🔴 Không thể chat'}
                                                </Tag>
                                            </>
                                        ) : (
                                            <Text type="secondary">Không có thông tin lịch hẹn</Text>
                                        )}
                                    </div>

                                    <div className="messages-container">
                                        {coachLoading ? (
                                            <div className="loading-container"><Spin size="large" /></div>
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
                                                                    {msg.sender_role === 'coach' ? 'Bạn' : selectedSession.member_name}
                                                                </Text>
                                                                <Text type="secondary">
                                                                    <ClockCircleOutlined /> {formatTime(msg.sent_at)}
                                                                </Text>
                                                            </div>
                                                            <Paragraph className="message-text">
                                                                {msg.message}
                                                            </Paragraph>
                                                            {msg.file_url && (
                                                                <div style={{ marginTop: 8 }}>
                                                                        {/\.(jpg|jpeg|png)$/i.test(msg.file_url) ? (
                                                                            <img src={msg.file_url} alt="attachment" style={{ maxWidth: '100%', maxHeight: 300 }} />
                                                                        ) : (
                                                                            <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                                                                            📎 Xem tệp đính kèm
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div> {formatSessionTime(selectedSession.scheduled_time)} - {selectedSession.duration_minutes} phút
                                                    </List.Item>
                                                )}
                                            />
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    <Divider style={{ margin: 0 }} />
                                    <div className="message-input" style={{ padding: '16px' }}>
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
                                        >
                                            Gửi
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="no-topic-selected">
                                    <Empty description="Chọn phiên tư vấn để bắt đầu chat" />
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </Content>
    );
} 