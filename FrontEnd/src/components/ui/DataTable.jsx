import React from 'react';
import { Table, Card, Button, Space, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import './DataTable.css';

const { Title } = Typography;

const DataTable = ({
    title,
    columns,
    dataSource,
    loading = false,
    rowKey = 'id',
    pagination = {
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
    },
    extra,
    className = '',
    scroll = {},
    size = 'middle',
    bordered = false,
    ...props
}) => {
    return (
        <Card
            title={title}
            extra={
                extra || (
                    <Space>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={props.onRefresh}
                            loading={loading}
                        >
                            Refresh
                        </Button>
                    </Space>
                )
            }
            className={`data-table-card ${className}`}
        >
            <Table
                columns={columns}
                dataSource={dataSource}
                loading={loading}
                rowKey={rowKey}
                pagination={pagination}
                scroll={scroll}
                size={size}
                bordered={bordered}
                {...props}
            />
        </Card>
    );
};

export default DataTable; 