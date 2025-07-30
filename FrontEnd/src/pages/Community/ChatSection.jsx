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
    const [joinedThreadId, setJoinedThreadId] = useState(null);
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
        
        socket.on('connect', () => {
            // Khi socket kết nối lại, join vào các room nếu cần
            if (activeChatTab === "community") {
                socket.emit('joinRoom', 'community-chat');
                setTimeout(() => {
                    socket.emit('forceJoinRoom', 'community-chat');
                }, 1000);
            } else if (activeChatTab === "topics" && selectedTopic) {
                const roomId = `topic-${selectedTopic.id}`;
                socket.emit('joinRoom', roomId);
                setTimeout(() => {
                    socket.emit('forceJoinRoom', roomId);
                }, 1000);
            } else if (activeChatTab === "coach" && joinedThreadId) {
                const roomId = `chat-${joinedThreadId}`;
                socket.emit('joinRoom', roomId);
                setTimeout(() => {
                    socket.emit('forceJoinRoom', roomId);
                }, 1000);
            }
        });
        
        socket.on('joinSuccess', (data) => {
            // Room joined successfully
        });
        
        socket.on('disconnect', (reason) => {
            // Socket disconnected
        });
        
        // User joined/left events
        socket.on('userJoined', (data) => {
            // User joined room
        });
        
        socket.on('userLeft', (data) => {
            // User left room
        });

        // Listen for guided chat messages (coach-member)
        socket.on('receiveGuidedMessage', (messageData) => {
            // Kiểm tra thread_id để chỉ hiển thị tin nhắn thuộc thread đang xem
            if (selectedCoach && joinedThreadId && messageData.thread_id && messageData.thread_id.toString() === joinedThreadId.toString()) {
                // Kiểm tra xem đây có phải là tin nhắn từ chính người dùng hiện tại không
                const isMyMessage = messageData.sender_id && user?.id && messageData.sender_id.toString() === user.id.toString();
                const socketId = messageData._socketId;
                
                // Kiểm tra xem tin nhắn này đã có trong danh sách chưa (dựa vào message_id)
                const isDuplicate = coachMessages.some(msg => {
                    // Kiểm tra trùng message_id (tin nhắn thực từ server)
                    const hasSameId = msg.message_id && messageData.message_id && 
                                     msg.message_id.toString() === messageData.message_id.toString();
                    
                    // Hoặc kiểm tra trùng nội dung và người gửi (tin nhắn optimistic)
                    const isOptimisticDuplicate = msg._isOptimistic && 
                                                  msg.message === messageData.message && 
                                                  msg.sender_id && messageData.sender_id && 
                                                  msg.sender_id.toString() === messageData.sender_id.toString();
                                                  
                    return hasSameId || isOptimisticDuplicate;
                });
                
                if (isDuplicate) {
                    console.log('🔄 Message already exists in the list, updating instead');
                    
                    // Cập nhật tin nhắn optimistic với dữ liệu thực từ server
                    setCoachMessages(prev => prev.map(msg => {
                        // Nếu tìm thấy tin nhắn optimistic có cùng nội dung, thay thế bằng tin nhắn thực
                        if (msg._isOptimistic && msg.message === messageData.message && 
                            msg.sender_id && messageData.sender_id && 
                            msg.sender_id.toString() === messageData.sender_id.toString()) {
                            console.log('✅ Replacing optimistic message with real message');
                            return {
                                ...messageData,
                                _tempId: msg._tempId // Giữ lại _tempId để đánh dấu
                            };
                        }
                        return msg;
                    }));
                } else if (isMyMessage && socket.id !== socketId) {
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
            } else {
                // Message is for another thread, ignoring
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
    }, [socket, selectedCoach, selectedTopic, joinedThreadId]);

    // Biến theo dõi xem đã join room cho thread hiện tại chưa
    const hasJoinedRoom = useRef(false);
    
    // Join socket room khi chọn coach (theo thread_id, chuẩn backend)
    useEffect(() => {
        if (!socket || !joinedThreadId) {
            hasJoinedRoom.current = false;
            return;
        }
        
        // Reset trạng thái join room khi thread_id thay đổi
        hasJoinedRoom.current = false;
        
        // Đợi một chút để đảm bảo component đã render xong và socket đã sẵn sàng
        const setupTimer = setTimeout(() => {
            // Chỉ tiếp tục nếu socket đã kết nối
            if (!socket?.connected) {
                return;
            }

            const threadRoom = `chat-${joinedThreadId}`;
            
            // Đánh dấu đã join room
            hasJoinedRoom.current = true;
            
            // Sử dụng hàm từ SocketContext
            socket.emit('joinRoom', threadRoom);
            
            // Đảm bảo đã tham gia phòng - kiểm tra trước để tránh join nhiều lần
            setTimeout(() => {
                if (socket?.connected) {
                    socket.emit('forceJoinRoom', threadRoom);
                    // Kiểm tra các room đã join
                    socket.emit('getRooms');
                }
            }, 1000);

            return () => {
                if (socket?.connected) {
                    socket.emit('leaveRoom', threadRoom);
                    hasJoinedRoom.current = false;
                }
            };
        }, 300);
        
        // Cleanup timer nếu component unmount trước khi timer chạy xong
        return () => clearTimeout(setupTimer);
    }, [socket, joinedThreadId]);

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
    // Fetch coach messages by partnerId (API cũ)
    const fetchCoachMessages = async (partnerId) => {
        if (!partnerId) return;
        setCoachLoading(true);
        try {
            const response = await axios.get(
                `http://localhost:5000/api/chat/guided/${partnerId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                setCoachMessages(response.data.data); // Không reverse nữa
            }
        } catch (err) {
            console.error("❌ Lỗi khi lấy tin nhắn theo partnerId:", err);
            message.error("Lỗi khi tải tin nhắn");
        } finally {
            setCoachLoading(false);
        }
    };

    // Fetch coach messages by thread_id (API mới)
    const fetchCoachMessagesByThreadId = async (threadId) => {
        if (!threadId) {
            console.error("❌ Không có thread_id");
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
                } else {
                    console.error("❌ API trả về thất bại:", response.data);
                }
            } catch (threadErr) {
                console.error("❌ API thread_id không khả dụng:", threadErr.message);
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
                } else {
                    console.error("❌ API trả về thất bại:", messagesResponse.data);
                }
            } catch (directErr) {
                console.error("❌ API messages direct không khả dụng:", directErr.message);
                // Tiếp tục với cách 3
            }

            // Fallback - Cách 3: Sử dụng API cũ (partnerId)
            // Fallback to old API method
            if (selectedCoach) {
                await fetchCoachMessages(selectedCoach.coach_id);
            } else {
                message.error("Không thể lấy dữ liệu tin nhắn");
            }

        } catch (err) {
            console.error("❌ Lỗi nghiêm trọng khi lấy tin nhắn:", err);
            message.error("Lỗi khi tải tin nhắn");

            // Final fallback
            if (selectedCoach) {
                fetchCoachMessages(selectedCoach.coach_id);
            }
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
    // Gộp các phiên tư vấn theo coach_id và lấy thread_id
    const groupedCoaches = Object.values(
        coachingSessions.reduce((acc, session) => {
            // Kiểm tra xem phiên này có thread_id hay không
            
            if (!acc[session.coach_id]) {
                acc[session.coach_id] = {
                    coach_id: session.coach_id,
                    coach_name: session.coach_name,
                    sessions: [],
                    thread_id: session.thread_id || null // lấy thread_id từ session, mặc định là null
                };
            } else if (!acc[session.coach_id].thread_id && session.thread_id) {
                // Nếu session hiện tại có thread_id nhưng coach tổng hợp chưa có
                acc[session.coach_id].thread_id = session.thread_id;
            }
            
            acc[session.coach_id].sessions.push(session);
            return acc;
        }, {})
    );

    // Khi chọn coach, lấy toàn bộ tin nhắn với coach đó bằng thread_id
    const handleCoachSelect = (coach) => {
        // Không thực hiện gì nếu đã chọn coach này rồi
        if (selectedCoach?.coach_id === coach.coach_id) {
            return;
        }
        
        // Bước 1: Thiết lập trạng thái coach mới
        setSelectedCoach(coach);
        
        // Bước 2: Tìm thread_id từ sessions nếu chưa có
        const findThreadId = async () => {
            let threadId = coach.thread_id;
            
            // Nếu đã có thread_id trong object coach, sử dụng nó
            if (threadId) {
                // Fetch messages bằng thread_id
                fetchCoachMessagesByThreadId(threadId);
                setJoinedThreadId(threadId); // Cập nhật thread_id
                return;
            }
            
            // Kiểm tra xem có session nào có thread_id không
            if (coach.sessions && coach.sessions.length > 0) {
                for (const session of coach.sessions) {
                    if (session.thread_id) {
                        threadId = session.thread_id;
                        fetchCoachMessagesByThreadId(threadId);
                        setJoinedThreadId(threadId);
                        return;
                    }
                }
            }
            
            // Nếu không tìm thấy thread_id, thử gọi API với coach_id
            try {
                // Tìm thread_id từ backend
                const response = await axios.get(
                    `http://localhost:5000/api/chat/find-thread-by-coach/${coach.coach_id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                if (response.data.success && response.data.thread_id) {
                    console.log(`✅ Đã tìm thấy thread_id: ${response.data.thread_id} từ API`);
                    fetchCoachMessagesByThreadId(response.data.thread_id);
                    setJoinedThreadId(response.data.thread_id);
                    return;
                }
            } catch (err) {
                console.error("❌ Lỗi khi tìm thread_id từ API:", err);
            }
            
            // Fallback cuối cùng: Sử dụng coach_id
            fetchCoachMessages(coach.coach_id);
        };
        
        // Thực hiện tìm thread_id
        findThreadId();
        
        // Bước 3: Lên lịch rời phòng cũ
        // Đảm bảo rằng chúng ta không thực hiện join và leave cùng lúc
        setTimeout(() => {
            // Rời khỏi phòng cũ nếu có
            const oldThreadId = joinedThreadId;
            if (oldThreadId && socket?.connected) {
                const oldRoomId = `chat-${oldThreadId}`;
                try {
                    // Đánh dấu đã rời phòng trước khi thực sự rời
                    hasJoinedRoom.current = false;
                    socket.emit('leaveRoom', oldRoomId);
                } catch (err) {
                    console.error('❌ Lỗi khi rời phòng:', err);
                }
            }
        }, 300);
    };
    const handleTopicSelect = (topic) => {
        setSelectedTopic(topic);
        fetchTopicMessages(topic.topic_id);
    };
    const handleChatTabChange = (key) => {
        setActiveChatTab(key);
        setSelectedTopic(null);
        setTopicMessages([]);
        setSelectedCoach(null);
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

            if (joinedThreadId) {
                formData.append('thread_id', joinedThreadId); // Thêm thread_id vào request nếu có
            }

            // Xác định recipient_id là coach_id hoặc member_id (vẫn giữ để tương thích với API cũ)
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

            // Thêm socketId để backend có thể truyền lại, dùng cho việc theo dõi
            if (socket && socket.id) {
                formData.append('_socketId', socket.id);
            }
            
            // Tạo một ID tạm thời cho tin nhắn để có thể theo dõi và tránh hiển thị trùng lặp
            const tempMessageId = Date.now().toString();
            formData.append('_tempMessageId', tempMessageId);
            
            // Prepare formData for sending
            
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
                console.log('✅ Message sent successfully:', response.data.data);
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
            }
        } catch (err) {
            console.error('❌ Error sending message:', err);
            if (err.response?.status === 403) {
                message.error("Chỉ được chat trong khung giờ tư vấn");
            } else {
                message.error("Lỗi khi gửi tin nhắn");
            }
            
            // Xóa tin nhắn optimistic nếu gặp lỗi
            setCoachMessages(prev => prev.filter(msg => !msg._isOptimistic));
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
                                                <List.Item className="chat-message-item">
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
                                                            <List.Item className="chat-message-item">
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
                                                            <List.Item className="chat-message-item">
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