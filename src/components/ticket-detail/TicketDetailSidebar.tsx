import { useState } from 'react';
import type { Priority, Status, Ticket } from '../../types';
import { Toast } from '../ui/Toast';
import { formatDateTime } from '../../utils/time';
import { useTicketContext } from '../../context/TicketContext';
import ticketService, { generateEventId } from '../../services/ticketService';

const STATUS_OPTIONS: Status[] = ['Open', 'In Progress', 'Waiting on Customer', 'Resolved', 'Closed'];
const PRIORITY_OPTIONS: Priority[] = ['Low', 'Medium', 'High', 'Urgent'];
const ASSIGNEE_OPTIONS = ['', 'Alex Rivera', 'Sam Chen', 'Jordan Lee', 'Taylor Kim'];

interface TicketDetailSidebarProps {
  ticket: Ticket;
}

export default function TicketDetailSidebar({ ticket }: TicketDetailSidebarProps) {
  const { dispatch } = useTicketContext();
  const [toast, setToast] = useState<string | null>(null);

  const applyChange = async (field: string, oldValue: string, newValue: string) => {
    if (oldValue === newValue) return;

    const patch: Partial<Ticket> = { [field]: newValue };
    const updated = await ticketService.updateTicket(ticket.id, patch);
    dispatch({ type: 'UPDATE_TICKET', payload: updated });

    const event = {
      id: generateEventId(),
      field,
      oldValue: oldValue || 'Unassigned',
      newValue: newValue || 'Unassigned',
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_EVENT', ticketId: ticket.id, event });
    setToast(`${field.charAt(0).toUpperCase() + field.slice(1)} updated`);
  };

  const handleStatusChange = (newStatus: Status) => {
    if (newStatus === ticket.status) return;
    if (newStatus === 'Resolved' || newStatus === 'Closed') {
      if (!confirm(`Mark this ticket as "${newStatus}"?`)) return;
    }
    applyChange('status', ticket.status, newStatus);
  };

  const handlePriorityChange = (newPriority: Priority) => {
    applyChange('priority', ticket.priority, newPriority);
  };

  const handleAssigneeChange = (newAssignee: string) => {
    applyChange('assignee', ticket.assignee, newAssignee);
  };

  const selectClass =
    'mt-1 block w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

  return (
    <>
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <aside className="w-64 shrink-0 space-y-5">

        {/* Status — editable */}
        <div>
          <label htmlFor="sidebar-status" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Status
          </label>
          <select
            id="sidebar-status"
            value={ticket.status}
            onChange={(e) => handleStatusChange(e.target.value as Status)}
            className={selectClass}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Priority — editable */}
        <div>
          <label htmlFor="sidebar-priority" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Priority
          </label>
          <select
            id="sidebar-priority"
            value={ticket.priority}
            onChange={(e) => handlePriorityChange(e.target.value as Priority)}
            className={selectClass}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Assignee — editable */}
        <div>
          <label htmlFor="sidebar-assignee" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Assignee
          </label>
          <select
            id="sidebar-assignee"
            value={ticket.assignee}
            onChange={(e) => handleAssigneeChange(e.target.value)}
            className={selectClass}
          >
            {ASSIGNEE_OPTIONS.map((a) => (
              <option key={a} value={a}>{a || 'Unassigned'}</option>
            ))}
          </select>
        </div>

        {/* Customer — read-only */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Customer</h3>
          <p className="text-sm font-medium text-gray-900">{ticket.customerName}</p>
          <p className="text-sm text-gray-500">{ticket.customerEmail}</p>
        </div>

        {/* Created */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Created</h3>
          <p className="text-sm text-gray-900">{formatDateTime(ticket.createdAt)}</p>
        </div>

        {/* Last Updated */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Last Updated</h3>
          <p className="text-sm text-gray-900">{formatDateTime(ticket.updatedAt)}</p>
        </div>

        {/* Tags */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Tags</h3>
          {ticket.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {ticket.tags.map((tag) => (
                <span key={tag} className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">None</p>
          )}
        </div>

      </aside>
    </>
  );
}
