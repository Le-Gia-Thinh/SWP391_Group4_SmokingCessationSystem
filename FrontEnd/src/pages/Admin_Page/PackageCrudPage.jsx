import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  Input,
  message,
  Switch,
  Space,
  Popconfirm,
} from "antd";
import axios from "axios";

export default function PackageCrudPage() {
  const [data, setData] = useState([]);
  const [modal, setModal] = useState({ visible: false, record: null });
  const [form] = Form.useForm();

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const baseURL = import.meta.env.VITE_API_URL || "";

  const fetchData = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/subscriptions/packages`, {
        headers,
      });
      setData(res.data);
    } catch {
      message.error("Không tải được danh sách gói");
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openModal = (record) => {
    setModal({ visible: true, record });
    form.resetFields();
    if (record) {
      form.setFieldsValue({
        package_name: record.package_name,
        description: record.description || "",
        price: record.price,
        duration_days: record.duration_days,
        coach_access: Boolean(record.coach_access),
        community_access: Boolean(record.community_access),
        premium_content: Boolean(record.premium_content),
      });
    } else {
      form.setFieldsValue({
        package_name: "",
        description: "",
        price: 0,
        duration_days: 1,
        coach_access: false,
        community_access: false,
        premium_content: false,
      });
    }
  };

  const save = async (values) => {
    const payload = {
      ...values,
      coach_access: Boolean(values.coach_access),
      community_access: Boolean(values.community_access),
      premium_content: Boolean(values.premium_content),
    };
    try {
      if (modal.record) {
        await axios.put(
          `${baseURL}/api/subscriptions/packages/${modal.record.package_id}`,
          payload,
          { headers }
        );
        message.success("Cập nhật thành công");
      } else {
        await axios.post(`${baseURL}/api/subscriptions/packages`, payload, {
          headers,
        });
        message.success("Tạo mới thành công");
      }
      fetchData();
      setModal({ visible: false, record: null });
    } catch (err) {
      message.error(err.response?.data?.message || "Lỗi khi lưu gói");
    }
  };

  const validateUniqueName = (_, value) => {
    if (!value || !value.trim() || value.trim() === ".") {
      return Promise.reject(new Error("Tên gói không hợp lệ"));
    }
    const name = value.trim().toLowerCase();
    const dup = data.some(
      (pkg) =>
        pkg.package_name.toLowerCase() === name &&
        pkg.package_id !== modal.record?.package_id
    );
    if (dup) {
      return Promise.reject(new Error("Tên gói đã tồn tại"));
    }
    return Promise.resolve();
  };

  return (
    <div className="adminTabContainer">
      <div style={{ marginBottom: 24 }}>
        <Button
          type="primary"
          onClick={() => openModal(null)}
          className="aum-action-btn aum-view-btn"
          style={{ fontWeight: 600, fontSize: 16, minWidth: 140 }}
        >
          Thêm gói mới
        </Button>
      </div>
      <Table
        rowKey="package_id"
        className="ant-table admin-page"
        dataSource={data}
        columns={[
          { title: "Tên gói", dataIndex: "package_name", key: "package_name" },
          {
            title: "Giá (đ)",
            dataIndex: "price",
            key: "price",
            render: (v) =>
              Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 }),
          },
          {
            title: "Thời hạn (ngày)",
            dataIndex: "duration_days",
            key: "duration_days",
          },
          {
            title: "Coach",
            dataIndex: "coach_access",
            key: "coach_access",
            render: (v) => (v ? "✔️" : "❌"),
          },
          {
            title: "Community",
            dataIndex: "community_access",
            key: "community_access",
            render: (v) => (v ? "✔️" : "❌"),
          },
          {
            title: "Premium",
            dataIndex: "premium_content",
            key: "premium_content",
            render: (v) => (v ? "✔️" : "❌"),
          },
          { title: "Mô tả", dataIndex: "description", key: "description" },
          {
            title: "Hành động",
            key: "action",
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
                  onClick={() => openModal(record)}
                  className="aum-action-btn aum-edit-btn"
                  style={{ minWidth: 90 }}
                >
                  Chỉnh sửa
                </Button>
                <Popconfirm
                  title="Bạn có chắc muốn xóa?"
                  onConfirm={() => {
                    axios
                      .delete(
                        `${baseURL}/api/subscriptions/packages/${record.package_id}`,
                        { headers }
                      )
                      .then(() => {
                        message.success("Xóa thành công");
                        fetchData();
                      })
                      .catch(() => message.error("Xóa thất bại"));
                  }}
                  okText="Xác nhận"
                  cancelText="Hủy"
                >
                  <Button
                    danger
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
        pagination={{ pageSize: 8 }}
        style={{
          borderRadius: 12,
          boxShadow: "0 2px 16px rgba(102, 126, 234, 0.10)",
        }}
      />

      <Modal
        open={modal.visible}
        title={modal.record ? "Chỉnh sửa gói" : "Tạo gói mới"}
        onCancel={() => {
          setModal({ visible: false, record: null });
          form.resetFields();
        }}
        onOk={() => form.validateFields().then(save)}
        destroyOnHidden
        className="modernModal"
        style={{ borderRadius: 16 }}
        okButtonProps={{ className: "aum-action-btn aum-edit-btn" }}
        cancelButtonProps={{ className: "aum-action-btn aum-delete-btn" }}
      >
        <Form form={form} layout="vertical" className="modernForm">
          <Form.Item
            name="package_name"
            label="Tên gói"
            rules={[{ validator: validateUniqueName }]}
          >
            <Input className="aum-action-btn" />
          </Form.Item>

          <Form.Item
            name="price"
            label="Giá (đ)"
            rules={[
              { required: true, message: "Vui lòng nhập giá" },
              {
                validator(_, value) {
                  if (value < 0) {
                    return Promise.reject(new Error("Giá không được âm"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              step={0.01}
              precision={2}
              className="aum-action-btn"
            />
          </Form.Item>

          <Form.Item
            name="duration_days"
            label="Thời hạn (ngày)"
            rules={[
              { required: true, message: "Vui lòng nhập thời hạn" },
              {
                validator(_, value) {
                  if (!Number.isInteger(value) || value < 1) {
                    return Promise.reject(new Error("Phải là số nguyên ≥ 1"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber style={{ width: "100%" }} className="aum-action-btn" />
          </Form.Item>

          <Form.Item
            name="coach_access"
            label="Cho phép coach"
            valuePropName="checked"
          >
            <Switch className="aum-action-btn" />
          </Form.Item>
          <Form.Item
            name="community_access"
            label="Truy cập cộng đồng"
            valuePropName="checked"
          >
            <Switch className="aum-action-btn" />
          </Form.Item>
          <Form.Item
            name="premium_content"
            label="Nội dung Premium"
            valuePropName="checked"
          >
            <Switch className="aum-action-btn" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
          >
            <Input.TextArea className="aum-action-btn" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
