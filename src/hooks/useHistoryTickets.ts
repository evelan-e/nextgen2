import { useState, useEffect, useRef } from 'react';
import { ticketHistoryService } from '../services/ticketHistoryService';
import type { HistoryTicket, HistoryFilter } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseHistoryTicketsResult {
  rows: HistoryTicket[];
  loading: boolean;
  error: string | null;
  assigneeOptions: string[];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useHistoryTickets(filter: HistoryFilter): UseHistoryTicketsResult {
  const [rows, setRows] = useState<HistoryTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assigneeOptions, setAssigneeOptions] = useState<string[]>([]);

  // Debounced search: updated 300 ms after filter.search changes
  const [debouncedSearch, setDebouncedSearch] = useState(filter.search);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current !== null) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(filter.search);
    }, 300);

    return () => {
      if (debounceTimer.current !== null) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [filter.search]);

  // Fetch assignees once on mount
  useEffect(() => {
    ticketHistoryService
      .listAssignees()
      .then(setAssigneeOptions)
      .catch(() => setAssigneeOptions([]));
  }, []);

  // Fetch history tickets when non-search filters change immediately,
  // or when debouncedSearch updates (300 ms after search input changes)
  useEffect(() => {
    let cancelled = false;

    const effectiveFilter: HistoryFilter = {
      ...filter,
      search: debouncedSearch,
    };

    setLoading(true);
    setError(null);

    ticketHistoryService
      .listHistory(effectiveFilter)
      .then(data => {
        if (!cancelled) {
          setRows(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load history');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    filter.fromDate,
    filter.toDate,
    filter.priority,
    filter.assignee,
    debouncedSearch,
  ]);

  return { rows, loading, error, assigneeOptions };
}
