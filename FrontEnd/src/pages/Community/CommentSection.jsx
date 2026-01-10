import React, { useEffect, useState } from "react";
import { List, Avatar, Typography, Spin, Input, Button, message } from "antd";

const { Title } = Typography;

const CommentSection = ({ postId, token }) => {
    const [comments, setComments] = useState([]);
    const [commentLoading, setCommentLoading] = useState(false);
    const [commentContent, setCommentContent] = useState("");

    useEffect(() => {
        if (postId) fetchComments(postId);
        // eslint-disable-next-line
    }, [postId]);

    const fetchComments = async (postId) => {
        setCommentLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/comment/${postId}`);
            const data = await res.json();
            setComments(data);
        } catch (err) {
            message.error("Lỗi khi tải bình luận");
        } finally {
            setCommentLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!commentContent.trim()) return;
        try {
            await fetch("http://localhost:5000/api/comment/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ post_id: postId, content: commentContent })
            });
            setCommentContent("");
            fetchComments(postId);
        } catch (err) {
            message.error("Lỗi khi gửi bình luận");
        }
    };

    // Xử lý phím Enter để gửi comment
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddComment();
        }
        // Shift+Enter để xuống dòng mới
    };

    return (
        <div style={{ marginTop: 16 }}>
            <Title level={5}>Bình luận</Title>
            {commentLoading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spin size="large" />
                </div>
            ) : (
                <List
                    dataSource={comments}
                    locale={{ emptyText: "Chưa có bình luận nào." }}
                    style={{ 
                        maxHeight: '300px', 
                        overflowY: 'auto',
                        border: '1px solid #f0f0f0',
                        borderRadius: '8px',
                        padding: '8px'
                    }}
                    renderItem={item => (
                        <List.Item key={item.comment_id || item.id}>
                            <List.Item.Meta
                                avatar={
                                    <Avatar 
                                        style={{ backgroundColor: "#87d068" }}
                                        src={item.avatar}
                                    >
                                        {item.full_name?.[0] || "U"}
                                    </Avatar>
                                }
                                title={
                                    <span style={{ fontWeight: 600, fontSize: '14px' }}>
                                        {item.full_name || "Ẩn danh"}
                                    </span>
                                }
                                description={
                                    <div style={{ marginTop: '4px' }}>
                                        <div style={{ 
                                            fontSize: '14px', 
                                            lineHeight: '1.5',
                                            color: '#262626',
                                            marginBottom: '4px'
                                        }}>
                                            {item.content}
                                        </div>
                                        <span style={{ 
                                            color: "#888", 
                                            fontSize: '12px',
                                            fontStyle: 'italic'
                                        }}>
                                            {new Date(item.created_at).toLocaleString('vi-VN')}
                                        </span>
                                    </div>
                                }
                            />
                        </List.Item>
                    )}
                />
            )}
            {token && (
                <div style={{ marginTop: 12 }}>
                    <Input.TextArea
                        value={commentContent}
                        onChange={e => setCommentContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={3}
                        placeholder="Nhập bình luận... (Enter để gửi, Shift+Enter để xuống dòng)"
                        style={{ 
                            width: "100%",
                            marginBottom: 8,
                            resize: 'none'
                        }}
                    />
                    <div style={{ textAlign: 'right' }}>
                        <Button 
                            type="primary" 
                            onClick={handleAddComment}
                            disabled={!commentContent.trim()}
                            size="small"
                        >
                            Gửi
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommentSection; 