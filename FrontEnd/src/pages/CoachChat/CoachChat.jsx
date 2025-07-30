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
import "./CoachChat.css";
import moment from 'moment-timezone';
import { useAuth } from '../../contexts/AuthContext';

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
    const [joinedThreadId, setJoinedThreadId] = useState(null);
    const messagesEndRef = useRef(null);
    const token = localStorage.getItem("token");
    const { user } = useAuth();

    // Socket.IO
    const { socket, isConnected, joinSession, leaveSession, joinRoom, leaveRoom, activeRooms } = useSocket();

    // Auto scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Tối ưu hóa scrollToBottom để chỉ scroll khi cần thiết
    useEffect(() => {
        // Sử dụng requestAnimationFrame để đảm bảo DOM đã được cập nhật
        // trước khi scroll, tránh gọi scroll liên tục
        if (coachMessages.length > 0) {
            const scrollTimer = setTimeout(() => {
                scrollToBottom();
            }, 100);
            return () => clearTimeout(scrollTimer);
        }
    }, [coachMessages.length]);

    // Socket.IO event listeners và debugging
    useEffect(() => {
        if (!socket) return;
        
        // Dùng biến để theo dõi trạng thái socket trong scope của useEffect
        let isCurrentlyConnected = socket?.connected || false;
        
        // Add debug event listeners
        const handleConnect = () => {
            isCurrentlyConnected = true;
            
            // Khi socket kết nối lại, join vào room nếu đã chọn session
            if (joinedThreadId) {
                // Chỉ join room một lần, không dùng reconnectTimer nữa
                // để tránh trường hợp join nhiều lần
                setTimeout(() => {
                    if (socket?.connected && joinedThreadId) {
                        socket.emit('joinRoom', `chat-${joinedThreadId}`);
                        // Kiểm tra lại xem đã join room này chưa để tránh join nhiều lần
                        socket.emit('getRooms'); // Kiểm tra room đã join
                    }
                }, 500);
            }
        };
        
        socket.on('connect', handleConnect);
        
        // Track socket status and events
        const handleJoinSuccess = (data) => {
            // Đã join room thành công
        };
        
        const handleDisconnect = (reason) => {
            isCurrentlyConnected = false;
        };
        
        // Debug user joined/left events
        const handleUserJoined = (data) => {
            // Người dùng đã tham gia phòng
        };
        
        const handleUserLeft = (data) => {
            // Người dùng đã rời phòng
        };
        
        // Register event handlers
        socket.on('joinSuccess', handleJoinSuccess);
        socket.on('disconnect', handleDisconnect);
        socket.on('userJoined', handleUserJoined);
        socket.on('userLeft', handleUserLeft);
        
        // Listen for messages
        socket.on('receiveGuidedMessage', (messageData) => {
            // Check if message belongs to current thread
            if (joinedThreadId && messageData.thread_id === joinedThreadId) {
                
                // Kiểm tra xem đây có phải là tin nhắn từ chính người dùng hiện tại không
                // Nếu là tin nhắn của chính mình (qua socket khác) thì không thêm vào để tránh duplicate
                const isMyMessage = messageData.sender_id === user?.id;
                const socketId = messageData._socketId;
                
                // Kiểm tra xem tin nhắn này đã có trong danh sách chưa (dựa vào message_id)
                const isDuplicate = coachMessages.some(msg => {
                    // Kiểm tra trùng message_id (tin nhắn thực từ server)
                    const hasSameId = msg.message_id === messageData.message_id;
                    
                    // Hoặc kiểm tra trùng nội dung và người gửi (tin nhắn optimistic)
                    const isOptimisticDuplicate = msg._isOptimistic && 
                                                  msg.message === messageData.message && 
                                                  msg.sender_id === messageData.sender_id;
                                                  
                    return hasSameId || isOptimisticDuplicate;
                });
                
                if (isDuplicate) {
                    // Cập nhật tin nhắn optimistic với dữ liệu thực từ server
                    setCoachMessages(prev => prev.map(msg => {
                        // Nếu tìm thấy tin nhắn optimistic có cùng nội dung, thay thế bằng tin nhắn thực
                        if (msg._isOptimistic && msg.message === messageData.message && msg.sender_id === messageData.sender_id) {
                            return {
                                ...messageData,
                                _tempId: msg._tempId // Giữ lại _tempId để đánh dấu
                            };
                        }
                        return msg;
                    }));
                } else if (isMyMessage && socket.id !== socketId) {
                    // Không thêm tin nhắn của chính mình từ socket khác để tránh lặp
                } else if (!isMyMessage) {
                    // Nếu là tin nhắn từ người khác, thêm vào bình thường
                    const newMessage = {
                        message_id: messageData.message_id || Date.now(),
                        thread_id: messageData.thread_id,
                        sender_id: messageData.sender_id,
                        sender_role: messageData.sender_role || 'member',
                        message: messageData.message,
                        file_url: messageData.file_url,
                        sent_at: messageData.sent_at || new Date().toISOString(),
                        is_read: 0,
                        _tempId: Date.now() // Thêm ID tạm thời cho key render
                    };
                    
                    setCoachMessages(prev => [...prev, newMessage]);
                }
                
                // Force scroll to bottom
                setTimeout(scrollToBottom, 100);
            }
        });
        
        // Debug room list
        socket.emit('getRooms');
        socket.on('roomsList', (rooms) => {
            // Nhận danh sách room đã tham gia
        });

        // Clean up all event listeners when component unmounts
        return () => {
            if (socket) {
                // Hủy đăng ký các sự kiện socket
                socket.off('receiveGuidedMessage');
                socket.off('connect', handleConnect);
                socket.off('joinSuccess', handleJoinSuccess);
                socket.off('disconnect', handleDisconnect);
                socket.off('userJoined', handleUserJoined);
                socket.off('userLeft', handleUserLeft);
                socket.off('roomsList');
                
                // Không cần leave room ở đây nữa vì useEffect thứ hai sẽ lo việc này
                // Tránh việc leave room nhiều lần
            }
        };
    }, [socket, joinedThreadId]);    // Biến theo dõi xem đã join room cho thread hiện tại chưa
    const hasJoinedRoom = useRef(false);
    
    // Join session room when session changes (theo thread_id, đúng với BE)
    useEffect(() => {
        // Không làm gì nếu socket là null hoặc thread_id chưa được chọn
        if (!socket || !joinedThreadId) {
            hasJoinedRoom.current = false;
            return;
        }
        
        // Reset trạng thái join room khi thread_id thay đổi
        hasJoinedRoom.current = false;
        
        // Đợi một chút để đảm bảo component đã render xong và socket đã sẵn sàng
        // Tránh trường hợp socket.id là undefined
        const setupTimer = setTimeout(() => {
            // Chỉ tiếp tục nếu socket đã kết nối
            if (!socket?.connected) {
                return;
            }
            
            const roomId = `chat-${joinedThreadId}`;
            
            // Đánh dấu đã join room
            hasJoinedRoom.current = true;
            
            // Sử dụng hàm mới từ SocketContext
            joinRoom(roomId);
            
            // Gửi ping để kiểm tra connection
            if (socket.connected) {
                socket.emit('getRooms');
            }
            
            // Đảm bảo đã tham gia phòng - kiểm tra trước để tránh join nhiều lần
            let forceJoinTimer = null;
            if (!activeRooms.includes(roomId)) {
                forceJoinTimer = setTimeout(() => {
                    if (socket?.connected) {
                        socket.emit('forceJoinRoom', roomId);
                    }
                }, 1000);
            }
            
            // Kiểm tra kết nối liên tục
            const pingInterval = setInterval(() => {
                if (socket?.connected) {
                    socket.emit('ping', { threadId: joinedThreadId, ts: new Date().toISOString() });
                }
            }, 15000); // 15 giây ping một lần
            
            // Cleanup function
            return () => {
                if (socket?.connected) {
                    console.log(`� Leaving room: ${roomId}`);
                    leaveRoom(roomId);
                }
                clearTimeout(forceJoinTimer);
                clearInterval(pingInterval);
            };
        }, 300); // Đợi 300ms trước khi thiết lập room
        
        // Cleanup timer nếu component unmount trước khi timer chạy xong
        return () => clearTimeout(setupTimer);
    }, [socket, joinedThreadId, joinRoom, leaveRoom, activeRooms]);

    // Khi chọn session, set joinedThreadId
    const handleSessionSelect = (thread) => {
        if (!thread) return;
        
        // Tránh trường hợp thread_id là null hoặc undefined
        const newThreadId = thread?.thread_id;
        if (!newThreadId) {
            return;
        }
        
        // Không thực hiện gì nếu đã chọn thread này rồi
        if (newThreadId === joinedThreadId && selectedSession?.thread_id === newThreadId) {
            return;
        }
        
        // Bước 1: Thiết lập trạng thái thread mới và fetch tin nhắn
        setSelectedSession(thread);
        fetchCoachMessagesByThreadId(newThreadId);
        
        // Bước 2: Lên lịch rời phòng cũ và join phòng mới
        // Đảm bảo rằng chúng ta không thực hiện join và leave cùng lúc
        setTimeout(() => {
            // Rời khỏi phòng cũ trước khi tham gia phòng mới
            const oldThreadId = joinedThreadId;
            if (oldThreadId && socket?.connected) {
                const oldRoomId = `chat-${oldThreadId}`;
                try {
                    // Đánh dấu đã rời phòng trước khi thực sự rời
                    hasJoinedRoom.current = false;
                    leaveRoom(oldRoomId);
                } catch (err) {
                    // Xử lý lỗi khi rời phòng
                }
            }
            
            // Sau khi rời phòng cũ xong, cập nhật thread_id mới
            // Thay đổi joinedThreadId sau cùng để kích hoạt useEffect
            setJoinedThreadId(newThreadId);
        }, 300);
    };    // Fetch coaching sessions for coach
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

    // Fetch coach messages by partnerId (API cũ - giữ lại để tương thích)
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
            console.error("❌ Lỗi khi lấy tin nhắn theo partnerId:", err);
            message.error("Lỗi khi tải tin nhắn");
        } finally {
            setCoachLoading(false);
        }
    };

    // Fetch coach messages by thread_id (API mới hoặc endpoint cần tạo)
    const fetchCoachMessagesByThreadId = async (threadId) => {
        if (!threadId) {
            return;
        }

        setCoachLoading(true);

        try {
            // Thử cách 1: Dùng API mới (truyền thread_id)
            try {
                const response = await axios.get(
                    `http://localhost:5000/api/chat/thread/${threadId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (response.data.success) {
                    setCoachMessages(response.data.data);
                    return; // Thoát sớm nếu thành công
                }
            } catch (threadErr) {
                // API không khả dụng
                // Tiếp tục với cách 2
            }

            // Thử cách 2: Sử dụng API markGuidedAsRead (truyền thread_id)
            try {
                const messagesResponse = await axios.get(
                    `http://localhost:5000/api/chat/guided/${threadId}/messages`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (messagesResponse.data.success) {
                    setCoachMessages(messagesResponse.data.data);
                    return; // Thoát sớm nếu thành công
                }
            } catch (directErr) {
                // API không khả dụng
                // Tiếp tục với cách 3
            }

            // Fallback - Cách 3: Sử dụng API cũ (partnerId)
            if (selectedSession) {
                const partnerId = user?.role === 'coach' ? selectedSession.member_id : selectedSession.coach_id;
                await fetchCoachMessages(partnerId);
            } else {
                message.error("Không thể lấy dữ liệu tin nhắn");
            }

        } catch (err) {
            message.error("Lỗi khi tải tin nhắn");

            // Final fallback
            if (selectedSession) {
                const partnerId = user?.role === 'coach' ? selectedSession.member_id : selectedSession.coach_id;
                fetchCoachMessages(partnerId);
            }
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
            // Tạo một ID tạm thời cho tin nhắn để có thể theo dõi và tránh hiển thị trùng lặp
            const tempMessageId = Date.now().toString();

            // Đảm bảo tham gia vào phòng trước khi gửi
            if (socket?.connected && joinedThreadId) {
                const roomId = `chat-${joinedThreadId}`;
                // Force join room để đảm bảo kết nối trước khi gửi tin nhắn
                socket.emit('forceJoinRoom', roomId);
            }

            const formData = new FormData();
            formData.append('message', newMessage);

            if (joinedThreadId) {
                formData.append('thread_id', joinedThreadId); // Thêm thread_id vào request nếu có
            }

            // Xác định recipient_id là người còn lại trong thread
            let recipientId;
            if (!user) {
                message.error("Không xác định được người dùng hiện tại");
                return;
            }

            if (user.role === 'coach') {
                recipientId = selectedSession.member_id;
            } else if (user.role === 'member') {
                recipientId = selectedSession.coach_id;
            } else {
                message.error("Vai trò không hợp lệ");
                return;
            }

            formData.append('recipient_id', recipientId);
            
            // Thêm socketId để backend có thể truyền lại, dùng cho việc theo dõi
            if (socket && socket.id) {
                formData.append('_socketId', socket.id);
            }
            
            // Thêm tempMessageId để tránh hiển thị trùng lặp
            formData.append('_tempMessageId', tempMessageId);


            
            // Hiển thị tin nhắn ngay lập tức (optimistic UI)
            const optimisticMessage = {
                message_id: tempMessageId,
                thread_id: joinedThreadId,
                sender_id: user.id,
                sender_role: user.role,
                message: newMessage,
                file_url: null,
                sent_at: new Date().toISOString(),
                is_read: 0,
                _tempId: tempMessageId,
                _isOptimistic: true // Đánh dấu tin nhắn này là optimistic
            };
            
            // Thêm tin nhắn vào state ngay lập tức để UI cập nhật
            setCoachMessages(prev => [...prev, optimisticMessage]);
            
            // Xóa tin nhắn đang soạn
            setNewMessage("");

            // Gửi tin nhắn lên server
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
                // Tìm và thay thế tin nhắn optimistic bằng tin nhắn thật từ server
                const realMessage = response.data.data;
                
                setCoachMessages(prev => prev.map(msg => {
                    // Nếu là tin nhắn optimistic với cùng nội dung, thay thế nó
                    if (msg._isOptimistic && msg.message === realMessage.message) {
                        return {
                            ...realMessage,
                            _tempId: msg._tempId // Giữ lại _tempId để đánh dấu
                        };
                    }
                    return msg;
                }));
                
                // Force scroll đến cuối
                setTimeout(scrollToBottom, 100);
            }
        } catch (err) {
            if (err.response?.status === 403) {
                message.error("Chỉ được chat trong khung giờ tư vấn");
            } else {
                message.error("Lỗi khi gửi tin nhắn");
            }
            
            // Xóa tin nhắn optimistic nếu gặp lỗi
            setCoachMessages(prev => prev.filter(msg => !msg._isOptimistic));
        }
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

    // Format message time
    const formatTime = (dateString) => {
        if (!dateString) return '';
        return moment.parseZone(dateString).format('HH:mm:ss DD/MM/YYYY');
    };

    // Format session time
    const formatSessionTime = (dateTimeString) => {
        return moment.parseZone(dateTimeString).format('HH:mm DD/MM/YYYY');
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
        <Content className="coach-chat-container">
            <div className="coach-chat-container">
                <Card className="chat-card" style={{ height: '100%' }}>
                    <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
                        <Tag color={isConnected ? 'green' : 'red'}>
                            {isConnected ? '🟢' : '🔴'}
                        </Tag>
                    </div>

                    <div className="coach-topics-section" style={{ height: '100%' }}>
                        <div className="coach-sessions-sidebar">
                            <div className="coach-sessions-header">
                                <Title level={5}>Phiên Tư Vấn</Title>
                            </div>
                            <div className="coach-sessions-list">
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
                                                </div>
                                            </List.Item>
                                        )}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="coach-topic-chat">
                            {selectedSession ? (
                                <>
                                    <div className="coach-session-header">
                                        <Title level={4} style={{ margin: 0 }}>
                                            Chat với {selectedSession.member_name || `Member ${selectedSession.user_id}`}
                                        </Title>
                                        {selectedSession.scheduled_time && selectedSession.duration_minutes ? (
                                            <>
                                                <Tag color={isSessionActive(selectedSession) ? 'green' : 'red'} style={{ marginTop: '8px' }}>
                                                    {isSessionActive(selectedSession) ? '🟢' : '🔴'}
                                                </Tag>
                                            </>
                                        ) : null}
                                    </div>

                                    <div className="coach-messages-container">
                                        {coachLoading ? (
                                            <div className="loading-container"><Spin size="large" /></div>
                                        ) : coachMessages.length === 0 ? (
                                            <Empty description="Chưa có tin nhắn nào" />
                                        ) : (
                                            <List
                                                dataSource={coachMessages}
                                                renderItem={(msg) => (
                                                    <List.Item className="coach-message-item">
                                                        <div className="coach-message-content">
                                                            <div className="coach-message-header">
                                                                <Avatar icon={<UserOutlined />} />
                                                                <Text strong>
                                                                    {msg.sender_role === 'coach' ? 'Bạn' : selectedSession.member_name}
                                                                </Text>
                                                                <Text type="secondary">
                                                                    <ClockCircleOutlined /> {formatTime(msg.sent_at)}
                                                                </Text>
                                                            </div>
                                                            <Paragraph className="coach-message-text">
                                                                {msg.message}
                                                            </Paragraph>
                                                            {msg.file_url && (
                                                                <div style={{ marginTop: 8 }}>
                                                                    {/(.jpg|.jpeg|.png)$/i.test(msg.file_url) ? (
                                                                        <img src={msg.file_url} alt="attachment" style={{ maxWidth: '100%', maxHeight: 300 }} />
                                                                    ) : (
                                                                        <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                                                                            📎 Xem tệp đính kèm
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </List.Item>
                                                )}
                                            />
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    <Divider style={{ margin: 0 }} />
                                    <div className="coach-message-input">
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