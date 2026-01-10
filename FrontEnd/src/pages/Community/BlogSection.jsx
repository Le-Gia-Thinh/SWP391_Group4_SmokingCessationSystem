import React, { useState, useEffect } from "react";
import {
  Typography,
  Button,
  Spin,
  Divider,
  List,
  Card,
  Avatar,
  Empty,
  Badge,
  Carousel,
  Modal,
  Form,
  message,
  Space,
} from "antd";
import { PlusOutlined, StarFilled, EyeOutlined } from "@ant-design/icons";
import axios from "axios";
import { Editor } from "@tinymce/tinymce-react";
import CommentSection from "./CommentSection";
import "./BlogSection.css";

const { Paragraph, Title, Text } = Typography;

// Component để hiển thị nội dung blog với khả năng rút gọn
const BlogContent = ({ content, maxHeight = 150, showReadMore = true }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowReadMore, setShouldShowReadMore] = useState(false);

  useEffect(() => {
    // Kiểm tra nếu nội dung dài hơn maxHeight
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.maxHeight = `${maxHeight}px`;
    tempDiv.style.overflow = 'hidden';
    document.body.appendChild(tempDiv);
    
    const actualHeight = tempDiv.scrollHeight;
    setShouldShowReadMore(actualHeight > maxHeight);
    
    document.body.removeChild(tempDiv);
  }, [content, maxHeight]);

  return (
    <div className="blog-content-display">
      <div 
        className={`blog-content ${isExpanded ? 'expanded' : ''}`}
        style={{ 
          maxHeight: isExpanded ? 'none' : `${maxHeight}px`,
          overflow: isExpanded ? 'visible' : 'hidden'
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
      {shouldShowReadMore && showReadMore && (
        <Button 
          type="link" 
          size="small" 
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          style={{ padding: '4px 0', height: 'auto' }}
        >
          {isExpanded ? 'Thu gọn' : 'Xem thêm'}
        </Button>
      )}
    </div>
  );
};

export default function BlogSection({ token }) {
  const [blogs, setBlogs] = useState([]);
  const [blogLoading, setBlogLoading] = useState(true);
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [viewBlog, setViewBlog] = useState(null);
  const [blogForm] = Form.useForm();
  const [editorContent, setEditorContent] = useState("");

  const fetchBlogs = async () => {
    setBlogLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/community");
      setBlogs(res.data);
    } catch {
      message.error("Lỗi khi tải danh sách blog");
    } finally {
      setBlogLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Ngăn body scroll khi modal mở
  useEffect(() => {
    if (viewBlog) {
      document.body.style.overflow = 'hidden';
      
      // Force center modal positioning
      setTimeout(() => {
        const modalElement = document.querySelector('.blog-view-modal-wrap .ant-modal');
        if (modalElement) {
          modalElement.style.position = 'fixed';
          modalElement.style.top = '50%';
          modalElement.style.left = '50%';
          modalElement.style.transform = 'translate(-50%, -50%)';
          modalElement.style.margin = '0';
          modalElement.style.zIndex = '1001';
        }
        
        const wrapElement = document.querySelector('.blog-view-modal-wrap');
        if (wrapElement) {
          wrapElement.style.position = 'fixed';
          wrapElement.style.top = '0';
          wrapElement.style.left = '0';
          wrapElement.style.width = '100vw';
          wrapElement.style.height = '100vh';
          wrapElement.style.display = 'flex';
          wrapElement.style.alignItems = 'center';
          wrapElement.style.justifyContent = 'center';
          wrapElement.style.zIndex = '1000';
        }
      }, 100);
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup khi component unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [viewBlog]);

  const handleCreateBlog = async (values) => {
    if (!token) {
      message.error("Bạn cần đăng nhập để viết bài!");
      return;
    }

    // Validate editor content
    if (!editorContent || editorContent.trim().length < 20) {
      message.error("Nội dung phải có ít nhất 20 ký tự!");
      return;
    }

    try {
      // Combine form data with editor content
      const blogData = {
        title: values.title,
        content: editorContent,
      };

      await axios.post("http://localhost:5000/api/community", blogData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsBlogModalOpen(false);
      blogForm.resetFields();
      setEditorContent("");
      message.success("Bài viết đã gửi và chờ duyệt.");
      fetchBlogs();
    } catch (error) {
      message.error(error.response?.data?.message || "Lỗi khi gửi bài viết.");
    }
  };

  const handleModalClose = () => {
    setIsBlogModalOpen(false);
    blogForm.resetFields();
    setEditorContent("");
  };

  const featuredBlogs = blogs.slice(0, 2);
  const normalBlogs = blogs.slice(2);

  return (
    <div className="blog-section">
      <div className="blog-header">
        <Title level={2} style={{ color: "#389e0d" }}>
          Blog Cộng Đồng
        </Title>
        {token && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: "#52c41a", borderColor: "#52c41a" }}
            onClick={() => setIsBlogModalOpen(true)}
          >
            Viết bài mới
          </Button>
        )}
      </div>
      <div className="blog-content-wrapper">
        {blogLoading ? (
          <div className="blog-loading-container">
            <Spin size="large" />
          </div>
        ) : (
          <>
            {featuredBlogs.length > 0 && (
              <div className="featured-blogs">
                <Title level={4} style={{ color: "#52c41a", marginBottom: "16px" }}>
                  Bài Viết Nổi Bật
                </Title>
                <div className="featured-blogs-grid">
                  {featuredBlogs.map((item) => (
                    <div key={item.post_id} className="featured-blog-item">
                      <Badge.Ribbon text="Nổi bật" color="green">
                        <Card
                          hoverable
                          onClick={() => setViewBlog(item)}
                          title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <StarFilled style={{ color: "#faad14", fontSize: "14px" }} />
                              <Text strong style={{ fontSize: "16px" }}>
                                {item.title}
                              </Text>
                            </div>
                          }
                          style={{ 
                            borderColor: "#52c41a", 
                            height: "100%",
                            boxShadow: "0 2px 8px rgba(82, 196, 26, 0.15)"
                          }}
                          bodyStyle={{ padding: "16px" }}
                        >
                          <div className="featured-blog-content">
                            <BlogContent 
                              content={item.content} 
                              maxHeight={100}
                              showReadMore={false}
                            />
                          </div>
                          <Divider style={{ margin: "12px 0" }} />
                          <div className="featured-blog-meta">
                            <Space>
                              <Avatar 
                                src={item.avatar}
                                size={32}
                                style={{ backgroundColor: "#87d068" }}
                              >
                                {item.full_name?.[0] || "U"}
                              </Avatar>
                              <div>
                                <Text strong style={{ fontSize: "13px" }}>
                                  {item.full_name || "Ẩn danh"}
                                </Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: "12px" }}>
                                  {new Date(item.created_at).toLocaleDateString()}
                                </Text>
                              </div>
                            </Space>
                          </div>
                        </Card>
                      </Badge.Ribbon>
                    </div>
                  ))}
                </div>
              </div>
            )}
          <Divider />
          <div className="normal-blogs">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '16px' 
            }}>
              <Title level={4} style={{ color: "#389e0d", margin: 0 }}>
                Tất Cả Bài Viết
              </Title>
              <Text type="secondary">
                {blogs.length} bài viết
              </Text>
            </div>
            <List
              itemLayout="vertical"
              dataSource={normalBlogs}
              pagination={{ 
                pageSize: 6, 
                showSizeChanger: false,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} của ${total} bài viết`
              }}
              locale={{
                emptyText: <Empty description="Chưa có bài viết nào." />,
              }}
              renderItem={(item) => (
                <List.Item>
                  <Card hoverable onClick={() => setViewBlog(item)}>
                    <Card.Meta
                      avatar={
                        <Avatar
                          src={item.avatar}
                          style={{ backgroundColor: "#87d068" }}
                        >
                          {item.full_name?.[0] || "U"}
                        </Avatar>
                      }
                      title={<Title level={5}>{item.title}</Title>}
                      description={`Đăng bởi ${
                        item.full_name || "Ẩn danh"
                      } vào ${new Date(item.created_at).toLocaleDateString()}`}
                    />
                    <div className="blog-content" style={{ marginTop: 16 }}>
                      <BlogContent content={item.content} maxHeight={150} />
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          </div>
        </>
        )}
      </div>
      {/* Blog Modal */}
      <Modal
        title="Viết bài mới"
        open={isBlogModalOpen}
        onCancel={handleModalClose}
        footer={null}
        width={800}
        destroyOnClose
        maskClosable={false}
        style={{ zIndex: 1000 }}
        bodyStyle={{ padding: "24px" }}
      >
        <Form
          form={blogForm}
          layout="vertical"
          onFinish={handleCreateBlog}
          initialValues={{ title: "", content: "" }}
        >
          <Form.Item
            label="Tiêu đề"
            name="title"
            rules={[
              { required: true, message: "Vui lòng nhập tiêu đề" },
              { min: 5, message: "Tiêu đề phải có ít nhất 5 ký tự" },
            ]}
          >
            <input
              placeholder="Nhập tiêu đề bài viết..."
              style={{
                height: "40px",
                width: "100%",
                borderRadius: 8,
                border: "1px solid #d9d9d9",
              }}
            />
          </Form.Item>
          <Form.Item label="Nội dung" name="content">
            <Editor
              apiKey="hxh2z71exm0tjsd8kxj5kxkb6k0u7ibbq0i8wtq4g2zzdze4"
              value={editorContent}
              onEditorChange={(content) => {
                setEditorContent(content);
                // Also update the form field
                blogForm.setFieldsValue({ content: content });
              }}
              init={{
                height: 400,
                menubar: "file edit view insert format tools table help",
                plugins: [
                  "advlist",
                  "autolink",
                  "lists",
                  "link",
                  "image",
                  "charmap",
                  "preview",
                  "anchor",
                  "searchreplace",
                  "visualblocks",
                  "code",
                  "fullscreen",
                  "insertdatetime",
                  "media",
                  "table",
                  "help",
                  "wordcount",
                  "emoticons",
                  "codesample",
                  "importcss",
                  "save",
                  "directionality",
                ],
                toolbar:
                  "undo redo | blocks fontsizeinput | " +
                  "bold italic underline strikethrough | forecolor backcolor | " +
                  "alignleft aligncenter alignright alignjustify | " +
                  "bullist numlist outdent indent | " +
                  "link image media table | emoticons codesample | " +
                  "preview fullscreen | removeformat help",
                content_style:
                  'body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif; font-size:14px; padding: 16px; line-height: 1.6; }',
                placeholder: "Nhập nội dung bài viết...",
                branding: false,
                elementpath: false,
                resize: false,
                skin: "oxide",
                content_css: "default",
                toolbar_mode: "sliding",
                image_advtab: true,
                image_caption: true,
                quickbars_selection_toolbar:
                  "bold italic | quicklink h2 h3 blockquote",
                contextmenu: "link image table",
                font_size_formats: "8pt 10pt 12pt 14pt 16pt 18pt 24pt 36pt",
              }}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{ width: "100%", height: "40px" }}
            >
              Gửi Bài Viết
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      {/* View Blog Modal */}
      <Modal
        open={!!viewBlog}
        onCancel={() => setViewBlog(null)}
        footer={null}
        title={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}>
            <EyeOutlined />
            {viewBlog?.title}
          </div>
        }
        width={800}
        centered={true}
        destroyOnClose={true}
        maskClosable={true}
        getContainer={() => document.body}
        style={{
          position: 'fixed',
          top: '50% !important',
          left: '50% !important', 
          transform: 'translate(-50%, -50%) !important',
          margin: '0 !important'
        }}
        wrapClassName="blog-view-modal-wrap"
        maskStyle={{
          position: 'fixed !important',
          top: '0 !important',
          left: '0 !important',
          width: '100vw !important',
          height: '100vh !important',
          zIndex: '1000 !important'
        }}
        bodyStyle={{ 
          maxHeight: '70vh', 
          overflowY: 'auto',
          padding: '24px'
        }}
      >
        <div className="blog-content">
          <div dangerouslySetInnerHTML={{ __html: viewBlog?.content }} />
        </div>
        <Divider />
        <Space>
          <Avatar src={viewBlog?.avatar}>
            {viewBlog?.full_name?.[0] || "U"}
          </Avatar>
          <Text strong>{viewBlog?.full_name || "Ẩn danh"}</Text>
          <Text type="secondary">
            {viewBlog && new Date(viewBlog.created_at).toLocaleDateString()}
          </Text>
        </Space>
        <Divider />
        {viewBlog && <CommentSection postId={viewBlog.post_id} token={token} />}
      </Modal>
    </div>
  );
}
