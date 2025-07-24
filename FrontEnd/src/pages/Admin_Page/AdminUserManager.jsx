import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  Popconfirm,
  Modal,
  Form,
  Input,
  message,
  Select,
} from "antd";
import axios from "axios";
import tabStyles from "./AdminTabs.module.css";
import dayjs from "dayjs";

const { Option } = Select;

export default function AdminUserManager() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ visible: false, record: null });
  const [form] = Form.useForm();

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const baseURL = import.meta.env.VITE_API_URL || "";

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseURL}/api/admin/members`, { headers });
      setMembers(res.data.data);
    } catch (err) {
      message.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const openModal = (record) => {
    setModal({ visible: true, record });
    form.setFieldsValue(record);
  };

  const save = async (values) => {
    try {
      await axios.put(`${baseURL}/api/admin/members/${modal.record.user_id}`, values, { headers });
      message.success("Cập nhật thành công");
      fetchMembers();
      setModal({ visible: false, record: null });
    } catch (err) {
      message.error("Lỗi khi cập nhật người dùng");
    }
  };

  const lockUser = async (id) => {
    try {
      await axios.patch(`${baseURL}/api/admin/members/${id}/lock`, {}, { headers });
      message.success("Đã khóa tài khoản");
      fetchMembers();
    } catch {
      message.error("Lỗi khi khóa tài khoản");
    }
  };

  const unlockUser = async (id) => {
    try {
      await axios.patch(`${baseURL}/api/admin/members/${id}/unlock`, {}, { headers });
      message.success("Đã mở khóa tài khoản");
      fetchMembers();
    } catch {
      message.error("Lỗi khi mở khóa tài khoản");
    }
  };

  const deleteUser = async (id) => {
    try {
      await axios.delete(`${baseURL}/api/admin/members/${id}`, { headers });
      message.success("Đã xóa người dùng");
      fetchMembers();
    } catch {
      message.error("Lỗi khi xóa người dùng");
    }
  };

  return (
    <div className={tabStyles.adminTabContainer}>
      <Table
        rowKey="user_id"
        loading={loading}
        dataSource={members}
        className={tabStyles.modernTable}
        columns={[
            { title: "Tên đăng nhập", dataIndex: "username" },
            { title: "Họ tên", dataIndex: "full_name" },
            { title: "Email", dataIndex: "email" },
            { title: "SĐT", dataIndex: "phone_number" },
            { title: "Ngày sinh", dataIndex: "date_of_birth" ,render: (date) => date ? dayjs(date).format("DD/MM/YYYY") : "—"},
            { title: "Ngày đăng ký", dataIndex: "registration_date", render: (date) => date ? dayjs(date).format("DD/MM/YYYY") : "—", },
            { title: "Trạng thái", dataIndex: "account_status" },
          {
            title: "Hành động",
            render: (_, record) => (
              <Space>
                <Button
                  size="small"
                  style={{ minWidth: "64px" }}
                  onClick={() => openModal(record)}
                  className={tabStyles.modernButtonDefault}
                >
                  Chỉnh sửa
                </Button>
                {record.account_status === "inactive" ? (
                  <Button size="small" style={{ minWidth: "64px" }} onClick={() => unlockUser(record.user_id)}>
                    Mở khóa
                  </Button>
                ) : (
                  <Button danger size="small" style={{ minWidth: "64px" }} onClick={() => lockUser(record.user_id)}>
                    Khóa
                  </Button>
                )}
                <Popconfirm
                  title="Xóa người dùng này?"
                  onConfirm={() => deleteUser(record.user_id)}
                  okText="Xác nhận"
                  cancelText="Hủy"
                >
                  <Button danger size="small">Xóa</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        open={modal.visible}
        title="Chỉnh sửa người dùng"
        onCancel={() => {
          setModal({ visible: false, record: null });
          form.resetFields();
        }}
        onOk={() => form.validateFields().then(save)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="full_name" label="Họ tên">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="phone_number" label="SĐT">
            <Input />
          </Form.Item>
          <Form.Item name="account_status" label="Trạng thái">
            <Select>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="banned">Banned</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}