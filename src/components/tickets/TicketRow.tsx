import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Ticket } from '../../types';
import { Badge } from '../ui/Badge';
import { formatRelative } from '../../utils/time';

interface TicketRowProps {
  ticket: Ticket;
}

/**
 * Renders a single ticket as a <tr> with 7 columns.
 * Clicking or pressing Enter/Space navigates to /tickets/:id,
 * passing the current query string in location state so the detail
 * view's back-link can restore the filter state.
 * Requirements: 4.1–4.7
 */
const TicketRow: React.FC<TicketRowProps> = ({ ticket }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = () => {
    navigate(`/tickets/${ticket.id}`, {
      state: { from: location.search },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNavigate();
    }
  };

  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
      className="cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
      aria-label={`Ticket ${ticket.id}: ${ticket.subject}`}
    >
      {/* Ticket ID */}
      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-600">
        {ticket.id}
      </td>

      {/* Subject */}
      <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">
        {ticket.subject}
      </td>

      {/* Customer */}
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
        {ticket.customerName}
      </td>

      {/* Priority */}
      <td className="px-4 py-3 whitespace-nowrap">
        <Badge value={ticket.priority} kind="priority" />
      </td>

      {/* Status */}
      <td className="px-4 py-3 whitespace-nowrap">
        <Badge value={ticket.status} kind="status" />
      </td>

      {/* Assignee */}
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
        {ticket.assignee || '—'}
      </td>

      {/* Updated */}
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
        {formatRelative(ticket.updatedAt)}
      </td>
    </tr>
  );
};

export default TicketRow;
