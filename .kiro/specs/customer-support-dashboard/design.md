# Design Document

## Customer Support Dashboard

---

## Overview

A client-side single-page application (SPA) built with React 18 + TypeScript, Vite, Tailwind CSS, and React Router v6. All data lives in an in-memory mock store exposed through `src/services/ticketService.ts`. Global state is managed via a single React Context + `useReducer` pair. There is no backend — every mutation is applied in-memory and the store notifies all subscribers synchronously after dispatch.

---

## Architecture

```
src/
├── main.tsx
├── App.tsx
├── context/
│   ├── TicketContext.tsx
│   └── ticketReducer.ts
├── services/
│   └── ticketService.ts
├── types/
│   └── index.ts
├── hooks/
│   ├── useTickets.ts
│   ├── useTicket.ts
│   └── useFilterState.ts
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   └── PageHeader.tsx
│   ├── ui/
│   │   ├── Badge.tsx
│   │   ├── Toast.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   ├── EmptyState.tsx
│   │   └── Modal.tsx
│   ├── tickets/
│   │   ├── TicketTable.tsx
│   │   ├── TicketRow.tsx
│   │   ├── TicketFilters.tsx
│   │   ├── TicketSearch.tsx
│   │   ├── NewTicketModal.tsx
│   │   └── Pagination.tsx
│   ├── ticket-detail/
│   │   ├── TicketDetailHeader.tsx
│   │   ├── TicketDetailSidebar.tsx
│   │   ├── Timeline.tsx
│   │   ├── TimelineComment.tsx
│   │   ├── TimelineEvent.tsx
│   │   └── AddComment.tsx
│   └── dashboard/
│       ├── StatCard.tsx
│       ├── PriorityBreakdown.tsx
│       └── RecentTickets.tsx
└── pages/
    ├── DashboardPage.tsx
    ├── TicketsPage.tsx
    ├── TicketDetailPage.tsx
    ├── CustomersPage.tsx
    └── SettingsPage.tsx
```

---

## Data Models

```typescript
export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type Status =
  | 'Open'
  | 'In Progress'
  | 'Waiting on Customer'
  | 'Resolved'
  | 'Closed';

export interface Ticket {
  id: string;
  subject: string;
  customerName: string;
  customerEmail: string;
  priority: Priority;
  status: Status;
  assignee: string;
  description: string;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
}

export interface SystemEvent {
  id: string;
  field: string;
  oldValue: string;
  newValue: string;
  createdAt: string;
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
```

---

## Component Interfaces

### TicketService

```typescript
interface TicketService {
  listTickets(): Promise<Ticket[]>;
  getTicket(id: string): Promise<Ticket | undefined>;
  createTicket(input: CreateTicketInput): Promise<Ticket>;
  updateTicket(id: string, patch: Partial<Ticket>): Promise<Ticket>;
  addComment(id: string, comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment>;
}

interface CreateTicketInput {
  subject: string;
  customerName: string;
  customerEmail: string;
  priority: Priority;
  description?: string;
}
```

### Global Store

```typescript
interface TicketState {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
}

type TicketAction =
  | { type: 'LOAD_TICKETS'; payload: Ticket[] }
  | { type: 'ADD_TICKET'; payload: Ticket }
  | { type: 'UPDATE_TICKET'; payload: Ticket }
  | { type: 'ADD_COMMENT'; ticketId: string; comment: Comment }
  | { type: 'ADD_EVENT'; ticketId: string; event: SystemEvent }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string };

interface TicketContextValue {
  state: TicketState;
  dispatch: React.Dispatch<TicketAction>;
}
```

---

## Routing

```
/                     → DashboardPage
/tickets              → TicketsPage
/tickets/:id          → TicketDetailPage
/customers            → CustomersPage (placeholder)
/settings             → SettingsPage  (placeholder)
*                     → 404 EmptyState
```

---

## Badge Color Mapping

```typescript
const STATUS_COLORS: Record<Status, string> = {
  'Open':                 'bg-blue-100 text-blue-800',
  'In Progress':          'bg-yellow-100 text-yellow-800',
  'Waiting on Customer':  'bg-orange-100 text-orange-800',
  'Resolved':             'bg-green-100 text-green-800',
  'Closed':               'bg-gray-100 text-gray-700',
};

const PRIORITY_COLORS: Record<Priority, string> = {
  'Low':    'bg-slate-100 text-slate-700',
  'Medium': 'bg-blue-100 text-blue-700',
  'High':   'bg-amber-100 text-amber-800',
  'Urgent': 'bg-red-100 text-red-800',
};
```

---

## Layout

AppShell uses a CSS flex row. The sidebar is `position: fixed` on the left with `width: 240px` expanded or `width: 56px` collapsed. The main content area has `margin-left` matching the sidebar width.

Collapse logic:
- A `useSidebar` hook tracks `isCollapsed: boolean`.
- On mount, if `window.innerWidth < 768`, `isCollapsed` initialises to `true`.
- A `resize` event listener updates `isCollapsed` reactively.
- When `isCollapsed`, Sidebar renders only icon nodes; text labels are conditionally rendered.

---

## Filter Pipeline

`useTickets` applies criteria in this order:
1. Status filter (exact match, skipped when empty)
2. Priority filter (exact match, skipped when empty)
3. Assignee filter (case-insensitive exact match, skipped when empty)
4. Text search (case-insensitive substring against `subject` and `customerName`)
5. Sort (by `updatedAt` ISO string comparison or priority rank map)
6. Paginate (slice `[page * 10, (page + 1) * 10]`)

Priority rank map: `{ Low: 1, Medium: 2, High: 3, Urgent: 4 }`.

---

## Accessibility

- All interactive elements are native HTML elements for tab stop and screen reader semantics.
- `Modal` adds `role="dialog"` and `aria-modal="true"`.
- `Badge` uses `aria-label` to expose the full "Priority: High" or "Status: Open" text.
- `Toast` region has `role="status"` and `aria-live="polite"`.
- Focus indicators: Tailwind's `focus:ring-2 focus:ring-offset-2 focus:ring-blue-500` applied globally.
