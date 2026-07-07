/**
 * StatCard Component
 * Reusable statistics card with icon, label, and value
 * Used for dashboard metrics and statistics displays
 */

import React from 'react';
import { Card } from './card';

export type StatCardVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: StatCardVariant;
  className?: string;
}

const variantColors: Record<StatCardVariant, { label: string; value: string; iconBg: string; iconColor: string }> = {
  success: {
    label: 'text-[#059669]',
    value: 'text-[#059669]',
    iconBg: 'bg-[#d1fae5]',
    iconColor: 'text-[#059669]',
  },
  warning: {
    label: 'text-[#d97706]',
    value: 'text-[#d97706]',
    iconBg: 'bg-[#fef3c7]',
    iconColor: 'text-[#d97706]',
  },
  danger: {
    label: 'text-[#dc2626]',
    value: 'text-[#dc2626]',
    iconBg: 'bg-[#fee2e2]',
    iconColor: 'text-[#dc2626]',
  },
  info: {
    label: 'text-[#2563eb]',
    value: 'text-[#2563eb]',
    iconBg: 'bg-[#dbeafe]',
    iconColor: 'text-[#2563eb]',
  },
  default: {
    label: 'text-[#6b7280]',
    value: 'text-[#111827]',
    iconBg: 'bg-[#f3f4f6]',
    iconColor: 'text-[#6b7280]',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  variant = 'default',
  className = '',
}) => {
  const colors = variantColors[variant];

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className={`text-[13px] font-semibold uppercase tracking-[0.05em] mb-2 ${colors.label}`}>
              {label}
            </p>
            <p className={`text-[32px] font-bold leading-tight ${colors.value}`}>
              {value}
            </p>
          </div>
          <div className={`p-3 rounded-[10px] flex-shrink-0 ${colors.iconBg}`}>
            <div className={`w-7 h-7 ${colors.iconColor}`}>
              {icon}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
