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
    Row,
    Col
} from "antd";
import {
    SendOutlined,
    MessageOutlined,
    UserOutlined,
    ClockCircleOutlined,
    TeamOutlined
} from "@ant-design/icons";
import axios from "axios";
import { useSocket } from "../../contexts/SocketContext";
import "./CoachChat.css";
import moment from 'moment-timezone';

const { Content } = Layout;
const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function CoachChat() {
    const [coachingSessions, setCoachingSessions] = useState([]);
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

        // Listen for new messages in coach chat
        socket.on('receiveMessage', (messageData) => {
            console.log('📨 Coach received real-time message:', messageData);

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

        return () => {
            socket.off('receiveMessage');
        };
    }, [socket, selectedSession]);

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

    // Fetch coaching sessions for coach
    const fetchCoachingSessions = async () => {
        if (!token) return;
        setSessionsLoading(true);
        try {
            const response = await axios.get(
                "http://localhost:5000/api/appointment/all-coach-appointments",
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

    // Check if session is currently active (within chat time window)
    const isSessionActive = (session) => {
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

    // Format date
    const formatTime = (dateString) => {
        if (!dateString) return '';
        return moment.parseZone(dateString).format('HH:mm:ss DD/MM/YYYY');
    };

    // Load initial data
    useEffect(() => {
        if (token) {
            fetchCoachingSessions();
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
        <div className="coach-chat-container">
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

            <Row gutter={16} style={{ height: 'calc(100vh - 200px)' }}>
                {/* Sessions Sidebar */}
                <Col xs={24} md={8} lg={6}>
                    <Card
                        title={
                            <Space>
                                <TeamOutlined />
                                <span>Phiên Tư Vấn</span>
                            </Space>
                        }
                        className="sessions-sidebar"
                        bodyStyle={{ padding: 0, height: '100%' }}
                    >
                        {sessionsLoading ? (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                <Spin />
                            </div>
                        ) : coachingSessions.length === 0 ? (
                            <Empty description="Chưa có phiên tư vấn nào" />
                        ) : (
                            <List
                                dataSource={coachingSessions}
                                renderItem={(session) => (
                                    <List.Item
                                        className={`session-item ${selectedSession?.session_id === session.session_id ? 'selected' : ''}`}
                                        onClick={() => handleSessionSelect(session)}
                                        style={{
                                            padding: '12px 16px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #f0f0f0'
                                        }}
                                    >
                                        <div style={{ width: '100%' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                <Text strong>
                                                    {session.member_name || `Member ${session.user_id}`}
                                                </Text>
                                                <Tag color={isSessionActive(session) ? 'green' : 'default'} size="small">
                                                    {isSessionActive(session) ? '🟢 Active' : '⚪ Inactive'}
                                                </Tag>
                                            </div>
                                            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                                                <ClockCircleOutlined /> {formatSessionTime(session.scheduled_time)}
                                            </Text>
                                            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                                                Thời lượng: {session.duration_minutes} phút
                                            </Text>
                                        </div>
                                    </List.Item>
                                )}
                            />
                        )}
                    </Card>
                </Col>

                {/* Chat Area */}
                <Col xs={24} md={16} lg={18}>
                    <Card
                        title={
                            selectedSession ? (
                                <div>
                                    <Title level={4} style={{ margin: 0 }}>
                                        Chat với {selectedSession.member_name || `Member ${selectedSession.user_id}`}
                                    </Title>
                                    <Text type="secondary">
                                        {formatSessionTime(selectedSession.scheduled_time)} - {selectedSession.duration_minutes} phút
                                    </Text>
                                    <br />
                                    <Tag color={isSessionActive(selectedSession) ? 'green' : 'red'}>
                                        {isSessionActive(selectedSession) ? '🟢 Có thể chat' : '🔴 Không thể chat'}
                                    </Tag>
                                </div>
                            ) : (
                                <span>Chọn phiên tư vấn để bắt đầu chat</span>
                            )
                        }
                        className="chat-area"
                        bodyStyle={{
                            padding: 0,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {selectedSession ? (
                            <>
                                {/* Messages Container */}
                                <div style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    padding: '16px',
                                    maxHeight: 'calc(100vh - 350px)'
                                }}>
                                    {coachLoading ? (
                                        <div style={{ textAlign: 'center', padding: '20px' }}>
                                            <Spin size="large" />
                                        </div>
                                    ) : coachMessages.length === 0 ? (
                                        <Empty description="Chưa có tin nhắn nào" />
                                    ) : (
                                        <List
                                            dataSource={coachMessages}
                                            renderItem={(msg) => (
                                                <List.Item style={{ border: 'none', padding: '8px 0' }}>
                                                    <div style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        justifyContent: msg.sender_role === 'coach' ? 'flex-end' : 'flex-start'
                                                    }}>
                                                        <div style={{
                                                            maxWidth: '70%',
                                                            padding: '8px 12px',
                                                            borderRadius: '8px',
                                                            backgroundColor: msg.sender_role === 'coach' ? '#1890ff' : '#f0f0f0',
                                                            color: msg.sender_role === 'coach' ? 'white' : 'black'
                                                        }}>
                                                            <div style={{ marginBottom: 4 }}>
                                                                <Text style={{
                                                                    color: msg.sender_role === 'coach' ? 'white' : 'black',
                                                                    fontSize: '12px',
                                                                    opacity: 0.8
                                                                }}>
                                                                    {msg.sender_role === 'coach' ? 'Bạn' : selectedSession.member_name || `Member ${selectedSession.user_id}`}
                                                                </Text>
                                                            </div>
                                                            <Paragraph style={{
                                                                margin: 0,
                                                                color: msg.sender_role === 'coach' ? 'white' : 'black'
                                                            }}>
                                                                {msg.message}
                                                            </Paragraph>
                                                            <div style={{
                                                                marginTop: 4,
                                                                textAlign: 'right'
                                                            }}>
                                                                <Text style={{
                                                                    color: msg.sender_role === 'coach' ? 'white' : 'black',
                                                                    fontSize: '10px',
                                                                    opacity: 0.7
                                                                }}>
                                                                    {formatTime(msg.sent_at)}
                                                                </Text>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </List.Item>
                                            )}
                                        />
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message Input */}
                                <Divider style={{ margin: 0 }} />
                                <div style={{ padding: '16px' }}>
                                    <TextArea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Nhập tin nhắn..."
                                        autoSize={{ minRows: 2, maxRows: 4 }}
                                        disabled={!isSessionActive(selectedSession) || !isConnected}
                                        style={{ marginBottom: 8 }}
                                    />
                                    <Button
                                        type="primary"
                                        icon={<SendOutlined />}
                                        onClick={sendCoachMessage}
                                        disabled={!newMessage.trim() || !isSessionActive(selectedSession) || !isConnected}
                                        block
                                    >
                                        Gửi tin nhắn
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100%'
                            }}>
                                <Empty description="Chọn phiên tư vấn để bắt đầu chat" />
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
} 