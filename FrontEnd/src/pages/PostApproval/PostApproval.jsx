import React, { useState, useEffect } from 'react';
import { List, Button, message, Spin, Empty, Typography, Popconfirm, Avatar, Card, Layout } from 'antd';
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
            fetchPendingPosts(); // Refresh list
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
            fetchPendingPosts(); // Refresh list
        } catch (error) {
            message.error("Có lỗi xảy ra khi xóa bài viết.");
        }
    };

    return (
        <Layout className="layout">
            <Navbar />
            <Content style={{ padding: '0 50px', marginTop: '20px' }}>
                <div className="post-approval-container">
                    <Card>
                        <Title level={2} style={{ textAlign: 'center' }}>Quản lý & Duyệt Bài Viết</Title>
                        {loading ? (
                            <Spin style={{ display: 'block', margin: '20px auto' }} />
                        ) : posts.length === 0 ? (
                            <Empty description="Không có bài viết nào chờ duyệt." />
                        ) : (
                            <List
                                itemLayout="vertical"
                                size="large"
                                dataSource={posts}
                                renderItem={(item) => (
                                    <List.Item
                                        key={item.post_id}
                                        actions={[
                                            <Button type="primary" onClick={() => handleApprove(item.post_id)}>Duyệt Bài</Button>,
                                            <Popconfirm
                                                title="Bạn có chắc muốn xóa vĩnh viễn bài viết này?"
                                                onConfirm={() => handleDelete(item.post_id)}
                                                okText="Xóa"
                                                cancelText="Hủy"
                                            >
                                                <Button danger>Xóa Bài</Button>
                                            </Popconfirm>
                                        ]}
                                    >
                                        <List.Item.Meta
                                            avatar={<Avatar src={item.avatar || undefined} >{item.full_name?.[0] || 'U'}</Avatar>}
                                            title={<Text strong>{item.title}</Text>}
                                            description={
                                                <>
                                                    <span>Tác giả: <Text type="secondary">{item.full_name || 'Không rõ'}</Text></span>
                                                    <span style={{ marginLeft: '16px' }}>Ngày gửi: <Text type="secondary">{new Date(item.created_at).toLocaleString()}</Text></span>
                                                </>
                                            }
                                        />
                                        <Paragraph style={{ marginTop: '1em', paddingLeft: '40px' }}>{item.content}</Paragraph>
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