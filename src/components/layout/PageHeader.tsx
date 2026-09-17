import React from 'react';

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
}

/**
 * Page-level header bar.
 * Renders the route title on the left and optional action buttons (e.g. "New Ticket") on the right.
 * Requirements: 1.7
 */
const PageHeader: React.FC<PageHeaderProps> = ({ title, children }) => {
  return (
    <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
};

export default PageHeader;
