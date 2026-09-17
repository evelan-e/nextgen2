import { useState, useCallback } from 'react';
import Modal from '../ui/Modal';
import { Toast } from '../ui/Toast';
import ticketService from '../../services/ticketService';
import { useTicketContext } from '../../context/TicketContext';
import type { Priority } from '../../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormErrors {
  subject?: string;
  customerName?: string;
  customerEmail?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(
  subject: string,
  customerName: string,
  customerEmail: string
): FormErrors {
  const errors: FormErrors = {};
  if (!subject.trim()) errors.subject = 'Subject is required';
  if (!customerName.trim()) errors.customerName = 'Customer name is required';
  if (!customerEmail.trim() || !EMAIL_REGEX.test(customerEmail.trim())) {
    errors.customerEmail = 'Valid email is required';
  }
  return errors;
}

const BLANK_ERRORS: FormErrors = {};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NewTicketModal({ isOpen, onClose }: Props) {
  const { dispatch } = useTicketContext();

  // Form field state
  const [subject, setSubject] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [description, setDescription] = useState('');

  // UI state
  const [errors, setErrors] = useState<FormErrors>(BLANK_ERRORS);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const hasErrors = Object.keys(errors).length > 0;

  // -------------------------------------------------------------------------
  // Reset everything back to blank
  // -------------------------------------------------------------------------

  const resetForm = useCallback(() => {
    setSubject('');
    setCustomerName('');
    setCustomerEmail('');
    setPriority('Medium');
    setDescription('');
    setErrors(BLANK_ERRORS);
    setSubmitted(false);
    setSaving(false);
  }, []);

  // -------------------------------------------------------------------------
  // Cancel / close
  // -------------------------------------------------------------------------

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const validationErrors = validateForm(subject, customerName, customerEmail);
      setErrors(validationErrors);
      setSubmitted(true);

      if (Object.keys(validationErrors).length > 0) return;

      setSaving(true);
      try {
        const ticket = await ticketService.createTicket({
          subject: subject.trim(),
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          priority,
          description: description.trim(),
        });

        dispatch({ type: 'ADD_TICKET', payload: ticket });
        setToastMessage('Ticket created successfully');
        resetForm();
        onClose();
      } catch (err) {
        // Surface the real error message so it's easier to diagnose
        const message =
          err instanceof Error ? err.message : 'Failed to create ticket. Please try again.';
        setErrors({ subject: message });
        setSaving(false);
      }
    },
    [subject, customerName, customerEmail, priority, description, dispatch, resetForm, onClose]
  );

  // -------------------------------------------------------------------------
  // Live re-validation after first submit attempt
  // -------------------------------------------------------------------------

  const handleFieldChange = useCallback(
    <K extends keyof FormErrors>(
      field: K,
      value: string,
      setter: (v: string) => void
    ) => {
      setter(value);
      if (!submitted) return;

      // Re-run full validation so other fields' errors are preserved
      const next = validateForm(
        field === 'subject' ? value : subject,
        field === 'customerName' ? value : customerName,
        field === 'customerEmail' ? value : customerEmail
      );
      setErrors(next);
    },
    [submitted, subject, customerName, customerEmail]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const saveDisabled = saving || (submitted && hasErrors);

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="New Ticket">
        <form
          id="new-ticket-form"
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          {/* Subject */}
          <div>
            <label
              htmlFor="nt-subject"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Subject <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <input
              id="nt-subject"
              type="text"
              value={subject}
              onChange={(e) => handleFieldChange('subject', e.target.value, setSubject)}
              aria-required="true"
              aria-describedby={errors.subject ? 'nt-subject-error' : undefined}
              aria-invalid={!!errors.subject}
              className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                errors.subject
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 bg-white'
              }`}
              placeholder="Brief description of the issue"
            />
            {errors.subject && (
              <p
                id="nt-subject-error"
                role="alert"
                className="mt-1 text-xs text-red-600"
              >
                {errors.subject}
              </p>
            )}
          </div>

          {/* Customer Name */}
          <div>
            <label
              htmlFor="nt-customer-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Customer name <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <input
              id="nt-customer-name"
              type="text"
              value={customerName}
              onChange={(e) => handleFieldChange('customerName', e.target.value, setCustomerName)}
              aria-required="true"
              aria-describedby={errors.customerName ? 'nt-customer-name-error' : undefined}
              aria-invalid={!!errors.customerName}
              className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                errors.customerName
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 bg-white'
              }`}
              placeholder="Full name"
            />
            {errors.customerName && (
              <p
                id="nt-customer-name-error"
                role="alert"
                className="mt-1 text-xs text-red-600"
              >
                {errors.customerName}
              </p>
            )}
          </div>

          {/* Customer Email */}
          <div>
            <label
              htmlFor="nt-customer-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <input
              id="nt-customer-email"
              type="email"
              value={customerEmail}
              onChange={(e) => handleFieldChange('customerEmail', e.target.value, setCustomerEmail)}
              aria-required="true"
              aria-describedby={errors.customerEmail ? 'nt-customer-email-error' : undefined}
              aria-invalid={!!errors.customerEmail}
              className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                errors.customerEmail
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 bg-white'
              }`}
              placeholder="customer@example.com"
            />
            {errors.customerEmail && (
              <p
                id="nt-customer-email-error"
                role="alert"
                className="mt-1 text-xs text-red-600"
              >
                {errors.customerEmail}
              </p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label
              htmlFor="nt-priority"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Priority
            </label>
            <select
              id="nt-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="nt-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="nt-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 resize-y"
              placeholder="Provide any additional context…"
            />
          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveDisabled}
              aria-disabled={saveDisabled}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && (
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                  />
                </svg>
              )}
              Create Ticket
            </button>
          </div>
        </form>
      </Modal>

      {/* Success toast — rendered outside Modal portal so it stacks above it */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          onDismiss={() => setToastMessage(null)}
        />
      )}
    </>
  );
}
