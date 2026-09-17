import { Link, useLocation } from 'react-router-dom';
import type { Ticket } from '../../types';
import { Badge } from '../ui/Badge';

interface TicketDetailHeaderProps {
  ticket: Ticket;
}

/**
 * Header for the ticket detail view.
 * Displays ID, subject, status/priority badges, and a back link
 * that restores the filter state the user had on the ticket list.
 * Requirements: 7.3, 7.4
 */
export default function TicketDetailHeader({ ticket }: TicketDetailHeaderProps) {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const backHref = `/tickets${from ? `?${from}` : ''}`;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <Link
        to={backHref}
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mb-3"
      >
        ← Back to tickets
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-mono text-gray-500">{ticket.id}</span>

        <h1 className="text-lg font-semibold text-gray-900 mr-2">{ticket.subject}</h1>

        <Badge value={ticket.status} kind="status" />
        <Badge value={ticket.priority} kind="priority" />
      </div>
    </header>
  );
}
