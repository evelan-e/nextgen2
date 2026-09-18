import type { HistoryTicket } from '../../types';
import { Badge } from '../ui/Badge';
import { formatDateTime } from '../../utils/time';

interface HistoryDetailSidebarProps {
  ticket: HistoryTicket;
  onReopen: () => void;
}

export default function HistoryDetailSidebar({ ticket, onReopen }: HistoryDetailSidebarProps) {
  const labelClass = 'text-xs font-medium text-gray-500 uppercase tracking-wide';

  return (
    <aside className="w-64 shrink-0 space-y-5">

      {/* Reopen Ticket button */}
      <button
        type="button"
        onClick={onReopen}
        className={
          'w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white ' +
          'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        }
      >
        Reopen Ticket
      </button>

      {/* Status — read-only */}
      <div>
        <h3 className={`${labelClass} mb-1`}>Status</h3>
        <Badge value={ticket.status} kind="status" />
      </div>

      {/* Priority — read-only */}
      <div>
        <h3 className={`${labelClass} mb-1`}>Priority</h3>
        <Badge value={ticket.priority} kind="priority" />
      </div>

      {/* Assignee — read-only */}
      <div>
        <h3 className={`${labelClass} mb-1`}>Assignee</h3>
        <p className="text-sm text-gray-900">{ticket.assignee || 'Unassigned'}</p>
      </div>

      {/* Customer — read-only */}
      <div>
        <h3 className={`${labelClass} mb-1`}>Customer</h3>
        <p className="text-sm font-medium text-gray-900">{ticket.customerName}</p>
        <p className="text-sm text-gray-500">{ticket.customerEmail}</p>
      </div>

      {/* Created */}
      <div>
        <h3 className={`${labelClass} mb-1`}>Created</h3>
        <p className="text-sm text-gray-900">{formatDateTime(ticket.createdAt)}</p>
      </div>

      {/* Resolved At */}
      <div>
        <h3 className={`${labelClass} mb-1`}>Resolved At</h3>
        <p className="text-sm text-gray-900">{formatDateTime(ticket.resolvedAt)}</p>
      </div>

      {/* Resolved By */}
      <div>
        <h3 className={`${labelClass} mb-1`}>Resolved By</h3>
        <p className="text-sm text-gray-900">{ticket.resolvedBy}</p>
      </div>

      {/* Tags */}
      <div>
        <h3 className={`${labelClass} mb-1`}>Tags</h3>
        {ticket.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {ticket.tags.map((tag) => (
              <span
                key={tag}
                className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">None</p>
        )}
      </div>

    </aside>
  );
}
