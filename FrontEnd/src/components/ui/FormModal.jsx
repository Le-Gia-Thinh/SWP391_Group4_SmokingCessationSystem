import React from 'react';
import { Modal, Form, Button, Space } from 'antd';
import './FormModal.css';

const FormModal = ({
    title,
    visible,
    onCancel,
    onSubmit,
    form,
    loading = false,
    width = 600,
    okText = 'Submit',
    cancelText = 'Cancel',
    children,
    footer,
    className = '',
    ...props
}) => {
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            onSubmit(values);
        } catch (error) {
            console.error('Form validation failed:', error);
        }
    };

    const defaultFooter = (
        <Space>
            <Button onClick={onCancel} disabled={loading}>
                {cancelText}
            </Button>
            <Button
                type="primary"
                onClick={handleSubmit}
                loading={loading}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
                {okText}
            </Button>
        </Space>
    );

    return (
        <Modal
            title={title}
            open={visible}
            onCancel={onCancel}
            footer={footer || defaultFooter}
            width={width}
            className={`form-modal ${className}`}
            destroyOnClose
            {...props}
        >
            <Form
                form={form}
                layout="vertical"
            >
                {children}
            </Form>
        </Modal>
    );
};

export default FormModal; 