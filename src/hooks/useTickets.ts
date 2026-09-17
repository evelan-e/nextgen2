import { useMemo } from 'react';
import { useTicketContext } from '../context/TicketContext';
import type { FilterState, Priority, Ticket } from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

const PRIORITY_RANK: Record<Priority, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Urgent: 4,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseTicketsResult {
  rows: Ticket[];
  totalCount: number;
  totalPages: number;
}

export function useTickets(filter: FilterState): UseTicketsResult {
  const { state } = useTicketContext();

  return useMemo(() => {
    let result = state.tickets;

    // 1. Status filter
    if (filter.status !== '') {
      result = result.filter(t => t.status === filter.status);
    }

    // 2. Priority filter
    if (filter.priority !== '') {
      result = result.filter(t => t.priority === filter.priority);
    }

    // 3. Assignee filter (case-insensitive exact match)
    if (filter.assignee !== '') {
      const needle = filter.assignee.toLowerCase();
      result = result.filter(t => t.assignee.toLowerCase() === needle);
    }

    // 4. Text search (case-insensitive substring on subject OR customerName)
    if (filter.search !== '') {
      const needle = filter.search.toLowerCase();
      result = result.filter(
        t =>
          t.subject.toLowerCase().includes(needle) ||
          t.customerName.toLowerCase().includes(needle)
      );
    }

    // 5. Sort
    const multiplier = filter.sortDirection === 'asc' ? 1 : -1;

    result = [...result].sort((a, b) => {
      if (filter.sortField === 'updatedAt') {
        // ISO strings sort correctly as plain string comparisons
        if (a.updatedAt < b.updatedAt) return -1 * multiplier;
        if (a.updatedAt > b.updatedAt) return 1 * multiplier;
        return 0;
      }

      // sortField === 'priority'
      const rankA = PRIORITY_RANK[a.priority];
      const rankB = PRIORITY_RANK[b.priority];
      return (rankA - rankB) * multiplier;
    });

    // 6. Paginate
    const totalCount = result.length;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const rows = result.slice(filter.page * PAGE_SIZE, (filter.page + 1) * PAGE_SIZE);

    return { rows, totalCount, totalPages };
  }, [
    state.tickets,
    filter.status,
    filter.priority,
    filter.assignee,
    filter.search,
    filter.sortField,
    filter.sortDirection,
    filter.page,
  ]);
}
