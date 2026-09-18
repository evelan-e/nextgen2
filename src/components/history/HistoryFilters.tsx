import type { HistoryFilter, Priority } from '../../types';

const PRIORITY_OPTIONS: Priority[] = ['Low', 'Medium', 'High', 'Urgent'];

const SELECT_CLASS =
  'rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0';

const INPUT_CLASS =
  'rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0';

interface HistoryFiltersProps {
  filter: HistoryFilter;
  assigneeOptions: string[];
  onFilterChange: (patch: Partial<HistoryFilter>) => void;
  dateError: string | null;
}

/**
 * Date range, priority, assignee, and text search filters for the History page.
 * Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */
export default function HistoryFilters({
  filter,
  assigneeOptions,
  onFilterChange,
  dateError,
}: HistoryFiltersProps) {
  return (
    <div className="flex flex-wrap items-start gap-3">
      {/* Date range */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {/* From date */}
          <div className="flex flex-col gap-1">
            <label htmlFor="history-from-date" className="sr-only">
              From date
            </label>
            <input
              id="history-from-date"
              type="date"
              aria-label="From date"
              value={filter.fromDate}
              onChange={(e) => onFilterChange({ fromDate: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>

          <span className="text-sm text-gray-500">to</span>

          {/* To date */}
          <div className="flex flex-col gap-1">
            <label htmlFor="history-to-date" className="sr-only">
              To date
            </label>
            <input
              id="history-to-date"
              type="date"
              aria-label="To date"
              value={filter.toDate}
              onChange={(e) => onFilterChange({ toDate: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        {/* Date validation error */}
        {dateError !== null && (
          <p className="text-xs text-red-600 mt-1">{dateError}</p>
        )}
      </div>

      {/* Priority filter */}
      <div className="flex flex-col gap-1">
        <label htmlFor="history-filter-priority" className="sr-only">
          Filter by Priority
        </label>
        <select
          id="history-filter-priority"
          aria-label="Filter by Priority"
          value={filter.priority}
          onChange={(e) =>
            onFilterChange({ priority: e.target.value as Priority | '' })
          }
          className={SELECT_CLASS}
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
        <label htmlFor="history-filter-assignee" className="sr-only">
          Filter by Assignee
        </label>
        <select
          id="history-filter-assignee"
          aria-label="Filter by Assignee"
          value={filter.assignee}
          onChange={(e) => onFilterChange({ assignee: e.target.value })}
          className={SELECT_CLASS}
        >
          <option value="">All Assignees</option>
          {assigneeOptions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {/* Text search */}
      <div className="flex flex-col gap-1">
        <label htmlFor="history-search" className="sr-only">
          Search tickets
        </label>
        <input
          id="history-search"
          type="text"
          aria-label="Search tickets"
          placeholder="Search tickets…"
          value={filter.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          className={INPUT_CLASS}
        />
      </div>
    </div>
  );
}
