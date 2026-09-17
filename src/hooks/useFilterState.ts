import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FilterState, Status, Priority } from '../types';

const VALID_STATUSES: Status[] = [
  'Open',
  'In Progress',
  'Waiting on Customer',
  'Resolved',
  'Closed',
];

const VALID_PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Urgent'];

const VALID_SORT_FIELDS: FilterState['sortField'][] = ['updatedAt', 'priority'];
const VALID_SORT_DIRECTIONS: FilterState['sortDirection'][] = ['asc', 'desc'];

export const DEFAULT_FILTER: FilterState = {
  status: '',
  priority: '',
  assignee: '',
  search: '',
  sortField: 'updatedAt',
  sortDirection: 'desc',
  page: 0,
};

function parseFilterState(params: URLSearchParams): FilterState {
  const rawStatus = params.get('status') ?? '';
  const status: Status | '' = (VALID_STATUSES as string[]).includes(rawStatus)
    ? (rawStatus as Status)
    : '';

  const rawPriority = params.get('priority') ?? '';
  const priority: Priority | '' = (VALID_PRIORITIES as string[]).includes(rawPriority)
    ? (rawPriority as Priority)
    : '';

  const assignee = params.get('assignee') ?? DEFAULT_FILTER.assignee;
  const search = params.get('search') ?? DEFAULT_FILTER.search;

  const rawSortField = params.get('sortField') ?? '';
  const sortField: FilterState['sortField'] = (VALID_SORT_FIELDS as string[]).includes(rawSortField)
    ? (rawSortField as FilterState['sortField'])
    : DEFAULT_FILTER.sortField;

  const rawSortDirection = params.get('sortDirection') ?? '';
  const sortDirection: FilterState['sortDirection'] = (VALID_SORT_DIRECTIONS as string[]).includes(rawSortDirection)
    ? (rawSortDirection as FilterState['sortDirection'])
    : DEFAULT_FILTER.sortDirection;

  const rawPage = params.get('page');
  const page = rawPage !== null ? parseInt(rawPage, 10) : DEFAULT_FILTER.page;

  return {
    status,
    priority,
    assignee,
    search,
    sortField,
    sortDirection,
    page: isNaN(page) ? DEFAULT_FILTER.page : page,
  };
}

function buildSearchParams(state: FilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.status !== DEFAULT_FILTER.status) {
    params.set('status', state.status);
  }
  if (state.priority !== DEFAULT_FILTER.priority) {
    params.set('priority', state.priority);
  }
  if (state.assignee !== DEFAULT_FILTER.assignee) {
    params.set('assignee', state.assignee);
  }
  if (state.search !== DEFAULT_FILTER.search) {
    params.set('search', state.search);
  }
  if (state.sortField !== DEFAULT_FILTER.sortField) {
    params.set('sortField', state.sortField);
  }
  if (state.sortDirection !== DEFAULT_FILTER.sortDirection) {
    params.set('sortDirection', state.sortDirection);
  }
  if (state.page !== DEFAULT_FILTER.page) {
    params.set('page', String(state.page));
  }

  return params;
}

export function useFilterState(): [FilterState, (patch: Partial<FilterState>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const filterState = parseFilterState(searchParams);

  const setFilter = useCallback(
    (patch: Partial<FilterState>) => {
      const current = parseFilterState(searchParams);
      const merged: FilterState = { ...current, ...patch };

      // Reset page to 0 when any non-page field changes, unless page is
      // explicitly included in the patch
      const nonPageKeys = Object.keys(patch).filter(k => k !== 'page');
      if (nonPageKeys.length > 0 && !('page' in patch)) {
        merged.page = 0;
      }

      setSearchParams(buildSearchParams(merged), { replace: true });
    },
    [searchParams, setSearchParams]
  );

  return [filterState, setFilter];
}
