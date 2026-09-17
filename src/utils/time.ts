/**
 * Formats an ISO 8601 timestamp as a relative string.
 * e.g. "just now", "3 minutes ago", "2 hours ago", "4 days ago", "Jan 15"
 */
export function formatRelative(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'just now';
  }

  if (diffMin < 60) {
    return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
  }

  if (diffHour < 24) {
    return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
  }

  if (diffDay < 7) {
    return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;
  }

  // Older than 7 days — render as "MMM D", e.g. "Jan 15"
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(isoString),
  );
}

/**
 * Formats an ISO 8601 timestamp as a full date + time string.
 * e.g. "Jan 15, 2025 at 3:42 PM"
 * Used in tooltips or the detail sidebar for exact timestamps.
 */
export function formatDateTime(isoString: string): string {
  const formatted = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(isoString));

  // Intl produces "Jan 15, 2025, 3:42 PM" — swap the second ", " for " at "
  const parts = formatted.split(', ');
  // parts: ["Jan 15", "2025", "3:42 PM"]
  if (parts.length === 3) {
    return `${parts[0]}, ${parts[1]} at ${parts[2]}`;
  }
  return formatted;
}
