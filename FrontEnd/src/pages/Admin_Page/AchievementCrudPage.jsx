import React, { useState, useEffect } from "react";
import { Card, Table, Button, Modal, Form, Input, InputNumber, Space, Popconfirm, message } from "antd";
import axios from "axios";
import tabStyles from "./AdminTabs.module.css";

export default function AchievementCrudPage() {
    const [data, setData] = useState([]);
    const [modal, setModal] = useState({ visible: false, record: null });
    const [form] = Form.useForm();

    const baseURL = import.meta.env.VITE_API_URL || "";
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    // Fetch data
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
    }, []);

    // Save (create or update)
    const save = async (values) => {
        try {
            if (modal.record) {
                await axios.put(
                    `${baseURL}/api/achievement/${modal.record.achievement_id}`,
                    values,
                    { headers }
                );
                message.success("Cập nhật thành tựu thành công");
            } else {
                await axios.post(`${baseURL}/api/achievement`, values, { headers });
                message.success("Tạo thành tựu thành công");
            }
            setModal({ visible: false, record: null });
            form.resetFields();
            fetchData();
        } catch {
            message.error("Lưu thất bại");
        }
    };

    // Delete handler
    const handleDelete = async (id) => {
        try {
            await axios.delete(`${baseURL}/api/achievement/${id}`, { headers });
            message.success("Xóa thành tựu thành công");
            fetchData();
        } catch {
            message.error("Xóa thất bại");
        }
    };

    return (
        <div className={tabStyles.adminTabContainer}>
            <div style={{ marginBottom: 24 }}>
                <Button
                    type="primary"
                    onClick={() => {
                        setModal({ visible: true, record: null });
                        form.resetFields();
                    }}
                    className={`${tabStyles.modernButton} ${tabStyles.modernButtonPrimary}`}
                >
                    Thêm thành tựu mới
                </Button>
            </div>

            <Table
                rowKey="achievement_id"
                className={tabStyles.modernTable}
                dataSource={data}
                pagination={{ pageSize: 10 }}
                columns={[
                    { title: "ID", dataIndex: "achievement_id", key: "achievement_id", width: 60 },
                    { title: "Tiêu đề", dataIndex: "title", key: "title" },
                    { title: "Phase", dataIndex: "phase", key: "phase", width: 80 },
                    { title: "Level", dataIndex: "difficulty_level", key: "difficulty_level", width: 80 },
                    { title: "Loại", dataIndex: "achievement_type", key: "achievement_type" },
                    {
                        title: "Hành động",
                        key: "action",
                        width: 160,
                        render: (_, record) => (
                            <Space>
                                <Button
                                    size="small"
                                    onClick={() => {
                                        setModal({ visible: true, record });
                                        form.setFieldsValue(record);
                                    }}
                                    className={`${tabStyles.modernTableButton} ${tabStyles.modernButtonDefault}`}
                                >
                                    Sửa
                                </Button>
                                <Popconfirm
                                    title="Bạn có chắc muốn xóa?"
                                    onConfirm={() => handleDelete(record.achievement_id)}
                                    okText="Xác nhận"
                                    cancelText="Hủy"
                                >
                                    <Button
                                        size="small"
                                        danger
                                        className={`${tabStyles.modernTableButton} ${tabStyles.modernButtonDanger}`}
                                    >
                                        Xóa
                                    </Button>
                                </Popconfirm>
                            </Space>
                        ),
                    },
                ]}
            />

            <Modal
                open={modal.visible}
                title={modal.record ? "Sửa Thành tựu" : "Tạo Thành tựu"}
                onCancel={() => {
                    setModal({ visible: false, record: null });
                    form.resetFields();
                }}
                onOk={() => form.validateFields().then(save)}
                destroyOnClose
                className={tabStyles.modernModal}
            >
                <Form form={form} layout="vertical" className={tabStyles.modernForm}>
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
        </div>
    );
}
