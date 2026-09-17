import { useParams } from 'react-router-dom';
import EmptyState from '../components/ui/EmptyState';
import TicketDetailHeader from '../components/ticket-detail/TicketDetailHeader';
import TicketDetailSidebar from '../components/ticket-detail/TicketDetailSidebar';
import Timeline from '../components/ticket-detail/Timeline';
import AddComment from '../components/ticket-detail/AddComment';
import { useTicket } from '../hooks/useTicket';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ticket = useTicket(id ?? '');

  if (!ticket) {
    return (
      <EmptyState
        message="Ticket not found"
        description="This ticket ID doesn't exist."
      />
    );
  }

  return (
    <div>
      <TicketDetailHeader ticket={ticket} />

      <div className="flex gap-6 p-6">
        {/* Left column */}
        <div className="flex-1 min-w-0 space-y-6">
          {ticket.description && (
            <section>
              <h2 className="text-sm font-medium text-gray-500 mb-2">Description</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
            </section>
          )}

          <Timeline ticket={ticket} />

          <AddComment ticketId={ticket.id} />
        </div>

        {/* Right sidebar */}
        <TicketDetailSidebar ticket={ticket} />
      </div>
    </div>
  );
}
