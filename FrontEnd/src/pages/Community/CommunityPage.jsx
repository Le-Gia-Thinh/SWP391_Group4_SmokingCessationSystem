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
    }, []);

    // Handle main tab change
    const handleMainTabChange = (key) => {
        setActiveMainTab(key);
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
        </Layout>
    );
} 