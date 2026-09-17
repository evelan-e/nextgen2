import React from 'react';
import type { Ticket } from '../../types';
import type { FilterState } from '../../types';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import EmptyState from '../ui/EmptyState';
import TicketRow from './TicketRow';

interface TicketTableProps {
  rows: Ticket[];
  loading: boolean;
  totalPages: number;
  sortField: FilterState['sortField'];
  sortDirection: FilterState['sortDirection'];
  onSort: (field: FilterState['sortField']) => void;
}

/**
 * Renders the ticket list table with sortable column headers.
 * - Shows LoadingSkeleton while data is loading (Req 4.4)
 * - Shows EmptyState when no rows match (Req 4.5)
 * - Wraps in overflow-x-auto for horizontal scroll on narrow viewports (Req 13.2)
 * Requirements: 4.1–4.7, 13.2
 */
const TicketTable: React.FC<TicketTableProps> = ({
  rows,
  loading,
  sortField,
  sortDirection,
  onSort,
}) => {
  if (loading) {
    return <LoadingSkeleton rows={10} />;
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        message="No tickets found"
        description="Try adjusting your filters or search term to find what you're looking for."
      />
    );
  }

  const SortIndicator = ({ field }: { field: FilterState['sortField'] }) => {
    if (sortField !== field) {
      return (
        <span className="ml-1 text-gray-300" aria-hidden="true">
          ↕
        </span>
      );
    }
    return (
      <span className="ml-1 text-blue-600" aria-hidden="true">
        {sortDirection === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  const handleSortClick = (field: FilterState['sortField']) => {
    onSort(field);
  };

  return (
    /* overflow-x-auto enables horizontal scroll on narrow viewports (Req 13.2) */
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
            >
              Ticket ID
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
              <button
                type="button"
                onClick={() => handleSortClick('priority')}
                className="inline-flex items-center hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 rounded"
                aria-label={`Sort by Priority${sortField === 'priority' ? `, currently ${sortDirection}ending` : ''}`}
              >
                Priority
                <SortIndicator field="priority" />
              </button>
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
              Assigned To
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
            >
              <button
                type="button"
                onClick={() => handleSortClick('updatedAt')}
                className="inline-flex items-center hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 rounded"
                aria-label={`Sort by Updated${sortField === 'updatedAt' ? `, currently ${sortDirection}ending` : ''}`}
              >
                Updated
                <SortIndicator field="updatedAt" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {rows.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TicketTable;
