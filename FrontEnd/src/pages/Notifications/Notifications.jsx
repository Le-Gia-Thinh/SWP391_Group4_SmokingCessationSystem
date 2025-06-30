import React, { useEffect, useState } from "react";
import { Card, List, Typography, Badge, Spin, message } from "antd";
import Navbar from '../../layouts/Navbar';
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";

const { Title, Text } = Typography;

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get("/api/notification", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
        }
        });
        setNotifications(res.data);
      } catch (err) {
        message.error("Lỗi tải thông báo");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [token]);

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 600, margin: "40px auto" }}>
        <Card style={{ borderRadius: 16 }}>
          <Title level={3}>Thông báo</Title>

          {loading ? (
            <Spin />
          ) : (
            <List
              dataSource={notifications}
              renderItem={(item) => (
                <List.Item>
                  <Badge dot={!item.read}>
                    <Text strong={!item.read}>
                      {item.content}
                    </Text>
                  </Badge>
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>
    </>
  );
};

export default Notifications;