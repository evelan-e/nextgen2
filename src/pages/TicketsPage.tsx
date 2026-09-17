import { useState } from 'react';
import PageHeader from '../components/layout/PageHeader';
import { TicketFilters } from '../components/tickets/TicketFilters';
import { TicketSearch } from '../components/tickets/TicketSearch';
import TicketTable from '../components/tickets/TicketTable';
import { Pagination } from '../components/tickets/Pagination';
import NewTicketModal from '../components/tickets/NewTicketModal';
import { useFilterState } from '../hooks/useFilterState';
import { useTickets } from '../hooks/useTickets';
import { useTicketContext } from '../context/TicketContext';
import type { FilterState } from '../types';

/**
 * Ticket list page.
 * Composes filters, search, table, and pagination using useFilterState + useTickets.
 * Requirements: 4.1, 5.1–5.6, 6.1
 */
export default function TicketsPage() {
  const [filter, setFilter] = useFilterState();
  const { rows, totalCount, totalPages } = useTickets(filter);
  const { state } = useTicketContext();

  // Will be wired to NewTicketModal in task 9.4
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);

  const handleSort = (field: FilterState['sortField']) => {
    if (field === filter.sortField) {
      // Same field — toggle direction
      setFilter({ sortField: field, sortDirection: filter.sortDirection === 'asc' ? 'desc' : 'asc' });
    } else {
      // New field — default to descending
      setFilter({ sortField: field, sortDirection: 'desc' });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Tickets">
        <button
          type="button"
          onClick={() => setIsNewTicketOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Ticket
        </button>
      </PageHeader>

      {/* Toolbar: filters + search */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-gray-200 bg-white">
        <TicketFilters filter={filter} onFilterChange={setFilter} />
        <TicketSearch value={filter.search} onChange={(v) => setFilter({ search: v })} />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <TicketTable
          rows={rows}
          loading={state.loading}
          sortField={filter.sortField}
          sortDirection={filter.sortDirection}
          onSort={handleSort}
          totalPages={totalPages}
        />
      </div>

      {/* Pagination */}
      <Pagination
        page={filter.page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={(p) => setFilter({ page: p })}
      />

      {/* New Ticket modal */}
      <NewTicketModal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
      />
    </div>
  );
}
