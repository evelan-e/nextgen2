import { useState } from 'react';
import Modal from '../ui/Modal';
import type { HistoryTicket, Ticket } from '../../types';
import { useTicketContext } from '../../context/TicketContext';
import ticketHistoryService from '../../services/ticketHistoryService';
import ticketService from '../../services/ticketService';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ASSIGNEE_OPTIONS = ['Alex Rivera', 'Sam Chen', 'Jordan Lee', 'Taylor Kim'];
const MAX_REASON_LENGTH = 1000;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReopenModalProps {
  isOpen: boolean;
  ticket: HistoryTicket;
  onClose: () => void;
  onSuccess: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReopenModal({ isOpen, ticket, onClose, onSuccess }: ReopenModalProps) {
  const { dispatch } = useTicketContext();

  const [assignee, setAssignee] = useState('');
  const [reason, setReason] = useState('');
  const [assigneeError, setAssigneeError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset local state each time the modal opens
  const handleClose = () => {
    setAssignee('');
    setReason('');
    setAssigneeError(null);
    setSubmitError(null);
    setSaving(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate assignee
    if (!assignee) {
      setAssigneeError('Please select an assignee before reopening.');
      return;
    }

    setAssigneeError(null);
    setSubmitError(null);
    setSaving(true);

    try {
      // Step 1 — call the RPC
      await ticketHistoryService.reopenTicket(ticket.id, assignee);

      // Step 2 — build the Ticket object to add to active list
      const now = new Date().toISOString();
      const reopenedTicket: Ticket = {
        id: ticket.id,
        subject: ticket.subject,
        customerName: ticket.customerName,
        customerEmail: ticket.customerEmail,
        priority: ticket.priority,
        status: 'Open',
        assignee,
        description: ticket.description,
        createdAt: ticket.createdAt,
        updatedAt: now,
        tags: ticket.tags,
        comments: ticket.comments,
        events: ticket.events,
      };

      // Step 3 — update the context
      dispatch({ type: 'REOPEN_TICKET', payload: reopenedTicket });

      // Step 4 — optionally persist the reason as an internal comment
      const trimmedReason = reason.trim();
      if (trimmedReason) {
        await ticketService.addComment(ticket.id, {
          author: 'Agent',
          authorInitials: 'AG',
          body: trimmedReason,
          type: 'internal',
        });
      }

      // Step 5 — notify parent
      onSuccess();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to reopen ticket. Please try again.'
      );
      setSaving(false);
    }
  };

  const selectClass =
    'mt-1 block w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reopen Ticket">
      <form onSubmit={handleSubmit} noValidate>
        <p className="text-sm text-gray-600 mb-4">
          Reopening <span className="font-medium text-gray-900">{ticket.subject}</span> will move it
          back to the active ticket queue with status <span className="font-medium">Open</span>.
        </p>

        {/* Assignee */}
        <div className="mb-4">
          <label
            htmlFor="reopen-assignee"
            className="block text-sm font-medium text-gray-700"
          >
            Assignee <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <select
            id="reopen-assignee"
            value={assignee}
            onChange={(e) => {
              setAssignee(e.target.value);
              if (e.target.value) setAssigneeError(null);
            }}
            disabled={saving}
            aria-required="true"
            aria-describedby={assigneeError ? 'reopen-assignee-error' : undefined}
            className={`${selectClass} ${assigneeError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
          >
            <option value="">— Select assignee —</option>
            {ASSIGNEE_OPTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          {assigneeError && (
            <p id="reopen-assignee-error" role="alert" className="mt-1 text-sm text-red-600">
              {assigneeError}
            </p>
          )}
        </div>

        {/* Reason (optional) */}
        <div className="mb-5">
          <label
            htmlFor="reopen-reason"
            className="block text-sm font-medium text-gray-700"
          >
            Reason{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="reopen-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, MAX_REASON_LENGTH))}
            disabled={saving}
            placeholder="Why are you reopening this ticket? (optional)"
            rows={4}
            maxLength={MAX_REASON_LENGTH}
            className={
              'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 ' +
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y ' +
              'disabled:opacity-50 disabled:cursor-not-allowed'
            }
          />
          <p className="mt-1 text-xs text-gray-400 text-right" aria-live="polite">
            {reason.length} / {MAX_REASON_LENGTH}
          </p>
        </div>

        {/* Submit error */}
        {submitError && (
          <p role="alert" className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {submitError}
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className={
              'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md ' +
              'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ' +
              'disabled:opacity-50 disabled:cursor-not-allowed'
            }
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={
              'px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md ' +
              'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ' +
              'disabled:opacity-50 disabled:cursor-not-allowed'
            }
          >
            {saving ? 'Reopening…' : 'Reopen Ticket'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
