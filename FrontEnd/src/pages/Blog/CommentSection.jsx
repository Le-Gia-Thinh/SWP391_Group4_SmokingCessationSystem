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

    return (
        <div style={{ marginTop: 16 }}>
            <Title level={5}>Bình luận</Title>
            {commentLoading ? <Spin /> : (
                <List
                    dataSource={comments}
                    locale={{ emptyText: "Chưa có bình luận nào." }}
                    renderItem={item => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={<Avatar>{item.full_name?.[0] || "U"}</Avatar>}
                                title={item.full_name || "Ẩn danh"}
                                description={item.content}
                            />
                            <span style={{ color: "#888", fontSize: 12 }}>{new Date(item.created_at).toLocaleString()}</span>
                        </List.Item>
                    )}
                />
            )}
            {token && (
                <Input.Group compact style={{ marginTop: 8 }}>
                    <Input.TextArea
                        value={commentContent}
                        onChange={e => setCommentContent(e.target.value)}
                        rows={2}
                        placeholder="Nhập bình luận..."
                        style={{ width: "80%" }}
                    />
                    <Button type="primary" onClick={handleAddComment}>Gửi</Button>
                </Input.Group>
            )}
        </div>
    );
};

export default CommentSection; 