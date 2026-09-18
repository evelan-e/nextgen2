import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { HistoryTicket, Ticket } from '../types';
import ticketHistoryService from '../services/ticketHistoryService';
import EmptyState from '../components/ui/EmptyState';
import HistoryDetailHeader from '../components/history/HistoryDetailHeader';
import HistoryDetailSidebar from '../components/history/HistoryDetailSidebar';
import Timeline from '../components/ticket-detail/Timeline';
import ReopenModal from '../components/history/ReopenModal';

export default function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<HistoryTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;

    ticketHistoryService.getHistoryTicket(id).then((result) => {
      if (cancelled) return;
      if (result === undefined) {
        setNotFound(true);
      } else {
        setTicket(result);
      }
      setLoading(false);
    }).catch(() => {
      if (!cancelled) {
        setNotFound(true);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  if (notFound || !ticket) {
    return (
      <div>
        <div className="px-6 pt-4">
          <a
            href="/history"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ← Back to History
          </a>
        </div>
        <EmptyState
          message="Ticket not found"
          description="This ticket does not exist in the history."
        />
      </div>
    );
  }

  return (
    <div>
      <HistoryDetailHeader ticket={ticket} />

      <div className="flex gap-6 p-6">
        {/* Left column */}
        <div className="flex-1 min-w-0 space-y-6">
          {ticket.description && (
            <section>
              <h2 className="text-sm font-medium text-gray-500 mb-2">Description</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
            </section>
          )}

          <Timeline ticket={ticket as unknown as Ticket} />
        </div>

        {/* Right sidebar */}
        <HistoryDetailSidebar
          ticket={ticket}
          onReopen={() => setReopenOpen(true)}
        />
      </div>

      <ReopenModal
        isOpen={reopenOpen}
        ticket={ticket}
        onClose={() => setReopenOpen(false)}
        onSuccess={() => {
          setReopenOpen(false);
          navigate('/history');
        }}
      />
    </div>
  );
}
