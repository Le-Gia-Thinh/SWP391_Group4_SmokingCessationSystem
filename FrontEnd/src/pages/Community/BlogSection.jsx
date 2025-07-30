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
import { PlusOutlined, StarFilled } from "@ant-design/icons";
import axios from "axios";
import { Editor } from "@tinymce/tinymce-react";
import CommentSection from "./CommentSection";
import "./BlogSection.css";

const { Paragraph, Title, Text } = Typography;

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
      {blogLoading ? (
        <div style={{ textAlign: "center", margin: "50px 0" }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {featuredBlogs.length > 0 && (
            <div className="featured-blogs">
              <Title level={4} style={{ color: "#52c41a" }}>
                Bài Viết Nổi Bật
              </Title>
              <Carousel className="blog-carousel" autoplay dots={true}>
                {featuredBlogs.map((item) => (
                  <div key={item.post_id}>
                    <Badge.Ribbon text="Nổi bật" color="green">
                      <Card
                        hoverable
                        onClick={() => setViewBlog(item)}
                        title={
                          <Text strong>
                            <StarFilled
                              style={{ color: "#faad14", marginRight: 8 }}
                            />
                            {item.title}
                          </Text>
                        }
                        style={{ borderColor: "#52c41a", margin: "0 20px" }}
                      >
                        <div className="blog-content">
                          <div
                            dangerouslySetInnerHTML={{ __html: item.content }}
                          />
                        </div>
                        <Divider style={{ margin: "12px 0" }} />
                        <Space>
                          <Avatar src={item.avatar}>
                            {item.full_name?.[0] || "U"}
                          </Avatar>
                          <Text strong>{item.full_name || "Ẩn danh"}</Text>
                          <Text type="secondary">
                            • {new Date(item.created_at).toLocaleDateString()}
                          </Text>
                        </Space>
                      </Card>
                    </Badge.Ribbon>
                  </div>
                ))}
              </Carousel>
            </div>
          )}
          <Divider />
          <div className="normal-blogs">
            <Title level={4} style={{ color: "#389e0d" }}>
              Tất Cả Bài Viết
            </Title>
            <List
              itemLayout="vertical"
              dataSource={normalBlogs}
              pagination={{ pageSize: 5 }}
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
                      <div dangerouslySetInnerHTML={{ __html: item.content }} />
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          </div>
        </>
      )}
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
        title={viewBlog?.title}
        width={700}
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
