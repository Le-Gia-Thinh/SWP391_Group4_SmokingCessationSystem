import React from 'react';
import { Card, Statistic } from 'antd';
import './StatisticCard.css';

const StatisticCard = ({
    title,
    value,
    prefix,
    suffix,
    precision = 0,
    valueStyle = {},
    prefixStyle = {},
    className = '',
    loading = false,
    ...props
}) => {
    return (
        <Card className={`statistic-card ${className}`} {...props}>
            <Statistic
                title={title}
                value={value}
                prefix={prefix}
                suffix={suffix}
                precision={precision}
                valueStyle={valueStyle}
                loading={loading}
            />
        </Card>
    );
};

export default StatisticCard; 