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
import { DatePicker, Radio, Button, message, Spin, Layout } from "antd";
import dayjs from "dayjs";
import "bootstrap/dist/css/bootstrap.min.css";

const { Content } = Layout;

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
    const saved = JSON.parse(localStorage.getItem("chartSettings") || "{}");
    saved[type] = options;
    localStorage.setItem("chartSettings", JSON.stringify(saved));
  };

  //Thêm hàm mới để lấy options theo loại
  const getChartOptionsByType = (type) => {
    const saved = JSON.parse(localStorage.getItem("chartSettings") || "{}");
    return saved[type] || {};
  };

  // // Lấy từ localStorage (nếu có)
  // const getSavedChartSettings = () => {
  //   const saved = localStorage.getItem("chartSettings");
  //   if (!saved) return null;
  //   try {
  //     return JSON.parse(saved);
  //   } catch {
  //     return null;
  //   }
  // };

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

        const chartSettings = JSON.parse(
          localStorage.getItem("chartSettings") || "{}"
        );
        const defaultType = chartSettings["month"]
          ? "month"
          : Object.keys(chartSettings)[0] || "month";
        const savedOptions = chartSettings[defaultType] || {};

        setSelectedType(defaultType);

        if (defaultType === "day") {
          setStartDate(savedOptions?.from ? dayjs(savedOptions.from) : null);
          setEndDate(savedOptions?.to ? dayjs(savedOptions.to) : null);
        } else if (defaultType === "week") {
          setWeekMonthSelected(
            savedOptions?.from ? dayjs(savedOptions.from) : null
          );
        } else if (defaultType === "month") {
          setYearSelected(savedOptions?.year || dayjs().year());
        }

        fetchRevenueChart(defaultType, savedOptions);
      } catch (err) {
        console.error("Lỗi khi tải thống kê:", err);
      }
    };

    fetchStats();
  }, []);

  const onTypeChange = (e) => {
    const newType = e.target.value;
    setSelectedType(newType);

    const savedOptions = getChartOptionsByType(newType);

    if (newType === "day") {
      setStartDate(savedOptions?.from ? dayjs(savedOptions.from) : null);
      setEndDate(savedOptions?.to ? dayjs(savedOptions.to) : null);
      fetchRevenueChart("day", savedOptions);
    } else if (newType === "week") {
      setWeekMonthSelected(
        savedOptions?.from ? dayjs(savedOptions.from) : null
      );
      fetchRevenueChart("week", savedOptions);
    } else if (newType === "month") {
      const year = savedOptions?.year || dayjs().year();
      setYearSelected(year);
      fetchRevenueChart("month", { year });
    } else if (newType === "year") {
      fetchRevenueChart("year");
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

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 15,
            font: {
              size: 11,
            },
          },
        },
        tooltip: {
          backgroundColor: "rgba(0,0,0,0.8)",
          titleColor: "white",
          bodyColor: "white",
        },
      },
    };

    switch (chartType) {
      case "day":
        return (
          <Line
            key={chartType}
            redraw={true}
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
                  pointBorderColor: "#36A2EB",
                  pointRadius: 4,
                  pointHoverRadius: 6,
                },
              ],
            }}
            options={{
              ...commonOptions,
              scales: {
                x: {
                  display:
                    revenueChart.labels && revenueChart.labels.length > 10
                      ? false
                      : true,
                  grid: {
                    display: false,
                  },
                },
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => value.toLocaleString() + " đ",
                    font: {
                      size: 10,
                    },
                  },
                  grid: {
                    color: "rgba(0,0,0,0.1)",
                  },
                },
              },
            }}
          />
        );

      case "week":
        return (
          <PolarArea
            key={chartType}
            redraw={true}
            data={{
              ...chartData,
              datasets: [
                {
                  ...chartData.datasets[0],
                  backgroundColor: [
                    "rgba(255, 99, 132, 0.8)",
                    "rgba(54, 162, 235, 0.8)",
                    "rgba(255, 206, 86, 0.8)",
                    "rgba(75, 192, 192, 0.8)",
                    "rgba(153, 102, 255, 0.8)",
                  ],
                  borderColor: [
                    "rgba(255, 99, 132, 1)",
                    "rgba(54, 162, 235, 1)",
                    "rgba(255, 206, 86, 1)",
                    "rgba(75, 192, 192, 1)",
                    "rgba(153, 102, 255, 1)",
                  ],
                  borderWidth: 2,
                },
              ],
            }}
            options={commonOptions}
          />
        );

      case "month":
        return (
          <Radar
            key={chartType}
            redraw={true}
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
                  pointBorderColor: "rgba(255, 99, 132, 1)",
                  pointRadius: 4,
                  pointHoverRadius: 6,
                },
              ],
            }}
            options={{
              ...commonOptions,
              scales: {
                r: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => value.toLocaleString() + " đ",
                    font: {
                      size: 9,
                    },
                    stepSize: undefined,
                  },
                  grid: {
                    color: "rgba(0,0,0,0.1)",
                  },
                  angleLines: {
                    color: "rgba(0,0,0,0.1)",
                  },
                },
              },
            }}
          />
        );

      case "year":
      default:
        return (
          <Doughnut
            key={chartType}
            redraw={true}
            data={{
              ...chartData,
              datasets: [
                {
                  ...chartData.datasets[0],
                  backgroundColor: [
                    "rgba(255, 99, 132, 0.8)",
                    "rgba(54, 162, 235, 0.8)",
                    "rgba(255, 206, 86, 0.8)",
                    "rgba(75, 192, 192, 0.8)",
                    "rgba(153, 102, 255, 0.8)",
                  ],
                  borderColor: [
                    "rgba(255, 99, 132, 1)",
                    "rgba(54, 162, 235, 1)",
                    "rgba(255, 206, 86, 1)",
                    "rgba(75, 192, 192, 1)",
                    "rgba(153, 102, 255, 1)",
                  ],
                  borderWidth: 2,
                  hoverOffset: 4,
                },
              ],
            }}
            options={{
              ...commonOptions,
              cutout: "40%",
            }}
          />
        );
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Content style={{ padding: "0" }}>
        <div className="container-fluid py-4">
          {/* Header */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="d-flex align-items-center">
                <h1 className="mb-0 text-primary fw-bold">
                  📊 Thống kê quản trị
                </h1>
                <div className="ms-auto">
                  <span className="badge bg-success fs-6">Dashboard</span>
                </div>
              </div>
              <hr className="my-3" />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="row g-4 mb-4">
            <div className="col-lg-2 col-md-4 col-sm-6">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="fs-1 text-primary mb-2">👤</div>
                  <h5 className="card-title text-muted mb-1">Tổng member</h5>
                  <h2 className="text-primary fw-bold">
                    {summary.total_users}
                  </h2>
                </div>
              </div>
            </div>
            <div className="col-lg-2 col-md-4 col-sm-6">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="fs-1 text-success mb-2">🧑‍🏫</div>
                  <h5 className="card-title text-muted mb-1">Coach active</h5>
                  <h2 className="text-success fw-bold">
                    {summary.active_coach}
                  </h2>
                </div>
              </div>
            </div>
            <div className="col-lg-2 col-md-4 col-sm-6">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="fs-1 text-info mb-2">💰</div>
                  <h5 className="card-title text-muted mb-1">Hôm nay</h5>
                  <h2 className="text-info fw-bold">
                    {summary.revenue_today?.toLocaleString()}đ
                  </h2>
                </div>
              </div>
            </div>
            <div className="col-lg-2 col-md-4 col-sm-6">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="fs-1 text-warning mb-2">📅</div>
                  <h5 className="card-title text-muted mb-1">Tuần</h5>
                  <h2 className="text-warning fw-bold">
                    {summary.revenue_week?.toLocaleString()}đ
                  </h2>
                </div>
              </div>
            </div>
            <div className="col-lg-2 col-md-4 col-sm-6">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="fs-1 text-danger mb-2">🗓️</div>
                  <h5 className="card-title text-muted mb-1">Tháng</h5>
                  <h2 className="text-danger fw-bold">
                    {summary.revenue_month?.toLocaleString()}đ
                  </h2>
                </div>
              </div>
            </div>
            <div className="col-lg-2 col-md-4 col-sm-6">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="fs-1 text-dark mb-2">🧾</div>
                  <h5 className="card-title text-muted mb-1">Năm</h5>
                  <h2 className="text-dark fw-bold">
                    {summary.revenue_year?.toLocaleString()}đ
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-md-6">
                      <Radio.Group
                        onChange={onTypeChange}
                        value={selectedType}
                        buttonStyle="solid"
                        className="mb-3 mb-md-0"
                      >
                        <Radio.Button value="day">📅 Theo ngày</Radio.Button>
                        <Radio.Button value="week">📈 Theo tuần</Radio.Button>
                        <Radio.Button value="month">📊 Theo tháng</Radio.Button>
                        <Radio.Button value="year">📆 Theo năm</Radio.Button>
                      </Radio.Group>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex flex-wrap gap-2 align-items-center">
                        {selectedType === "day" && (
                          <>
                            <DatePicker
                              value={startDate}
                              onChange={setStartDate}
                              format="YYYY-MM-DD"
                              placeholder="Ngày bắt đầu"
                              disabledDate={(current) =>
                                current && current > dayjs().endOf("day")
                              }
                              className="flex-fill"
                            />
                            <DatePicker
                              value={endDate}
                              onChange={setEndDate}
                              format="YYYY-MM-DD"
                              placeholder="Ngày kết thúc"
                              disabledDate={(current) =>
                                current &&
                                (current > dayjs().endOf("day") ||
                                  (startDate && current < startDate))
                              }
                              className="flex-fill"
                            />
                          </>
                        )}

                        {selectedType === "week" && (
                          <DatePicker
                            picker="month"
                            value={weekMonthSelected}
                            onChange={setWeekMonthSelected}
                            placeholder="Chọn tháng"
                            disabledDate={(current) =>
                              current && current > dayjs().endOf("month")
                            }
                            style={{ width: "140px" }}
                          />
                        )}

                        {selectedType === "month" && (
                          <DatePicker
                            picker="year"
                            value={dayjs(String(yearSelected))}
                            onChange={(d) =>
                              setYearSelected(d ? d.year() : null)
                            }
                            placeholder="Chọn năm"
                            disabledDate={(current) =>
                              current && current > dayjs().endOf("year")
                            }
                            style={{ width: "120px" }}
                          />
                        )}

                        <Button
                          type="primary"
                          onClick={onClickFetch}
                          loading={loading}
                          size="large"
                          className="px-4"
                        >
                          Xem thống kê
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h4 className="card-title d-flex align-items-center mb-4">
                    <span className="me-2">🧾</span>
                    Biểu đồ doanh thu theo{" "}
                    {
                      {
                        day: "7 ngày gần nhất (tính từ hôm nay)",
                        week: "các tuần trong tháng được chọn",
                        month: "12 tháng trong năm",
                        year: "các năm",
                      }[chartType]
                    }
                  </h4>
                  <Spin spinning={loading} tip="Đang tải...">
                    <div className="row">
                      <div className="col-lg-8 col-md-12 mb-4 mb-lg-0">
                        <div
                          className="chart-container"
                          style={{ height: "400px" }}
                        >
                          <Bar
                            redraw={true}
                            data={{
                              labels:
                                chartType === "day"
                                  ? revenueChart.labels.map((d) =>
                                      formatDateVN(d)
                                    )
                                  : revenueChart.labels || [],
                              datasets: [
                                {
                                  label: "Doanh thu (VND)",
                                  data: revenueChart.data || [],
                                  backgroundColor: "rgba(75, 192, 192, 0.7)",
                                  borderColor: "rgba(75, 192, 192, 1)",
                                  borderWidth: 2,
                                  borderRadius: 5,
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
                                    revenueChart.labels &&
                                    revenueChart.labels.length > 15
                                      ? false
                                      : true,
                                  grid: {
                                    display: false,
                                  },
                                },
                                y: {
                                  beginAtZero: true,
                                  ticks: {
                                    callback: (value) =>
                                      value.toLocaleString() + " đ",
                                  },
                                  grid: {
                                    color: "rgba(0,0,0,0.1)",
                                  },
                                },
                              },
                            }}
                          />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-12">
                        <div
                          className="chart-container"
                          style={{ height: "400px" }}
                        >
                          {renderSecondChart()}
                        </div>
                      </div>
                    </div>
                  </Spin>
                </div>
              </div>
            </div>
          </div>

          {/* Addiction Statistics */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h4 className="card-title d-flex align-items-center mb-4">
                    <span className="me-2">📉</span>
                    Số tháng trung bình theo mức độ nghiện
                  </h4>
                  <div className="row">
                    <div className="col-lg-8 col-md-12 mb-4 mb-lg-0">
                      <div
                        className="chart-container"
                        style={{ height: "400px" }}
                      >
                        <Bar
                          data={{
                            labels: avgAddiction.labels,
                            datasets: [
                              {
                                label: "Tháng trung bình",
                                data: avgAddiction.data,
                                backgroundColor: [
                                  "rgba(255, 99, 132, 0.8)",
                                  "rgba(54, 162, 235, 0.8)",
                                  "rgba(255, 206, 86, 0.8)",
                                ],
                                borderColor: [
                                  "rgba(255, 99, 132, 1)",
                                  "rgba(54, 162, 235, 1)",
                                  "rgba(255, 206, 86, 1)",
                                ],
                                borderWidth: 2,
                                borderRadius: 5,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { position: "top" },
                              tooltip: {
                                enabled: true,
                                backgroundColor: "rgba(0,0,0,0.8)",
                                titleColor: "white",
                                bodyColor: "white",
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                grid: {
                                  color: "rgba(0,0,0,0.1)",
                                },
                              },
                              x: {
                                grid: {
                                  display: false,
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-12">
                      <div
                        className="chart-container"
                        style={{ height: "400px" }}
                      >
                        <PolarArea
                          data={{
                            labels: avgAddiction.labels,
                            datasets: [
                              {
                                label: "Tỷ lệ nghiện",
                                data: avgAddiction.data,
                                backgroundColor: [
                                  "rgba(255, 99, 132, 0.8)",
                                  "rgba(54, 162, 235, 0.8)",
                                  "rgba(255, 206, 86, 0.8)",
                                ],
                                borderColor: [
                                  "rgba(255, 99, 132, 1)",
                                  "rgba(54, 162, 235, 1)",
                                  "rgba(255, 206, 86, 1)",
                                ],
                                borderWidth: 2,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: "bottom",
                                labels: {
                                  padding: 20,
                                  font: {
                                    size: 12,
                                  },
                                },
                              },
                              tooltip: {
                                backgroundColor: "rgba(0,0,0,0.8)",
                                titleColor: "white",
                                bodyColor: "white",
                              },
                            },
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default AdminStatDashboard;
