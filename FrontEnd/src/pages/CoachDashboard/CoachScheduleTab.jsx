import React, { useEffect, useState } from 'react';
import DataTable from '../../components/ui/DataTable';
import { Input, Tag, DatePicker } from 'antd';

const CoachScheduleTab = () => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);

    const API_BASE_URL = 'http://localhost:5000/api';

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/schedule/my-coach-schedules`, {
                headers: getAuthHeaders(),
            });
            const data = await res.json();
            if (data.success) {
                setSchedules(data.data);
            } else {
                setSchedules([]);
            }
        } catch (err) {
            setSchedules([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
        // eslint-disable-next-line
    }, []);

    const columns = [
        {
            title: 'Ngày',
            dataIndex: 'start_time',
            key: 'date',
            render: (text) => text.slice(0, 10),
        },
        {
            title: 'Giờ bắt đầu',
            dataIndex: 'start_time',
            key: 'start_time',
            render: (text) => text.slice(11, 16),
        },
        {
            title: 'Giờ kết thúc',
            dataIndex: 'end_time',
            key: 'end_time',
            render: (text) => text.slice(11, 16),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'is_booked',
            key: 'is_booked',
            render: (isBooked) =>
                isBooked ? (
                    <Tag color="red">Đã đặt</Tag>
                ) : (
                    <Tag color="green">Chưa đặt</Tag>
                ),
            filters: [
                { text: 'Đã đặt', value: 1 },
                { text: 'Chưa đặt', value: 0 },
            ],
            onFilter: (value, record) => record.is_booked === value,
        },
    ];

    // Lọc theo ngày chọn và search text
    const filteredData = schedules.filter((item) => {
        // Nếu có chọn ngày, chỉ lấy lịch đúng ngày đó
        if (selectedDate) {
            const itemDate = item.start_time.slice(0, 10);
            const selected = selectedDate.format('YYYY-MM-DD');
            if (itemDate !== selected) return false;
        }
        // Nếu có search text, tiếp tục lọc như cũ
        if (search) {
            return (
                item.start_time.includes(search) ||
                item.end_time.includes(search) ||
                item.start_time.slice(0, 10).includes(search)
            );
        }
        return true;
    });

    return (
        <div>
            <DatePicker
                style={{ marginBottom: 16 }}
                onChange={date => setSelectedDate(date)}
                allowClear
                placeholder="Chọn ngày"
            />
            <DataTable
                title="Lịch trình của bạn"
                columns={columns}
                dataSource={filteredData}
                loading={loading}
                rowKey="schedule_id"
                onRefresh={fetchSchedules}
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
};

export default CoachScheduleTab; 