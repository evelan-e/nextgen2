import type { Priority, Status } from '../../types';

const STATUS_COLORS: Record<Status, string> = {
  'Open':                'bg-blue-100 text-blue-800',
  'In Progress':         'bg-yellow-100 text-yellow-800',
  'Waiting on Customer': 'bg-orange-100 text-orange-800',
  'Resolved':            'bg-green-100 text-green-800',
  'Closed':              'bg-gray-100 text-gray-700',
};

const PRIORITY_COLORS: Record<Priority, string> = {
  'Low':    'bg-slate-100 text-slate-700',
  'Medium': 'bg-blue-100 text-blue-700',
  'High':   'bg-amber-100 text-amber-800',
  'Urgent': 'bg-red-100 text-red-800',
};

interface BadgeProps {
  value: Priority | Status;
  kind: 'priority' | 'status';
}

export function Badge({ value, kind }: BadgeProps) {
  const colorClass =
    kind === 'priority'
      ? PRIORITY_COLORS[value as Priority]
      : STATUS_COLORS[value as Status];

  const label = kind === 'priority' ? `Priority: ${value}` : `Status: ${value}`;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
      aria-label={label}
    >
      {value}
    </span>
  );
}
