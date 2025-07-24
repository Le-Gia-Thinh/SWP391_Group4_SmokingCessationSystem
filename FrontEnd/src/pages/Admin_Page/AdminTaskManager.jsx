import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Popconfirm,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";

const { Option } = Select;

export default function AdminTaskManager() {
  const [tasks, setTasks] = useState([]);
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ visible: false, record: null });
  const [form] = Form.useForm();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const baseURL = import.meta.env.VITE_API_URL || "";
  const [filterPhase, setFilterPhase] = useState(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseURL}/api/admin/tasks`, { headers });
      setTasks(res.data.data);
    } catch {
      message.error("Không thể tải danh sách nhiệm vụ");
    } finally {
      setLoading(false);
    }
  };

  const fetchPhases = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/admin/tasks/phases`, {
        headers,
      });
      setPhases(res.data.data);
    } catch {
      message.error("Không thể tải giai đoạn");
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchPhases();
  }, []);

  const openModal = (record = null) => {
    setModal({ visible: true, record });
    form.setFieldsValue(record || {});
  };

  const saveTask = async (values) => {
    try {
      if (modal.record) {
        // Nếu sửa thì phải giữ lại task_id hiện tại
        values.task_id = modal.record.task_id;
        values.task_order = modal.record.task_order;
        await axios.put(
          `${baseURL}/api/admin/tasks/${modal.record.id}`,
          values,
          { headers }
        );
        message.success("Đã cập nhật nhiệm vụ");
      } else {
        await axios.post(`${baseURL}/api/admin/tasks`, values, { headers });
        message.success("Đã tạo nhiệm vụ mới");
      }
      fetchTasks();
      setModal({ visible: false, record: null });
      form.resetFields();
    } catch {
      message.error("Lỗi khi lưu nhiệm vụ");
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${baseURL}/api/admin/tasks/${id}`, { headers });
      message.success("Đã xóa nhiệm vụ");
      fetchTasks();
    } catch {
      message.error("Lỗi khi xóa nhiệm vụ");
    }
  };

  return (
    <div className="adminTabContainer">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2>📌 Quản lý nhiệm vụ</h2>
        <Button
          type="primary"
          onClick={() => openModal()}
          className="aum-action-btn aum-view-btn"
          style={{ fontWeight: 600, fontSize: 16, minWidth: 140 }}
        >
          + Thêm nhiệm vụ
        </Button>
      </div>
      <Select
        allowClear
        placeholder="Lọc theo giai đoạn"
        style={{ width: 280, marginBottom: 20 }}
        onChange={(value) => setFilterPhase(value)}
      >
        {phases.map((p) => (
          <Option key={p.phase_code} value={p.phase_code}>
            {p.phase_code} - {p.phase_name}
          </Option>
        ))}
      </Select>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={
          filterPhase
            ? tasks.filter((task) => task.phase_code === filterPhase)
            : tasks
        }
        className="modernTable"
        pagination={{ pageSize: 10 }}
        columns={[
          { title: "Giai đoạn", dataIndex: "phase_code" },
          { title: "Khung giờ", dataIndex: "time_slot" },
          { title: "Nội dung nhiệm vụ", dataIndex: "task_description" },
          { title: "Thứ tự", dataIndex: "task_order" },
          {
            title: "Ngày tạo",
            dataIndex: "created_at",
            render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : "—"),
          },
          {
            title: "Hành động",
            align: "center",
            render: (_, record) => (
              <Space
                style={{
                  justifyContent: "center",
                  display: "flex",
                  width: "100%",
                }}
              >
                <Button
                  size="small"
                  onClick={() => openModal(record)}
                  className="aum-action-btn aum-edit-btn"
                  style={{ minWidth: 70 }}
                >
                  Sửa
                </Button>
                <Popconfirm
                  title="Xóa nhiệm vụ này?"
                  onConfirm={() => deleteTask(record.id)}
                  okText="Xác nhận"
                  cancelText="Hủy"
                >
                  <Button
                    danger
                    size="small"
                    className="aum-action-btn aum-delete-btn"
                    style={{ minWidth: 70 }}
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
        title={modal.record ? "Chỉnh sửa nhiệm vụ" : "Thêm nhiệm vụ"}
        onCancel={() => {
          setModal({ visible: false, record: null });
          form.resetFields();
        }}
        onOk={() => form.validateFields().then(saveTask)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="phase_code"
            label="Giai đoạn"
            rules={[{ required: true, message: "Vui lòng chọn giai đoạn" }]}
          >
            <Select placeholder="Chọn giai đoạn">
              {phases.map((p) => (
                <Option key={p.phase_code} value={p.phase_code}>
                  {p.phase_code} - {p.phase_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="time_slot"
            label="Khung giờ"
            rules={[{ required: true, message: "Vui lòng chọn khung giờ" }]}
            disabled={modal.record !== null}
          >
            <Select placeholder="Chọn khung giờ">
              {Array.from({ length: 24 }, (_, i) => {
                const hour = i.toString().padStart(2, "0");
                return (
                  <Option key={hour} value={`${hour}:00`}>
                    {hour}:00
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
          <Form.Item
            name="task_description"
            label="Nội dung nhiệm vụ"
            rules={[{ required: true, message: "Nhập nội dung nhiệm vụ" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          {/* Không cần nhập task_order nữa nếu là tạo mới */}
          {modal.record && (
            <Form.Item name="task_order" label="Thứ tự">
              <Input disabled />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
