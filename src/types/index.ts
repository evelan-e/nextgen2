export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type Status =
  | 'Open'
  | 'In Progress'
  | 'Waiting on Customer'
  | 'Resolved'
  | 'Closed';

export interface Ticket {
  id: string;               // e.g. "TKT-0001"
  subject: string;
  customerName: string;
  customerEmail: string;
  priority: Priority;
  status: Status;
  assignee: string;
  description: string;
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
  tags: string[];
  comments: Comment[];
  events: SystemEvent[];
}

export interface Comment {
  id: string;
  author: string;
  authorInitials: string;
  body: string;
  type: 'public' | 'internal';
  createdAt: string;        // ISO 8601
}

export interface SystemEvent {
  id: string;
  field: string;
  oldValue: string;
  newValue: string;
  createdAt: string;        // ISO 8601
}

export type TimelineEntry =
  | { kind: 'comment'; data: Comment }
  | { kind: 'event'; data: SystemEvent };

export interface FilterState {
  status: Status | '';
  priority: Priority | '';
  assignee: string;
  search: string;
  sortField: 'updatedAt' | 'priority';
  sortDirection: 'asc' | 'desc';
  page: number;
}
