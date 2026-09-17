import type { Ticket, Priority } from '../../types';
import { Badge } from '../ui/Badge';

interface PriorityBreakdownProps {
  tickets: Ticket[];
}

// Display order: most severe first
const PRIORITY_ORDER: Priority[] = ['Urgent', 'High', 'Medium', 'Low'];

/**
 * Dashboard widget that shows Open ticket counts grouped by Priority.
 * All 4 priority levels are always rendered, even when count is 0.
 * Requirements: 11.3
 */
export function PriorityBreakdown({ tickets }: PriorityBreakdownProps) {
  const openTickets = tickets.filter(t => t.status === 'Open');

  // Count per priority — initialise all levels to 0 to avoid omissions
  const counts: Record<Priority, number> = {
    Urgent: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  };
  for (const ticket of openTickets) {
    counts[ticket.priority] += 1;
  }

  const maxCount = Math.max(...Object.values(counts), 1); // avoid division-by-zero

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-sm font-medium text-gray-500 mb-4">
        Open Tickets by Priority
      </h2>

      <ul className="space-y-3" role="list">
        {PRIORITY_ORDER.map(priority => {
          const count = counts[priority];
          const barWidthPct = Math.round((count / maxCount) * 100);

          return (
            <li key={priority} className="flex items-center gap-3">
              {/* Priority badge label */}
              <span className="w-24 flex-shrink-0">
                <Badge value={priority} kind="priority" />
              </span>

              {/* Visual bar */}
              <div
                className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden"
                role="presentation"
              >
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${barWidthPct}%` }}
                />
              </div>

              {/* Numeric count */}
              <span
                className="w-6 text-right text-sm font-semibold text-gray-800 tabular-nums flex-shrink-0"
                aria-label={`${count} ${priority} open ticket${count !== 1 ? 's' : ''}`}
              >
                {count}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-gray-400">
        Total open: {openTickets.length}
      </p>
    </div>
  );
}

export default PriorityBreakdown;
