import React from 'react';
import type { HistoryTicket } from '../../types';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import EmptyState from '../ui/EmptyState';
import { HistoryRow } from './HistoryRow';

interface HistoryTableProps {
  rows: HistoryTicket[];
  loading: boolean;
}

/**
 * Renders the resolved/closed ticket history table.
 * - Shows LoadingSkeleton rows while loading (Requirements 2.5, 2.7)
 * - Shows EmptyState when no rows match (Requirement 2.8)
 * - Wraps in overflow-x-auto for horizontal scroll on narrow viewports
 * Requirements: 2.3, 2.5, 2.7, 2.8
 */
const HistoryTable: React.FC<HistoryTableProps> = ({ rows, loading }) => {
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="bg-white divide-y divide-gray-100">
            {Array.from({ length: 5 }, (_, index) => (
              <tr key={index}>
                <td colSpan={8} className="px-0 py-0">
                  <LoadingSkeleton rows={1} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        message="No history tickets found"
        description="Tickets will appear here once they are resolved or closed."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
            >
              ID
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
            >
              Subject
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
            >
              Customer
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
            >
              Priority
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
            >
              Assignee
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
            >
              Resolved At
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
            >
              Resolved By
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {rows.map((row) => (
            <HistoryRow key={row.id} ticket={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HistoryTable;
