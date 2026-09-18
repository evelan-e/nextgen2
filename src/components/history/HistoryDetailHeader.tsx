import { useLocation, useNavigate } from 'react-router-dom';
import type { HistoryTicket } from '../../types';
import { Badge } from '../ui/Badge';
import { formatDateTime } from '../../utils/time';

interface HistoryDetailHeaderProps {
  ticket: HistoryTicket;
}

/**
 * Header for the history ticket detail view.
 * Displays ID, subject, status/priority badges, and a back link
 * that restores the filter state the user had on the history list.
 * Also shows a metadata row with resolved-at timestamp and resolved-by.
 * Requirements: 4.1, 4.2
 */
export default function HistoryDetailHeader({ ticket }: HistoryDetailHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const from = (location.state as { from?: string } | null)?.from;
  const backHref = from ? `/history?${from}` : '/history';

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <button
        onClick={() => navigate(backHref)}
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mb-3"
      >
        ← Back to History
      </button>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-mono text-gray-500">{ticket.id}</span>

        <h1 className="text-lg font-semibold text-gray-900 mr-2">{ticket.subject}</h1>

        <Badge value={ticket.status} kind="status" />
        <Badge value={ticket.priority} kind="priority" />
      </div>

      <p className="mt-1 text-sm text-gray-500">
        Resolved at: {formatDateTime(ticket.resolvedAt)} · Resolved by: {ticket.resolvedBy}
      </p>
    </header>
  );
}
