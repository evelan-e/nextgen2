import { useNavigate } from 'react-router-dom';
import type { HistoryTicket } from '../../types';
import { Badge } from '../ui/Badge';
import { formatDateTime } from '../../utils/time';

interface HistoryRowProps {
  ticket: HistoryTicket;
}

export function HistoryRow({ ticket }: HistoryRowProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/history/${ticket.id}`);
  };

  return (
    <tr
      onClick={handleClick}
      className="cursor-pointer hover:bg-gray-50 transition-colors"
      aria-label={`View ticket ${ticket.id}: ${ticket.subject}`}
    >
      {/* 1. Ticket ID */}
      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-600">
        {ticket.id}
      </td>

      {/* 2. Subject */}
      <td className="px-4 py-3 max-w-xs">
        <span className="block truncate text-sm font-medium text-gray-900">
          {ticket.subject}
        </span>
      </td>

      {/* 3. Customer Name */}
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
        {ticket.customerName}
      </td>

      {/* 4. Priority */}
      <td className="px-4 py-3 whitespace-nowrap">
        <Badge kind="priority" value={ticket.priority} />
      </td>

      {/* 5. Status */}
      <td className="px-4 py-3 whitespace-nowrap">
        <Badge kind="status" value={ticket.status} />
      </td>

      {/* 6. Assignee */}
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
        {ticket.assignee || 'Unassigned'}
      </td>

      {/* 7. Resolved At */}
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
        {formatDateTime(ticket.resolvedAt)}
      </td>

      {/* 8. Resolved By */}
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
        {ticket.resolvedBy}
      </td>
    </tr>
  );
}
