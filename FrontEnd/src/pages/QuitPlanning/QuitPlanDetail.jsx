// QuitPlanDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  Typography,
  Table,
  Checkbox,
  message,
  Card,
  Tag,
  Progress,
  Divider,
  Badge,
  Radio, // <-- chỉ dòng này từ "antd"
} from "antd";
import {
  SmileTwoTone,
  FireTwoTone,
  CheckCircleTwoTone,
} from "@ant-design/icons";
import dayjs from "dayjs";
import Navbar from "../../layouts/Navbar";
import "./QuitPlanDetail.css";
import CelebrationOverlay from "./CelebrationOverlay";
import { Select } from "antd";
const { Option } = Select;
const { Title, Paragraph } = Typography;

const QuitPlanDetail = () => {
  const location = useLocation();
  const { date } = useParams();
  const data = location.state;
  const [completed, setCompleted] = useState(Array(9).fill(false));
  const [taskDone, setTaskDone] = useState(Array(9).fill(false));
  const [selectedTask, setSelectedTask] = useState({}); // { [timeSlotIdx]: taskId }
  const [showCelebration, setShowCelebration] = useState(false);

  const fallback = {
    date,
    progress: "Không xác định",
    phase: "Không xác định",
    detailPlan: [],
    tasks: [
      "Không có dữ liệu cụ thể. Hãy vào từ trang kế hoạch để xem chi tiết.",
    ],
  };

  const info = data && data.detailPlan ? data : fallback;
  const detailPlan = info.detailPlan;

  if (info.detailPlan?.[0]?.tasks) {
    const tasksObj = info.detailPlan[0].tasks;
    const taskArray = Object.keys(tasksObj).map((time) => {
      return {
        time,
        behavior: "Thời điểm thường thèm thuốc", // Có thể tùy chỉnh mô tả hành vi
        replacement: tasksObj[time].map((t) => t.task), // lấy danh sách task
        rawDate: info.date,
      };
    });
    info.detailPlan = taskArray; // Cập nhật lại detailPlan đã chuẩn hoá
  }

  const planStartDate = location.state?.rawStartDate || "2025-06-17";
  const startDate = dayjs(planStartDate);

  let weekNumber = "Không xác định";
  if (info.date && startDate.isValid()) {
    const selectedDate = dayjs(info.date, "DD/MM/YYYY");
    const diffDays = selectedDate.diff(startDate, "day");
    weekNumber = Math.floor(diffDays / 7) + 1;
  }

  useEffect(() => {
    const enough =
      completed.filter(Boolean).length === 9 ||
      taskDone.filter(Boolean).length === 9;
    if (enough) setShowCelebration(true);
  }, [completed, taskDone]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const formattedDate = dayjs(date, ["DD/MM/YYYY", "YYYY-MM-DD"]).format(
      "YYYY-MM-DD"
    );

    // 1. Lấy habit log
    fetch(`http://localhost:5000/api/habit-log?date=${formattedDate}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((result) => {
        if (Array.isArray(result.data)) {
          setCompleted(result.data.map((x) => !!x));
        }
      });

    // 2. Lấy nhiệm vụ đã chọn
    fetch(
      `http://localhost:5000/api/habit-log/selected-tasks?date=${formattedDate}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then((res) => res.json())
      .then((result) => {
        const fallbackSelected = {};
        if (Array.isArray(info.detailPlan)) {
          info.detailPlan.forEach((_, idx) => {
            fallbackSelected[idx] = `P1_${idx}_0`;
          });
        }

        if (result.success && Array.isArray(result.data)) {
          result.data.forEach(({ time_slot, task_id }) => {
            fallbackSelected[time_slot] = task_id;
          });
        }

        // Validate task
        Object.entries(fallbackSelected).forEach(([slotIdx, taskId]) => {
          const parts = taskId.split("_");
          const taskIdx = parseInt(parts[2]);
          const taskList = info.detailPlan[slotIdx]?.replacement || [];
          const taskLabel = taskList[taskIdx];
          if (!taskLabel) delete fallbackSelected[slotIdx];
        });

        setSelectedTask(fallbackSelected);
      });

    // ✅ 3. Lấy nhiệm vụ đã làm
    fetch(
      `http://localhost:5000/api/habit-log/completed-tasks?date=${formattedDate}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then((res) => res.json())
      .then((doneResult) => {
        if (doneResult.success && Array.isArray(doneResult.data)) {
          const doneState = Array(9).fill(false);
          doneResult.data.forEach(({ time_slot, is_completed }) => {
            if (is_completed) doneState[time_slot] = true;
          });
          setTaskDone(doneState);
        }
      });
  }, [date]);

  const handleCheckbox = async (idx) => {
    const updated = [...completed];
    const newState = !updated[idx];
    updated[idx] = newState;
    setCompleted(updated);

    const token = localStorage.getItem("token");
    const formattedDate = dayjs(date, [
      "DD-MM-YYYY",
      "DD/MM/YYYY",
      "YYYY-MM-DD",
    ]).format("YYYY-MM-DD");

    try {
      await fetch("http://localhost:5000/api/habit-log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: formattedDate,
          timeSlot: idx,
          completed: newState,
          points: newState ? 1 : 0,
        }),
      });

      message.success(newState ? "✅ Đã ghi nhận!" : "🗑️ Đã bỏ tích!");
    } catch (err) {
      console.error("Lỗi khi ghi log:", err);
      message.error("Lỗi cập nhật hành vi.");
    }
  };
  const handleTaskDoneCheckbox = async (idx) => {
    if (!selectedTask[idx]) {
      message.warning("⚠️ Vui lòng chọn nhiệm vụ trước khi xác nhận đã làm.");
      return;
    }

    const updated = [...taskDone];
    const newState = !updated[idx];
    updated[idx] = newState;
    setTaskDone(updated);

    const token = localStorage.getItem("token");
    const formattedDate = dayjs(date, [
      "DD-MM-YYYY",
      "DD/MM/YYYY",
      "YYYY-MM-DD",
    ]).format("YYYY-MM-DD");

    try {
      await fetch("http://localhost:5000/api/habit-log/choose-task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: formattedDate,
          timeSlot: idx,
          taskId: selectedTask[idx],
        }),
      });

      // 👉 Gọi thêm API cộng điểm khi người dùng đánh dấu đã hoàn thành nhiệm vụ
      if (newState) {
        // 👉 Nếu người dùng tích vào checkbox
        await fetch("http://localhost:5000/api/habit-log/submit-task-points", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: formattedDate,
            timeSlot: idx,
            taskId: selectedTask[idx],
          }),
        });
      } else {
        // 👈 Nếu người dùng bỏ tích → gọi API xoá điểm nhiệm vụ
        await fetch("http://localhost:5000/api/habit-log/delete-task-log", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: formattedDate,
            timeSlot: idx,
          }),
        });
      }

      message.success("✅ Đã ghi nhận nhiệm vụ!");
    } catch {
      message.error("❌ Lỗi khi ghi nhận nhiệm vụ.");
    }
  };

  const handleSelectTask = async (timeSlotIdx, taskId) => {
    setSelectedTask((prev) => ({ ...prev, [timeSlotIdx]: taskId }));

    // Gọi API
    const token = localStorage.getItem("token");
    const formattedDate = dayjs(date, [
      "DD-MM-YYYY",
      "DD/MM/YYYY",
      "YYYY-MM-DD",
    ]).format("YYYY-MM-DD");

    try {
      await fetch("http://localhost:5000/api/habit-log/choose-task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: formattedDate,
          timeSlot: timeSlotIdx,
          taskId: taskId,
        }),
      });
      message.success("Đã lưu lựa chọn nhiệm vụ!");
    } catch {
      message.error("Lỗi khi lưu nhiệm vụ.");
    }
  };

  const columns = [
    {
      title: "Thời điểm",
      dataIndex: "time",
      key: "time",
      render: (text, _, index) => (
        <strong>
          {index + 1}. {text}
        </strong>
      ),
    },
    {
      title: "Hành vi / hoàn cảnh",
      dataIndex: "behavior",
      key: "behavior",
    },
    {
      title: "Đã không hút",
      key: "check",
      render: (record, __, index) => {
        const recordDate = dayjs(record.rawDate, [
          "DD/MM/YYYY",
          "DD-MM-YYYY",
          "YYYY-MM-DD",
        ]).startOf("day");
        const today = dayjs().startOf("day");
        const isPast = recordDate.isBefore(today);

        return (
          <Checkbox
            className={taskDone[index] ? "ant-checkbox-wrapper-checked" : ""}
            checked={completed[index]}
            disabled={isPast} // ❌ Khóa nếu đã qua ngày
            onChange={() => handleCheckbox(index)}
          >
            Tôi đã không hút
          </Checkbox>
        );
      },
    },
    {
      title: "Nhiệm vụ bạn chọn",
      key: "taskSelector",
      render: (_, record, index) => {
        const recordDate = dayjs(record.rawDate, [
          "DD/MM/YYYY",
          "DD-MM-YYYY",
          "YYYY-MM-DD",
        ]).startOf("day");
        const today = dayjs().startOf("day");
        const isPast = recordDate.isBefore(today);

        const tasks = Array.isArray(record.replacement)
          ? record.replacement
          : typeof record.replacement === "string" && record.replacement.trim()
          ? [record.replacement]
          : [];

        return (
          <Select
            value={selectedTask[index]}
            onChange={(value) => handleSelectTask(index, value)}
            placeholder="Chọn 1 nhiệm vụ"
            disabled={isPast} // ✅ Khóa nếu ngày đã qua
            style={{
              width: "100%",
              whiteSpace: "normal",
              wordWrap: "break-word",
              minWidth: 250,
            }}
            popupMatchSelectWidth={false}
            listHeight={300}
          >
            {tasks.map((task, taskIdx) => {
              const taskId = `P1_${index}_${taskIdx}`;
              return (
                <Select.Option key={taskId} value={taskId}>
                  {task}
                </Select.Option>
              );
            })}
          </Select>
        );
      },
    },

    {
      title: "Tôi đã làm nhiệm vụ",
      key: "taskDone",
      render: (record, _, index) => {
        const recordDate = dayjs(record.rawDate, [
          "DD/MM/YYYY",
          "DD-MM-YYYY",
          "YYYY-MM-DD",
        ]).startOf("day");
        const today = dayjs().startOf("day");
        const isPast = recordDate.isBefore(today);

        return (
          <Checkbox
            className={completed[index] ? "ant-checkbox-wrapper-checked" : ""}
            checked={taskDone[index]}
            onChange={() => handleTaskDoneCheckbox(index)}
            disabled={isPast} // ✅ Khóa nếu ngày đã qua
          >
            Tôi đã làm
          </Checkbox>
        );
      },
    },
  ];

  const completedCount = completed.filter(Boolean).length;
  const totalTasks = taskDone.filter(Boolean).length;

  return (
    <div style={{ padding: 24, background: "#f6faff", minHeight: "100vh" }}>
      <Navbar />
      <Card
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          borderRadius: 16,
          boxShadow: "0 4px 24px #0001",
          background: "#fff",
        }}
        bodyStyle={{ padding: 32 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <FireTwoTone twoToneColor="#ff7875" style={{ fontSize: 36 }} />
          <Title level={3} style={{ margin: 0 }}>
            Chi tiết kế hoạch cho ngày: <Tag color="geekblue">{info.date}</Tag>
          </Title>
        </div>
        <Divider />

        {/* Thông tin giai đoạn và tiến trình */}
        <Card
          size="small"
          bordered={false}
          style={{
            maxWidth: 500,
            margin: "0 auto 24px auto",
            borderRadius: 12,
            boxShadow: "0 2px 8px #0001",
            background: "#f9f9ff",
          }}
        >
          <div>
            <div className="phase-info">
              <span>Giai đoạn:</span>
              <Tag color="purple">{info.phase}</Tag>
              <Tag color="cyan">Tuần {weekNumber}</Tag>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>
                🚭 Tiến trình không hút thuốc:
              </div>
              <Progress
                percent={Math.min(Math.round((completedCount / 9) * 100), 100)}
                status="active"
                strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }}
                showInfo
              />

              <div style={{ fontWeight: 500, marginTop: 16, marginBottom: 4 }}>
                🎯 Tiến trình hoàn thành nhiệm vụ:
              </div>
              <Progress
                percent={Math.min(Math.round((totalTasks / 9) * 100), 100)}
                status="active"
                strokeColor={{ "0%": "#fa8c16", "100%": "#52c41a" }}
                showInfo
              />
            </div>
            {/* 🎯 Mốc không hút trong ngày */}
            <div style={{ marginTop: 24 }}>
              <Title level={5} style={{ marginBottom: 12 }}>
                🎯 Mốc không hút trong ngày
              </Title>
              <div className="milestone-container">
                {[3, 5, 7, 9].map((milestone) => {
                  const reached = completedCount >= milestone;
                  const colors = {
                    3: "purple",
                    5: "blue",
                    7: "orange",
                    9: "green",
                  };
                  return (
                    <Badge.Ribbon
                      key={milestone}
                      text={`✅ ${milestone}/9`}
                      color={reached ? colors[milestone] : "gray"}
                    >
                      <Card
                        size="small"
                        bordered
                        className={`milestone-card ${
                          reached ? "milestone-reached" : ""
                        }`}
                      >
                        {reached ? (
                          <CheckCircleTwoTone
                            twoToneColor="#52c41a"
                            style={{ fontSize: 24 }}
                          />
                        ) : (
                          <SmileTwoTone
                            twoToneColor="#999"
                            style={{ fontSize: 24 }}
                          />
                        )}
                        <div className="milestone-status">
                          {reached ? "Đã hoàn thành" : "Chưa đạt"}
                        </div>
                      </Card>
                    </Badge.Ribbon>
                  );
                })}
              </div>
            </div>

            {/* 🎯 Mốc nhiệm vụ trong ngày */}
            <div style={{ marginTop: 24 }}>
              <Title level={5} style={{ marginBottom: 12 }}>
                🎯 Mốc nhiệm vụ trong ngày
              </Title>
              <div className="milestone-container">
                {[3, 5, 7, 9].map((milestone) => {
                  const reached = totalTasks >= milestone;
                  const colors = {
                    3: "purple",
                    5: "blue",
                    7: "orange",
                    9: "green",
                  };
                  return (
                    <Badge.Ribbon
                      key={milestone}
                      text={`✅ ${milestone}/9`}
                      color={reached ? colors[milestone] : "gray"}
                    >
                      <Card
                        size="small"
                        bordered
                        className={`milestone-card ${
                          reached ? "milestone-reached" : ""
                        }`}
                      >
                        {reached ? (
                          <CheckCircleTwoTone
                            twoToneColor="#52c41a"
                            style={{ fontSize: 24 }}
                          />
                        ) : (
                          <SmileTwoTone
                            twoToneColor="#999"
                            style={{ fontSize: 24 }}
                          />
                        )}
                        <div className="milestone-status">
                          {reached ? "Đã hoàn thành" : "Chưa đạt"}
                        </div>
                      </Card>
                    </Badge.Ribbon>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        <Divider orientation="left" plain>
          <SmileTwoTone twoToneColor="#52c41a" /> Thời điểm dễ gây ham muốn &
          hành vi thay thế
        </Divider>
        {showCelebration && (
          <CelebrationOverlay onClose={() => setShowCelebration(false)} />
        )}
        {Array.isArray(detailPlan) && detailPlan.length > 0 ? (
          <Table
            columns={columns}
            dataSource={info.detailPlan.map((item, idx) => ({
              ...item,
              key: idx,
            }))}
            pagination={false}
            bordered
            rowClassName={(_, idx) => {
              const noSmoke = completed[idx];
              const didTask = taskDone[idx];

              if (noSmoke && didTask) return "row-both";
              if (noSmoke) return "row-nosmoke";
              if (didTask) return "row-taskdone";
              return "";
            }}
          />
        ) : (
          <Paragraph type="secondary" italic>
            Không có dữ liệu chi tiết cho ngày này.
          </Paragraph>
        )}

        <Divider orientation="left" plain>
          <CheckCircleTwoTone twoToneColor="#13c2c2" /> Chi tiết nhiệm vụ
        </Divider>
        {Array.isArray(info.detailPlan) && info.detailPlan.length > 0 ? (
          <ul style={{ paddingLeft: 24 }}>
            {info.detailPlan.map((item, timeSlotIdx) => (
              <li key={timeSlotIdx} style={{ marginBottom: 16, fontSize: 16 }}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>
                  {item.time}:
                </div>
                <Radio.Group
                  value={selectedTask[timeSlotIdx]}
                  onChange={(e) =>
                    handleSelectTask(timeSlotIdx, e.target.value)
                  }
                >
                  {(Array.isArray(item.replacement)
                    ? item.replacement
                    : [item.replacement]
                  ).map((task, taskIdx) => {
                    const taskId = `P1_${timeSlotIdx}_${taskIdx}`;
                    const recordDate = dayjs(item.rawDate, [
                      "DD/MM/YYYY",
                      "DD-MM-YYYY",
                      "YYYY-MM-DD",
                    ]).startOf("day");
                    const today = dayjs().startOf("day");
                    const isPast = recordDate.isBefore(today); // ✅ kiểm tra quá khứ

                    return (
                      <Radio.Button
                        key={taskId}
                        value={taskId}
                        disabled={isPast} // ✅ Khóa nếu quá ngày
                        style={{ display: "block", marginBottom: 4 }}
                      >
                        <Tag color="magenta" style={{ fontSize: 15 }}>
                          {task}
                        </Tag>
                      </Radio.Button>
                    );
                  })}
                </Radio.Group>
              </li>
            ))}
          </ul>
        ) : (
          <Paragraph type="secondary" italic>
            Không có dữ liệu chi tiết cho ngày này.
          </Paragraph>
        )}
      </Card>
    </div>
  );
};

export default QuitPlanDetail;
