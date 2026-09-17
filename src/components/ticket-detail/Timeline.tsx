import type { Ticket, TimelineEntry } from '../../types';
import TimelineComment from './TimelineComment';
import TimelineEvent from './TimelineEvent';

interface TimelineProps {
  ticket: Ticket;
}

export default function Timeline({ ticket }: TimelineProps) {
  const entries: TimelineEntry[] = [
    ...ticket.comments.map((c): TimelineEntry => ({ kind: 'comment', data: c })),
    ...ticket.events.map((e): TimelineEntry => ({ kind: 'event', data: e })),
  ].sort((a, b) => a.data.createdAt.localeCompare(b.data.createdAt));

  if (entries.length === 0) {
    return (
      <section aria-label="Activity timeline">
        <p className="text-sm text-gray-400 italic">No activity yet.</p>
      </section>
    );
  }

  return (
    <section aria-label="Activity timeline" className="space-y-4">
      {entries.map((entry) =>
        entry.kind === 'comment' ? (
          <TimelineComment
            key={`comment-${entry.data.id}`}
            comment={entry.data}
          />
        ) : (
          <TimelineEvent
            key={`event-${entry.data.id}`}
            event={entry.data}
          />
        )
      )}
    </section>
  );
}
