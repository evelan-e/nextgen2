import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { HistoryFilter, Priority } from '../types';

const VALID_PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Urgent'];

export const DEFAULT_HISTORY_FILTER: HistoryFilter = {
  fromDate: '',
  toDate: '',
  priority: '',
  assignee: '',
  search: '',
};

function parseHistoryFilter(params: URLSearchParams): HistoryFilter {
  const fromDate = params.get('fromDate') ?? DEFAULT_HISTORY_FILTER.fromDate;
  const toDate = params.get('toDate') ?? DEFAULT_HISTORY_FILTER.toDate;

  const rawPriority = params.get('priority') ?? '';
  const priority: Priority | '' = (VALID_PRIORITIES as string[]).includes(rawPriority)
    ? (rawPriority as Priority)
    : '';

  const assignee = params.get('assignee') ?? DEFAULT_HISTORY_FILTER.assignee;
  const search = params.get('search') ?? DEFAULT_HISTORY_FILTER.search;

  return { fromDate, toDate, priority, assignee, search };
}

function buildHistorySearchParams(state: HistoryFilter): URLSearchParams {
  const params = new URLSearchParams();

  if (state.fromDate !== DEFAULT_HISTORY_FILTER.fromDate) {
    params.set('fromDate', state.fromDate);
  }
  if (state.toDate !== DEFAULT_HISTORY_FILTER.toDate) {
    params.set('toDate', state.toDate);
  }
  if (state.priority !== DEFAULT_HISTORY_FILTER.priority) {
    params.set('priority', state.priority);
  }
  if (state.assignee !== DEFAULT_HISTORY_FILTER.assignee) {
    params.set('assignee', state.assignee);
  }
  if (state.search !== DEFAULT_HISTORY_FILTER.search) {
    params.set('search', state.search);
  }

  return params;
}

function computeDateError(fromDate: string, toDate: string): string | null {
  if (fromDate !== '' && toDate !== '' && fromDate > toDate) {
    return 'Start date must be before end date';
  }
  return null;
}

export function useHistoryFilter(): [
  HistoryFilter,
  (patch: Partial<HistoryFilter>) => void,
  string | null,
] {
  const [searchParams, setSearchParams] = useSearchParams();

  const filterState = parseHistoryFilter(searchParams);
  const dateError = computeDateError(filterState.fromDate, filterState.toDate);

  const setFilter = useCallback(
    (patch: Partial<HistoryFilter>) => {
      const current = parseHistoryFilter(searchParams);
      const merged: HistoryFilter = { ...current, ...patch };
      setSearchParams(buildHistorySearchParams(merged), { replace: true });
    },
    [searchParams, setSearchParams]
  );

  return [filterState, setFilter, dateError];
}
