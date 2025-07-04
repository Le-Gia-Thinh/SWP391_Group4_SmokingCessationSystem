import React, { useEffect, useState } from 'react';
import { Modal, Table, Tag, Spin, Typography, message } from 'antd';
import dayjs from 'dayjs';

const { Title } = Typography;

const formatDate = (val) => {
    if (!val) return '';
    // Nếu là ISO string (có T và Z), dùng dayjs format lại
    if (typeof val === 'string' && val.includes('T')) {
        return dayjs(val).format('YYYY-MM-DD');
    }
    // Nếu là dạng cũ, lấy 10 ký tự đầu
    return val.substring(0, 10);
};

const formatTime = (val) => {
    if (typeof val !== 'string') return '';
    if (val.includes('T')) {
        // ISO: "2025-07-03T14:00:00.000Z"
        return val.substring(11, 16);
    }
    // Dạng thường: "2025-07-03 14:00:00"
    const parts = val.split(' ');
    if (parts[1]) return parts[1].substring(0, 5);
    return '';
};

const CoachScheduleModal = ({ open, onClose, coach, token }) => {
    const [loading, setLoading] = useState(false);
    const [schedules, setSchedules] = useState([]);

    useEffect(() => {
        if (open && coach) {
            fetchSchedules();
        } else {
            setSchedules([]);
        }
        // eslint-disable-next-line
    }, [open, coach]);

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `http://localhost:5000/api/schedule/all/${coach.coach_id}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            const data = await res.json();
            if (data.success) {
                setSchedules(data.data || []);
            } else {
                setSchedules([]);
                message.error('Không thể tải lịch của coach');
            }
        } catch (err) {
            setSchedules([]);
            message.error('Lỗi khi tải lịch coach');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Ngày',
            dataIndex: 'start_time',
            key: 'date',
            render: formatDate,
        },
        {
            title: 'Bắt đầu',
            dataIndex: 'start_time',
            key: 'start',
            render: formatTime,
        },
        {
            title: 'Kết thúc',
            dataIndex: 'end_time',
            key: 'end',
            render: formatTime,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'is_booked',
            key: 'status',
            render: (val, record) => (
                <Tag color={val ? 'red' : 'green'}>
                    {val ? 'Đã đặt' : 'Có sẵn'}
                </Tag>
            ),
        },
    ];

    return (
        <Modal
            title={
                <span>
                    <Title level={5} style={{ margin: 0 }}>
                        Lịch của Coach: {coach?.full_name}
                    </Title>
                </span>
            }
            open={open}
            onCancel={onClose}
            footer={null}
            width={700}
        >
            {loading ? (
                <Spin />
            ) : (
                <Table
                    columns={columns}
                    dataSource={schedules}
                    rowKey="schedule_id"
                    pagination={{ pageSize: 10 }}
                />
            )}
        </Modal>
    );
};

export default CoachScheduleModal; 