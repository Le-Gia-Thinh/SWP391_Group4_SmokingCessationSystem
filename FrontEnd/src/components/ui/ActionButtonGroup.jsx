import React from 'react';
import { Button, Space, Tooltip, Popconfirm } from 'antd';
import {
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckOutlined,
    CloseOutlined,
    CopyOutlined,
    UserOutlined
} from '@ant-design/icons';
import './ActionButtonGroup.css';

const ActionButtonGroup = ({
    actions = [],
    record,
    size = 'small',
    className = '',
    ...props
}) => {
    const getIcon = (action) => {
        switch (action.type) {
            case 'view':
                return <EyeOutlined />;
            case 'edit':
                return <EditOutlined />;
            case 'delete':
                return <DeleteOutlined />;
            case 'accept':
                return <CheckOutlined />;
            case 'reject':
                return <CloseOutlined />;
            case 'copy':
                return <CopyOutlined />;
            case 'user':
                return <UserOutlined />;
            default:
                return action.icon;
        }
    };

    const getButtonType = (action) => {
        switch (action.type) {
            case 'view':
                return 'primary';
            case 'edit':
                return 'default';
            case 'delete':
                return 'primary';
            case 'accept':
                return 'primary';
            case 'reject':
                return 'default';
            case 'copy':
                return 'default';
            default:
                return action.buttonType || 'default';
        }
    };

    const getButtonStyle = (action) => {
        switch (action.type) {
            case 'accept':
                return { backgroundColor: '#52c41a', borderColor: '#52c41a' };
            case 'delete':
                return { backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' };
            default:
                return action.style || {};
        }
    };

    const renderButton = (action) => {
        const button = (
            <Button
                type={getButtonType(action)}
                icon={getIcon(action)}
                size={size}
                onClick={() => action.onClick(record)}
                loading={action.loading}
                disabled={action.disabled}
                danger={action.type === 'delete' || action.type === 'reject'}
                style={getButtonStyle(action)}
                className={`action-button action-${action.type}`}
                {...action.buttonProps}
            >
                {action.text}
            </Button>
        );

        // Wrap with tooltip if tooltip is provided
        if (action.tooltip) {
            return (
                <Tooltip key={action.type} title={action.tooltip}>
                    {button}
                </Tooltip>
            );
        }

        // Wrap with popconfirm for delete actions
        if (action.type === 'delete' && action.confirm) {
            return (
                <Popconfirm
                    key={action.type}
                    title={action.confirm.title || "Are you sure you want to delete this item?"}
                    description={action.confirm.description || "This action cannot be undone."}
                    onConfirm={() => action.onClick(record)}
                    okText={action.confirm.okText || "Yes"}
                    cancelText={action.confirm.cancelText || "No"}
                    okType="danger"
                >
                    <Tooltip title={action.tooltip || "Delete"}>
                        {button}
                    </Tooltip>
                </Popconfirm>
            );
        }

        return button;
    };

    return (
        <Space size="small" className={`action-button-group ${className}`} {...props}>
            {actions.map((action) => renderButton(action))}
        </Space>
    );
};

export default ActionButtonGroup; 