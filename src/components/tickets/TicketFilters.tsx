import type { FilterState, Status, Priority } from '../../types';

const STATUS_OPTIONS: Status[] = [
  'Open',
  'In Progress',
  'Waiting on Customer',
  'Resolved',
  'Closed',
];

const PRIORITY_OPTIONS: Priority[] = ['Low', 'Medium', 'High', 'Urgent'];

const ASSIGNEE_OPTIONS = [
  'Alex Rivera',
  'Sam Chen',
  'Jordan Lee',
  'Taylor Kim',
];

interface TicketFiltersProps {
  filter: FilterState;
  onFilterChange: (patch: Partial<FilterState>) => void;
}

/**
 * Status, Priority, and Assignee dropdown filters bound to the active FilterState.
 * Requirements 5.1, 5.4, 5.5
 */
export function TicketFilters({ filter, onFilterChange }: TicketFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status filter */}
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-status" className="sr-only">
          Filter by Status
        </label>
        <select
          id="filter-status"
          aria-label="Filter by Status"
          value={filter.status}
          onChange={(e) =>
            onFilterChange({ status: e.target.value as Status | '' })
          }
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Priority filter */}
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-priority" className="sr-only">
          Filter by Priority
        </label>
        <select
          id="filter-priority"
          aria-label="Filter by Priority"
          value={filter.priority}
          onChange={(e) =>
            onFilterChange({ priority: e.target.value as Priority | '' })
          }
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
        >
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Assignee filter */}
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-assignee" className="sr-only">
          Filter by Assignee
        </label>
        <select
          id="filter-assignee"
          aria-label="Filter by Assignee"
          value={filter.assignee}
          onChange={(e) => onFilterChange({ assignee: e.target.value })}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
        >
          <option value="">All Assignees</option>
          {ASSIGNEE_OPTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
