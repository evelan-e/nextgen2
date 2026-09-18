import PageHeader from '../components/layout/PageHeader';
import HistoryFilters from '../components/history/HistoryFilters';
import HistoryTable from '../components/history/HistoryTable';
import { useHistoryFilter } from '../hooks/useHistoryFilter';
import { useHistoryTickets } from '../hooks/useHistoryTickets';

/**
 * Resolved/closed ticket history page.
 * Composes useHistoryFilter + useHistoryTickets with HistoryFilters and HistoryTable.
 * History is server-side limited to 100 results — no pagination needed.
 * Requirements: 2.1, 2.2, 2.5, 2.6, 2.7, 2.8, 3.1–3.7
 */
export default function HistoryPage() {
  const [filter, setFilter, dateError] = useHistoryFilter();
  const { rows, loading, error, assigneeOptions } = useHistoryTickets(filter);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="History" />

      {/* Toolbar: filters */}
      <div className="flex flex-wrap items-start gap-3 px-6 py-3 border-b border-gray-200 bg-white">
        <HistoryFilters
          filter={filter}
          assigneeOptions={assigneeOptions}
          onFilterChange={setFilter}
          dateError={dateError}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {error !== null ? (
          <p className="px-6 py-4 text-sm text-red-600">Error: {error}</p>
        ) : (
          <HistoryTable rows={rows} loading={loading} />
        )}
      </div>
    </div>
  );
}
