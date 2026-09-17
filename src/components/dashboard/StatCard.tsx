import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
}

/**
 * KPI summary card for the Dashboard overview.
 * Requirements: 11.1, 11.2
 */
const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        {icon && (
          <span className="text-gray-400" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <span className="text-3xl font-bold text-gray-900">{value}</span>
      {description && (
        <span className="text-xs text-gray-500">{description}</span>
      )}
    </div>
  );
};

export default StatCard;
