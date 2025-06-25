// PostApproval.jsx - Duyệt bài viết với Ant Design đẹp và responsive
import React, { useState, useEffect } from 'react';
import {
    Layout,
    List,
    Button,
    message,
    Spin,
    Empty,
    Typography,
    Popconfirm,
    Avatar,
    Card,
    Space
} from 'antd';
import axios from 'axios';
import Navbar from '../../layouts/Navbar';
import './PostApproval.css';

const { Title, Paragraph, Text } = Typography;
const { Content } = Layout;

const PostApproval = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPendingPosts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/community/pending", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPosts(res.data);
        } catch (error) {
            message.error("Không thể tải danh sách bài viết chờ duyệt.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingPosts();
    }, []);

    const handleApprove = async (postId) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(`http://localhost:5000/api/community/${postId}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success("Bài viết đã được duyệt.");
            fetchPendingPosts();
        } catch (error) {
            message.error("Có lỗi xảy ra khi duyệt bài.");
        }
    };

    const handleDelete = async (postId) => {
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:5000/api/community/admin/${postId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success("Bài viết đã được xóa.");
            fetchPendingPosts();
        } catch (error) {
            message.error("Có lỗi xảy ra khi xóa bài viết.");
        }
    };

    return (
        <Layout>
            <Navbar />
            <Content style={{ background: 'linear-gradient(180deg, #eaffd0 0%, #d2f7c5 60%, #eaffd0 100%)', padding: '60px 24px', minHeight: '100vh' }}>
                <div className="post-approval-container">
                    <Card
                        bordered={false}
                        style={{ maxWidth: 1000, margin: '0 auto', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                    >
                        <Title level={2} style={{ textAlign: 'center', color: '#389e0d' }}>Quản lý & Duyệt Bài Viết</Title>

                        {loading ? (
                            <Spin style={{ display: 'block', margin: '40px auto' }} />
                        ) : posts.length === 0 ? (
                            <Empty description="Không có bài viết nào chờ duyệt." style={{ marginTop: 40 }} />
                        ) : (
                            <List
                                itemLayout="vertical"
                                size="large"
                                dataSource={posts}
                                renderItem={(item) => (
                                    <List.Item key={item.post_id}>
                                        <Card
                                            hoverable
                                            style={{ borderLeft: '4px solid #52c41a', marginBottom: 24 }}
                                        >
                                            <List.Item.Meta
                                                avatar={<Avatar src={item.avatar}>{item.full_name?.[0] || 'U'}</Avatar>}
                                                title={<Text strong>{item.title}</Text>}
                                                description={
                                                    <Space direction="vertical" size={4}>
                                                        <Text type="secondary">Tác giả: {item.full_name || 'Không rõ'}</Text>
                                                        <Text type="secondary">Ngày gửi: {new Date(item.created_at).toLocaleString()}</Text>
                                                    </Space>
                                                }
                                            />
                                            <Paragraph style={{ marginTop: 16 }}>{item.content}</Paragraph>
                                            <Space style={{ marginTop: 16 }}>
                                                <Button type="primary" onClick={() => handleApprove(item.post_id)}>Duyệt Bài</Button>
                                                <Popconfirm
                                                    title="Bạn có chắc muốn xóa vĩnh viễn bài viết này?"
                                                    onConfirm={() => handleDelete(item.post_id)}
                                                    okText="Xóa"
                                                    cancelText="Hủy"
                                                >
                                                    <Button danger>Xóa Bài</Button>
                                                </Popconfirm>
                                            </Space>
                                        </Card>
                                    </List.Item>
                                )}
                            />
                        )}
                    </Card>
                </div>
            </Content>
        </Layout>
    );
};

export default PostApproval;
