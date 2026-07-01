// Copyright 2026 Muhammad Waleed
// Licensed under the Apache License, Version 2.0
// Author: Muhammad Waleed

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import './StatsCard.css';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  accentColor?: 'cyan' | 'purple' | 'green' | 'red' | 'yellow';
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  accentColor = 'cyan',
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUpRight size={16} className="trend-icon-up" />;
    if (trend === 'down') return <ArrowDownRight size={16} className="trend-icon-down" />;
    return <Minus size={16} className="trend-icon-neutral" />;
  };

  return (
    <div className={`glass-card stats-card accent-${accentColor}`}>
      <div className="stats-card-header">
        <span className="stats-title">{title}</span>
        {icon && <div className="stats-icon-wrapper">{icon}</div>}
      </div>
      <div className="stats-card-body">
        <h3 className="stats-value">{value}</h3>
      </div>
      {(trend || subtitle) && (
        <div className="stats-card-footer">
          {trend && (
            <div className={`stats-trend trend-${trend}`}>
              {getTrendIcon()}
              <span>{trendValue}</span>
            </div>
          )}
          {subtitle && <span className="stats-subtitle">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

export default StatsCard;
