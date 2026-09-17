import type { SystemEvent } from '../../types';
import { formatRelative } from '../../utils/time';

interface TimelineEventProps {
  event: SystemEvent;
}

export default function TimelineEvent({ event }: TimelineEventProps) {
  return (
    <div
      className="border-l-2 border-gray-300 pl-3 py-1 text-sm text-gray-600"
      aria-label={`System event: ${event.field} changed from ${event.oldValue} to ${event.newValue}`}
    >
      <p>
        Changed <strong className="font-medium text-gray-800">{event.field}</strong> from{' '}
        <strong className="font-medium text-gray-800">{event.oldValue}</strong> to{' '}
        <strong className="font-medium text-gray-800">{event.newValue}</strong>
      </p>
      <time
        dateTime={event.createdAt}
        className="text-xs text-gray-400 mt-0.5 block"
        title={event.createdAt}
      >
        {formatRelative(event.createdAt)}
      </time>
    </div>
  );
}
