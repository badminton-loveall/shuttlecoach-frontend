import React from 'react';
import './StatCard.css';

/**
 * StatCard Component
 * Displays a single statistic with icon, value, and label
 * Color-coded by metric type - uses pure CSS with design tokens
 */

interface StatCardProps {
  title: string;
  value: string | number;
  label?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  label,
  icon,
  variant = 'primary',
  className = '',
}) => {
  return (
    <div className={`stat-card stat-card--${variant} ${className}`}>
      {icon && <div className="stat-card__icon">{icon}</div>}
      <div className="stat-card__content">
        <h3 className="stat-card__title">{title}</h3>
        <div className="stat-card__value">{value}</div>
        {label && <p className="stat-card__label">{label}</p>}
      </div>
    </div>
  );
};

export default StatCard;
