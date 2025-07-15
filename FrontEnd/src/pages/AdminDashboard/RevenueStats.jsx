import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Doughnut, Line, PolarArea, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend,
  RadarController,
} from "chart.js";
import { DatePicker, Radio, Button, message, Spin } from "antd";
import dayjs from "dayjs";
import "./RevenueStats.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend,
  RadarController
);

const AdminStatDashboard = () => {
  const [revenueChart, setRevenueChart] = useState({ labels: [], data: [] });
  const [chartType, setChartType] = useState("month");
  const [avgAddiction, setAvgAddiction] = useState({ labels: [], data: [] });
  const [summary, setSummary] = useState({
    total_users: 0,
    active_coach: 0,
    revenue_today: 0,
    revenue_week: 0,
    revenue_month: 0,
    revenue_year: 0,
  });

  const [selectedType, setSelectedType] = useState("month"); // default month
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [weekMonthSelected, setWeekMonthSelected] = useState(null); // chọn tháng cho lọc tuần
  const [yearSelected, setYearSelected] = useState(dayjs().year());
  const [loading, setLoading] = useState(false);

  // Lưu vào localStorage
  const saveChartSettings = (type, options = {}) => {
    localStorage.setItem("chartSettings", JSON.stringify({ type, options }));
  };

  // Lấy từ localStorage (nếu có)
  const getSavedChartSettings = () => {
    const saved = localStorage.getItem("chartSettings");
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  };

  const formatDateVN = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
  };

  const fetchRevenueChart = async (type, options = {}) => {
    setLoading(true);
    try {
      let url = "";
      let params = {};

      if (type === "day") {
        if (options.from && options.to) {
          url = "revenue-date-range";
          params = { from: options.from, to: options.to };
        } else {
          url = "revenue-today"; // 7 ngày gần nhất mặc định
        }
      } else if (type === "week") {
        if (options.from && options.to) {
          url = "revenue-week-range";
          params = { from: options.from, to: options.to };
        } else {
          url = "revenue-week"; // 4-5 tuần gần nhất mặc định
        }
      } else if (type === "month") {
        if (options.year) {
          url = "monthly-revenue-by-year";
          params = { year: options.year };
        } else {
          url = "monthly-revenue"; // 12 tháng năm hiện tại mặc định
        }
      } else if (type === "year") {
        url = "revenue-year"; // năm luôn gọi mặc định
      }

      const res = await axios.get(`http://localhost:5000/api/admin/${url}`, {
        params,
      });
      setRevenueChart(res.data);
      setChartType(type);
    } catch (err) {
      console.error("Lỗi khi tải biểu đồ doanh thu:", err);
      message.error("Lỗi khi tải biểu đồ doanh thu!");
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [resAvgAddict, resUsers, resCoaches, resStats] =
          await Promise.all([
            axios.get(
              "http://localhost:5000/api/admin/avg-months-by-addiction"
            ),
            axios.get("http://localhost:5000/api/admin/users-summary"),
            axios.get("http://localhost:5000/api/admin/active-coach-count"),
            axios.get("http://localhost:5000/api/admin/revenue-stats"),
          ]);

        setAvgAddiction(resAvgAddict.data);
        setSummary({
          total_users: resUsers.data.total_users,
          active_coach: resCoaches.data.count,
          revenue_today: resStats.data.total_today,
          revenue_week: resStats.data.total_week,
          revenue_month: resStats.data.total_month,
          revenue_year: resStats.data.total_year,
        });

        // 👉 Nếu có cài đặt biểu đồ trước đó, khôi phục lại
        const saved = getSavedChartSettings();
        if (saved) {
          setSelectedType(saved.type);
          if (saved.type === "day") {
            setStartDate(
              saved.options?.from ? dayjs(saved.options.from) : null
            );
            setEndDate(saved.options?.to ? dayjs(saved.options.to) : null);
          } else if (saved.type === "week") {
            setWeekMonthSelected(
              saved.options?.from ? dayjs(saved.options.from) : null
            );
          } else if (saved.type === "month") {
            setYearSelected(saved.options?.year || dayjs().year());
          }
          fetchRevenueChart(saved.type, saved.options || {});
        } else {
          // Nếu không có cài đặt cũ, gọi mặc định theo tháng
          fetchRevenueChart("month", { year: dayjs().year() });
        }
      } catch (err) {
        console.error("Lỗi khi tải thống kê:", err);
      }
    };

    fetchStats();
  }, []);

  const onTypeChange = (e) => {
    const newType = e.target.value;
    setSelectedType(newType);
    setStartDate(null);
    setEndDate(null);
    setWeekMonthSelected(null);
    setYearSelected(dayjs().year());

    saveChartSettings(newType, {}); // <== THÊM DÒNG NÀY

    if (newType === "year") {
      fetchRevenueChart("year");
    } else if (newType === "month") {
      fetchRevenueChart("month", { year: dayjs().year() });
    } else if (newType === "day") {
      fetchRevenueChart("day");
    } else if (newType === "week") {
      fetchRevenueChart("week");
    }
  };

  const onClickFetch = () => {
    if (selectedType === "day") {
      if (!startDate || !endDate) {
        message.error("Vui lòng chọn khoảng ngày!");
        return;
      }
      const from = startDate.format("YYYY-MM-DD");
      const to = endDate.format("YYYY-MM-DD");
      saveChartSettings("day", { from, to });
      fetchRevenueChart("day", { from, to });
    } else if (selectedType === "week") {
      if (!weekMonthSelected) {
        message.error("Vui lòng chọn tháng!");
        return;
      }
      const from = weekMonthSelected.startOf("month").format("YYYY-MM-DD");
      const to = weekMonthSelected.endOf("month").format("YYYY-MM-DD");
      saveChartSettings("week", { from, to });
      fetchRevenueChart("week", { from, to });
    } else if (selectedType === "month") {
      if (!yearSelected) {
        message.error("Vui lòng chọn năm!");
        return;
      }
      saveChartSettings("month", { year: yearSelected });
      fetchRevenueChart("month", { year: yearSelected });
    } else if (selectedType === "year") {
      saveChartSettings("year", {});
      fetchRevenueChart("year");
    }
  };

  const renderSecondChart = () => {
    const chartData = {
      labels: revenueChart.labels || [],
      datasets: [
        {
          label: "Tỷ lệ doanh thu",
          data: revenueChart.data || [],
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
          ],
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    };

    switch (chartType) {
      case "day":
        return (
          <div className="line-chart-wrapper">
            <Line
              key={chartType}
              data={{
                labels: revenueChart.labels?.map((d) => formatDateVN(d)) || [],
                datasets: [
                  {
                    label: "Doanh thu (VND)",
                    data: revenueChart.data || [],
                    borderColor: "#36A2EB",
                    backgroundColor: "rgba(54, 162, 235, 0.2)",
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: "#36A2EB",
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "top" },
                  tooltip: { enabled: true },
                },
                scales: {
                  x: {
                    display:
                      revenueChart.labels && revenueChart.labels.length > 10
                        ? false
                        : true,
                  },
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => value.toLocaleString() + " đ",
                    },
                  },
                },
              }}
            />
          </div>
        );

      case "week":
        return <PolarArea key={chartType} data={chartData} options={options} />;

      case "month":
        return (
          <Radar
            key={chartType}
            data={{
              labels: revenueChart.labels || [],
              datasets: [
                {
                  label: "Doanh thu (VND)",
                  data: revenueChart.data || [],
                  backgroundColor: "rgba(255, 99, 132, 0.2)",
                  borderColor: "rgba(255, 99, 132, 1)",
                  borderWidth: 2,
                  pointBackgroundColor: "rgba(255, 99, 132, 1)",
                },
              ],
            }}
            options={{
              responsive: true,
              scales: {
                r: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => value.toLocaleString() + " đ",
                  },
                },
              },
              plugins: {
                legend: { position: "top" },
              },
            }}
          />
        );

      case "year":
      default:
        return <Doughnut key={chartType} data={chartData} options={options} />;
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>📊 Thống kê quản trị</h2>

      <div
        style={{
          display: "flex",
          gap: "2rem",
          margin: "2rem 0",
          flexWrap: "wrap",
        }}
      >
        <div>
          <strong>👤 Tổng member:</strong> {summary.total_users}
        </div>
        <div>
          <strong>🧑‍🏫 Coach active:</strong> {summary.active_coach}
        </div>
        <div>
          <strong>💰 Hôm nay:</strong> {summary.revenue_today?.toLocaleString()}{" "}
          đ
        </div>
        <div>
          <strong>📅 Tuần:</strong> {summary.revenue_week?.toLocaleString()} đ
        </div>
        <div>
          <strong>🗓️ Tháng:</strong> {summary.revenue_month?.toLocaleString()} đ
        </div>
        <div>
          <strong>🧾 Năm:</strong> {summary.revenue_year?.toLocaleString()} đ
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <Radio.Group
          onChange={onTypeChange}
          value={selectedType}
          buttonStyle="solid"
        >
          <Radio.Button value="day">📅 Theo ngày</Radio.Button>
          <Radio.Button value="week">📈 Theo tuần</Radio.Button>
          <Radio.Button value="month">📊 Theo tháng</Radio.Button>
          <Radio.Button value="year">📆 Theo năm</Radio.Button>
        </Radio.Group>

        <div
          style={{ marginTop: "0.5rem", display: "flex", alignItems: "center" }}
        >
          {selectedType === "day" && (
            <>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                format="YYYY-MM-DD"
                placeholder="Start date"
                disabledDate={(current) =>
                  current && current > dayjs().endOf("day")
                }
                style={{ marginRight: 8 }}
              />
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                format="YYYY-MM-DD"
                placeholder="End date"
                disabledDate={(current) =>
                  current &&
                  (current > dayjs().endOf("day") ||
                    (startDate && current < startDate))
                }
                style={{ marginRight: 8 }}
              />
            </>
          )}

          {selectedType === "week" && (
            <DatePicker
              picker="month"
              value={weekMonthSelected}
              onChange={setWeekMonthSelected}
              style={{ width: 150, marginRight: 8 }}
              disabledDate={(current) =>
                current && current > dayjs().endOf("month")
              }
            />
          )}

          {selectedType === "month" && (
            <DatePicker
              picker="year"
              value={dayjs(String(yearSelected))}
              onChange={(d) => setYearSelected(d ? d.year() : null)}
              style={{ width: 120, marginRight: 8 }}
              disabledDate={(current) =>
                current && current > dayjs().endOf("year")
              }
            />
          )}

          <Button type="primary" onClick={onClickFetch} loading={loading}>
            Xem
          </Button>
        </div>
      </div>

      <div style={{ marginBottom: "3rem" }}>
        <h3>
          🧾 Biểu đồ doanh thu theo{" "}
          {
            {
              day: "7 ngày gần nhất (tính từ hôm nay)",
              week: "các tuần trong tháng được chọn",
              month: "12 tháng trong năm",
              year: "các năm",
            }[chartType]
          }
        </h3>
        <Spin spinning={loading} tip="Đang tải...">
          <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
            <div style={{ flex: 2 }}>
              <Bar
                redraw={true}
                data={{
                  labels:
                    chartType === "day"
                      ? revenueChart.labels.map((d) => formatDateVN(d))
                      : revenueChart.labels || [],
                  datasets: [
                    {
                      label: "Doanh thu (VND)",
                      data: revenueChart.data || [],
                      backgroundColor: "rgba(75, 192, 192, 0.7)",
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: "top" },
                    tooltip: { enabled: true },
                  },
                  scales: {
                    x: {
                      display:
                        revenueChart.labels && revenueChart.labels.length > 15
                          ? false
                          : true,
                    },
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (value) => value.toLocaleString() + " đ",
                      },
                    },
                  },
                }}
              />
            </div>
            <div style={{ flex: 1 }}>{renderSecondChart()}</div>
          </div>
        </Spin>
      </div>

      <div>
        <h3>📉 Số tháng trung bình theo mức độ nghiện</h3>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <div style={{ flex: 2 }}>
            <Bar
              data={{
                labels: avgAddiction.labels,
                datasets: [
                  {
                    label: "Tháng trung bình",
                    data: avgAddiction.data,
                    backgroundColor: ["#ff6384", "#36a2eb", "#ffce56"],
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "top" },
                  tooltip: { enabled: true },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Doughnut
              data={{
                labels: avgAddiction.labels,
                datasets: [
                  {
                    label: "Tỷ lệ nghiện",
                    data: avgAddiction.data,
                    backgroundColor: ["#ff6384", "#36a2eb", "#ffce56"],
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: "bottom",
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatDashboard;
