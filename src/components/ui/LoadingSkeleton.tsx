import React from 'react';

interface LoadingSkeletonProps {
  rows?: number;
}

/**
 * Animated placeholder shown while ticket data is loading.
 * Renders N rows each with 7 columns matching the ticket table layout.
 * Requirement 4.4
 */
const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ rows = 5 }) => {
  return (
    <div role="status" aria-label="Loading tickets" aria-busy="true">
      {/* Table header skeleton */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
        <div className="flex-1 h-3 bg-gray-200 rounded animate-pulse" />
        <div className="w-32 h-3 bg-gray-200 rounded animate-pulse" />
        <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
        <div className="w-28 h-3 bg-gray-200 rounded animate-pulse" />
        <div className="w-28 h-3 bg-gray-200 rounded animate-pulse" />
        <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Row skeletons */}
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 px-4 py-4 border-b border-gray-100"
        >
          {/* Ticket ID */}
          <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
          {/* Subject */}
          <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse" />
          {/* Customer */}
          <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
          {/* Priority badge */}
          <div className="w-20 h-5 bg-gray-200 rounded-full animate-pulse" />
          {/* Status badge */}
          <div className="w-28 h-5 bg-gray-200 rounded-full animate-pulse" />
          {/* Assignee */}
          <div className="w-28 h-4 bg-gray-200 rounded animate-pulse" />
          {/* Updated */}
          <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSkeleton;
