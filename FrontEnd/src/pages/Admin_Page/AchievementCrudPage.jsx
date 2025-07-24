// src/pages/Admin_Page/AchievementCrudPage.jsx
import React, { useState, useEffect } from "react";
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    InputNumber,
    Space,
    Popconfirm,
    message,
    Card,
} from "antd";
import axios from "axios";

export default function AchievementCrudPage() {
    const [data, setData] = useState([]);
    const [modal, setModal] = useState({ visible: false, record: null });
    const [form] = Form.useForm();

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    const baseURL = import.meta.env.VITE_API_URL || "";

    // 1) Fetch data once on mount
    const fetchData = async () => {
        try {
            const res = await axios.get(`${baseURL}/api/achievement`, { headers });
            setData(Array.isArray(res.data) ? res.data : []);
        } catch {
            message.error("Không tải được danh sách thành tựu");
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 2) Open modal for create / edit
    const openModal = (record = null) => {
        setModal({ visible: true, record });
        form.resetFields();
        form.setFieldsValue(
            record || {
                title: "",
                description: "",
                badge_image: "",
                achievement_type: "",
                difficulty_level: 1,
                phase: 1,
                check_code: "",
            }
        );
    };

    // 3) Save handler (create or update)
    const save = async (values) => {
        try {
            if (modal.record) {
                // update
                await axios.put(
                    `${baseURL}/api/achievement/${modal.record.achievement_id}`,
                    values,
                    { headers }
                );
                message.success("Cập nhật thành tựu thành công");
            } else {
                // create
                await axios.post(`${baseURL}/api/achievement`, values, { headers });
                message.success("Tạo thành tựu thành công");
            }
            setModal({ visible: false, record: null });
            fetchData();
        } catch (err) {
            message.error(err.response?.data?.message || "Lỗi xử lý");
        }
    };

    // 4) Delete handler
    const handleDelete = async (id) => {
        try {
            await axios.delete(`${baseURL}/api/achievement/${id}`, { headers });
            message.success("Xóa thành tựu thành công");
            fetchData();
        } catch {
            message.error("Xóa thất bại");
        }
    };

    // 5) Table columns
    const columns = [
        { title: "ID", dataIndex: "achievement_id", width: 60 },
        { title: "Tiêu đề", dataIndex: "title" },
        { title: "Phase", dataIndex: "phase", width: 80 },
        { title: "Level", dataIndex: "difficulty_level", width: 80 },
        { title: "Loại", dataIndex: "achievement_type" },
        {
            title: "Hành động",
            key: "actions",
            width: 160,
            render: (_, record) => (
                <Space>
                    <Button size="small" onClick={() => openModal(record)}>
                        Sửa
                    </Button>
                    <Popconfirm
                        title="Xác nhận xóa?"
                        onConfirm={() => handleDelete(record.achievement_id)}
                    >
                        <Button size="small" danger>
                            Xóa
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Card
            title="Quản lý Thành tựu"
            extra={
                <Button type="primary" onClick={() => openModal(null)}>
                    Thêm mới
                </Button>
            }
            style={{ margin: 24 }}
        >
            <Table
                rowKey="achievement_id"
                columns={columns}
                dataSource={data}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={modal.record ? "Sửa Thành tựu" : "Tạo Thành tựu"}
                open={modal.visible}
                maskClosable={false}
                keyboard={false}
                onCancel={() => setModal({ visible: false, record: null })}
                onOk={() => form.validateFields().then(save)}
                destroyOnClose
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="title"
                        label="Tiêu đề"
                        rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Mô tả"
                        rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
                    >
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="badge_image" label="URL Badge">
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="achievement_type"
                        label="Loại"
                        rules={[{ required: true, message: "Vui lòng nhập loại" }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="difficulty_level"
                        label="Độ khó"
                        rules={[{ required: true, message: "Vui lòng chọn độ khó" }]}
                    >
                        <InputNumber min={1} max={5} style={{ width: 120 }} />
                    </Form.Item>
                    <Form.Item
                        name="phase"
                        label="Phase"
                        rules={[{ required: true, message: "Vui lòng chọn phase" }]}
                    >
                        <InputNumber min={1} max={5} style={{ width: 120 }} />
                    </Form.Item>
                    <Form.Item name="check_code" label="Check Code">
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
}
