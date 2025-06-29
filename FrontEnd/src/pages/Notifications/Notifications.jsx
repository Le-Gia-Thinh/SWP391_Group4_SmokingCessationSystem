// Notifications.jsx
import React, { useEffect, useState } from "react";
import { Card, List, Typography, Badge, message } from "antd";
import Navbar from "../../layouts/Navbar";
import axios from "axios";

const { Title, Text } = Typography;

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .post(
        "http://localhost:5000/api/achievement/check-daily",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((res) => {
        if (res.data.success && res.data.message.includes("🎉")) {
          setNotifications([
            {
              id: 1,
              content: res.data.message,
              read: false,
            },
          ]);
        }
      })
      .catch((err) => {
        console.error("❌ Lỗi kiểm tra thành tựu:", err);
        message.error("Không thể kiểm tra thành tựu hôm nay.");
      });
  }, []);

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 520, margin: "40px auto" }}>
        <Card style={{ borderRadius: 16 }}>
          <Title level={3}>Thông báo</Title>
          <List
            dataSource={notifications}
            locale={{ emptyText: "Không có thông báo nào." }}
            renderItem={(item) => (
              <List.Item>
                <Badge dot={!item.read}>
                  <Text style={{ fontWeight: item.read ? 400 : 600 }}>
                    {item.content}
                  </Text>
                </Badge>
              </List.Item>
            )}
          />
        </Card>
      </div>
    </>
  );
};

export default Notifications;
