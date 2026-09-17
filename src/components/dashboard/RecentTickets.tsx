import { Link } from 'react-router-dom';
import type { Ticket } from '../../types';
import { Badge } from '../ui/Badge';
import { formatRelative } from '../../utils/time';

interface RecentTicketsProps {
  tickets: Ticket[];
}

export function RecentTickets({ tickets }: RecentTicketsProps) {
  // Sort descending by updatedAt, then take up to 5
  const recent = [...tickets]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, Math.min(5, tickets.length));

  return (
    <section aria-labelledby="recent-tickets-heading" className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 id="recent-tickets-heading" className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Recently Updated
        </h2>
      </div>

      {recent.length === 0 ? (
        <p className="px-5 py-8 text-sm text-gray-500 text-center">No tickets yet</p>
      ) : (
        <ul role="list" className="divide-y divide-gray-100">
          {recent.map((ticket) => (
            <li key={ticket.id}>
              <Link
                to={`/tickets/${ticket.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
              >
                {/* Ticket ID */}
                <span className="shrink-0 text-xs font-mono text-gray-400 w-20">
                  {ticket.id}
                </span>

                {/* Subject */}
                <span className="flex-1 min-w-0 text-sm font-medium text-gray-800 truncate">
                  {ticket.subject}
                </span>

                {/* Badges */}
                <span className="shrink-0 flex items-center gap-1.5">
                  <Badge value={ticket.status} kind="status" />
                  <Badge value={ticket.priority} kind="priority" />
                </span>

                {/* Relative timestamp */}
                <span className="shrink-0 text-xs text-gray-400 w-24 text-right">
                  {formatRelative(ticket.updatedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
