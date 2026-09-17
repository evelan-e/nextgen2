# Implementation Plan: Customer Support Dashboard

## Overview

Build a client-side React 18 + TypeScript SPA with Vite, Tailwind CSS, and React Router v6. The implementation follows a strict bottom-up order: types → data layer → global store → shared UI primitives → app shell → feature screens.

---

## Tasks

- [ ] 1. Bootstrap project and define types
  - [x] 1.1 Scaffold Vite + React 18 + TypeScript project, install Tailwind CSS, React Router v6, and any utility libraries
    - Run `npm create vite@latest`, configure `tailwind.config.ts`, set up `postcss.config.js`, add global `index.css` with Tailwind directives
    - Create `src/types/index.ts` with `Priority`, `Status`, `Ticket`, `Comment`, `SystemEvent`, `TimelineEntry`, and `FilterState` types exactly as specified in the design
    - _Requirements: 3.1, 3.5_

- [x] 2. Implement the data layer
  - [x] 2.1 Create `src/services/ticketService.ts` with all five async methods (`listTickets`, `getTicket`, `createTicket`, `updateTicket`, `addComment`) backed by an in-memory array
    - Implement sequential ID generation (`TKT-0001`, `TKT-0002`, …)
    - All methods return `Promise<T>` via `Promise.resolve()`
    - _Requirements: 3.1, 3.5_

  - [x] 2.2 Seed the in-memory store with 15 mock `Ticket` objects on module load
    - Each ticket must have 2–4 `Comment` entries with realistic placeholder data, varied statuses, priorities, assignees, and tags
    - _Requirements: 3.2_

- [x] 3. Implement the global store
  - [x] 3.1 Create `src/context/ticketReducer.ts` with the `TicketAction` union and pure reducer handling `LOAD_TICKETS`, `ADD_TICKET`, `UPDATE_TICKET`, `ADD_COMMENT`, `ADD_EVENT`, `SET_LOADING`, and `SET_ERROR`
    - _Requirements: 3.3, 3.4_

  - [x] 3.2 Create `src/context/TicketContext.tsx` with `TicketProvider` that initialises state, fetches from `ticketService.listTickets()` on mount, and wraps children
    - _Requirements: 3.3, 3.4_

- [x] 4. Build shared UI primitives
  - [x] 4.1 Implement `src/components/ui/Badge.tsx`
    - Apply `STATUS_COLORS` and `PRIORITY_COLORS` Tailwind classes from the design
    - Add `aria-label` exposing "Priority: {value}" or "Status: {value}"
    - _Requirements: 4.3, 12.4_

  - [x] 4.3 Implement `src/components/ui/Toast.tsx`
    - Auto-dismiss after 3 s, `role="status"`, `aria-live="polite"`
    - _Requirements: 6.7, 10.2, 12.4_

  - [x] 4.4 Implement `src/components/ui/Modal.tsx`
    - Focus trap: collect all focusable descendants, wrap Tab/Shift+Tab, call `onClose` on Escape
    - Add `role="dialog"` and `aria-modal="true"`
    - _Requirements: 6.9, 12.3_

  - [x] 4.5 Implement `src/components/ui/LoadingSkeleton.tsx` and `src/components/ui/EmptyState.tsx`
    - `LoadingSkeleton`: animated pulse rows matching the ticket table column count
    - `EmptyState`: accepts a `message` prop and an optional reset action
    - _Requirements: 4.4, 4.5, 7.7_

- [x] 5. Build app shell and routing
  - [x] 5.1 Create `src/components/layout/Sidebar.tsx` and `src/components/layout/AppShell.tsx`
    - `AppShell`: fixed sidebar + flex main content, `margin-left` matching sidebar width
    - `Sidebar`: 240 px expanded / 56 px collapsed, `useSidebar` hook tracking `isCollapsed` with `resize` listener, product name/logo at top, user avatar initials + name at bottom
    - Navigation items: Dashboard, Tickets, Customers, Settings — each with an icon; hide text labels when collapsed
    - Active route highlight via React Router `NavLink`
    - Collapse to icon-only when `window.innerWidth < 768` on mount
    - _Requirements: 1.1–1.7, 2.1–2.3, 13.1_

  - [x] 5.2 Create `src/components/layout/PageHeader.tsx` and all page stubs
    - `PageHeader`: renders page title above a content region
    - Create `DashboardPage.tsx`, `TicketsPage.tsx`, `TicketDetailPage.tsx`, `CustomersPage.tsx` (placeholder), `SettingsPage.tsx` (placeholder)
    - Wire `App.tsx` with `<TicketProvider>` wrapping all routes; add catch-all `*` route rendering `EmptyState`
    - _Requirements: 1.7, 2.4, 2.5_

- [x] 6. Implement Dashboard page
  - [x] 6.1 Create `src/components/dashboard/StatCard.tsx` and implement the four KPI stat cards in `DashboardPage.tsx`
    - Derive Open count, Unassigned count, Resolved today, and Avg age (hours) from store via `useMemo`
    - _Requirements: 11.1, 11.2_

  - [x] 6.3 Create `src/components/dashboard/PriorityBreakdown.tsx`
    - Group open tickets by priority, render count per level; no counts omitted or double-counted
    - _Requirements: 11.3_

  - [x] 6.5 Create `src/components/dashboard/RecentTickets.tsx`
    - Sort all tickets descending by `updatedAt`, take first `min(5, N)`, render each as a link to `/tickets/:id`
    - _Requirements: 11.4, 11.5_

- [x] 7. Implement Ticket List view
  - [x] 7.1 Implement `src/hooks/useFilterState.ts`
    - Read/write `FilterState` from `useSearchParams`; serialise only non-default values; return `[FilterState, setter]`
    - _Requirements: 5.5, 5.6_

  - [x] 7.3 Implement `src/hooks/useTickets.ts`
    - Apply filtering pipeline in order: Status → Priority → Assignee → text search → sort → paginate (slice `[page*10, (page+1)*10]`)
    - Priority rank map: `{ Low:1, Medium:2, High:3, Urgent:4 }`
    - Return `{ rows, totalCount, totalPages }`
    - _Requirements: 5.1–5.4_

  - [x] 7.6 Create `src/components/tickets/TicketFilters.tsx`, `TicketSearch.tsx`, and `Pagination.tsx`
    - `TicketFilters`: Status, Priority, Assignee dropdowns bound to `useFilterState`
    - `TicketSearch`: text input bound to `useFilterState`
    - `Pagination`: previous/next page controls driven by `totalPages`
    - _Requirements: 4.6, 5.1–5.4_

  - [x] 7.7 Create `src/components/tickets/TicketRow.tsx` and `TicketTable.tsx`
    - `TicketRow`: renders all 7 columns; Priority and Status as `<Badge>`; clicking row navigates to `/tickets/:id` via `useNavigate`, passing `location.search` in `state.from`
    - `TicketTable`: renders `LoadingSkeleton` while loading, `EmptyState` when no rows, otherwise maps rows to `TicketRow`
    - Support horizontal scroll on narrow viewports (Requirement 13.2)
    - _Requirements: 4.1–4.7, 13.2_

  - [x] 7.9 Assemble `TicketsPage.tsx`
    - Compose `TicketFilters`, `TicketSearch`, `TicketTable`, and `Pagination` using `useFilterState` and `useTickets`
    - Add "New Ticket" primary action button in the page header
    - _Requirements: 4.1, 5.1–5.6, 6.1_

- [~] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement New Ticket Modal
  - [-] 9.1 Create `src/components/tickets/NewTicketModal.tsx`
    - Controlled form with local `useState`: Subject (required), Customer name (required), Email (required, regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`), Priority (select, default Medium), Description (optional textarea)
    - Validate on submit attempt only; show inline errors adjacent to each invalid field; keep Save disabled while any errors present
    - On valid submit: call `ticketService.createTicket`, dispatch `ADD_TICKET`, close modal, show Toast
    - Close on Cancel button or Escape key (delegated to `Modal`)
    - _Requirements: 6.2–6.9_

  - [~] 9.4 Wire "New Ticket" button in `TicketsPage.tsx` to open `NewTicketModal`
    - _Requirements: 6.1, 6.2_

- [ ] 10. Implement Ticket Detail view
  - [x] 10.1 Implement `src/hooks/useTicket.ts`
    - Select a single ticket from context state by ID; return `Ticket | undefined`
    - _Requirements: 7.1, 7.2_

  - [x] 10.2 Create `src/components/ticket-detail/TicketDetailHeader.tsx`
    - Display Ticket ID, Subject, Status badge, Priority badge
    - Back link navigates to `/tickets?${location.state.from}` (or `/tickets` if absent)
    - _Requirements: 7.3, 7.4_

  - [-] 10.4 Create `src/components/ticket-detail/TicketDetailSidebar.tsx` (read-only fields only for now)
    - Display customer name, email, assignee, priority, created timestamp, last-updated timestamp, and tags
    - _Requirements: 7.6_

  - [~] 10.6 Assemble `TicketDetailPage.tsx`
    - Read `:id` from `useParams`, call `useTicket(id)`, render `EmptyState` if undefined
    - Two-column layout: left column (description + Timeline placeholder + AddComment placeholder), right sidebar
    - _Requirements: 7.1, 7.2, 7.7_

- [x] 11. Implement Activity Timeline
  - [x] 11.1 Add `formatRelative` utility to `src/utils/time.ts`
    - Returns strings like "just now", "5 minutes ago", "2 hours ago"
    - _Requirements: 8.3_

  - [x] 11.2 Create `src/components/ticket-detail/TimelineComment.tsx` and `TimelineEvent.tsx`
    - `TimelineComment`: author name, avatar initials, relative timestamp, body; muted background + "Internal note" label for `type: 'internal'`; default background for `type: 'public'`
    - `TimelineEvent`: field name, old value, new value
    - _Requirements: 8.2–8.4_

  - [x] 11.5 Create `src/components/ticket-detail/Timeline.tsx`
    - Merge `ticket.comments` and `ticket.events` into `TimelineEntry[]`, sort ascending by `createdAt`, render by discriminating on `kind`
    - _Requirements: 8.1_

  - [x] 11.6 Wire `Timeline` into `TicketDetailPage` left column
    - _Requirements: 7.5, 8.1_

- [ ] 12. Implement Add Comment
  - [~] 12.1 Create `src/components/ticket-detail/AddComment.tsx`
    - Textarea + "Reply" button + Internal note / Public reply toggle
    - Block submit if empty or whitespace-only; show inline validation error
    - On valid submit: call `ticketService.addComment`, dispatch `ADD_COMMENT`, dispatch `UPDATE_TICKET` with updated `updatedAt`, clear textarea, scroll new comment into view
    - Support Cmd+Enter / Ctrl+Enter keyboard shortcut on textarea
    - _Requirements: 9.1–9.4_

  - [~] 12.3 Wire `AddComment` into `TicketDetailPage` (pinned to bottom of Timeline section)
    - _Requirements: 9.1_

- [ ] 13. Implement Inline Property Editing
  - [~] 13.1 Upgrade `TicketDetailSidebar.tsx` to render Status, Priority, and Assignee as `<select>` elements
    - On `onChange`: if new Status is `Resolved` or `Closed`, show confirmation prompt before proceeding
    - On confirmed change: call `ticketService.updateTicket`, dispatch `UPDATE_TICKET`, dispatch `ADD_EVENT` with a new `SystemEvent`, show Toast
    - _Requirements: 10.1–10.4_

- [~] 14. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Accessibility and responsive polish
  - [~] 15.1 Audit and apply global focus indicators
    - Ensure `focus:ring-2 focus:ring-offset-2 focus:ring-blue-500` on all interactive elements
    - Verify every interactive element is reachable via Tab
    - _Requirements: 12.1, 12.2_

  - [~] 15.2 Verify ARIA attributes across all components
    - `Badge`: `aria-label` set correctly
    - `Toast`: `role="status"`, `aria-live="polite"`
    - `Modal`: `role="dialog"`, `aria-modal="true"`, overlay `aria-hidden` when closed
    - _Requirements: 12.4_

  - [~] 15.3 Verify responsive behaviour
    - Confirm Sidebar collapses to icon-only below 768 px viewport width
    - Confirm ticket table is horizontally scrollable on narrow viewports
    - _Requirements: 13.1, 13.2_

- [~] 16. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["3.1"] },
    { "id": 4, "tasks": ["3.2"] },
    { "id": 5, "tasks": ["4.1", "4.3", "4.4", "4.5"] },
    { "id": 6, "tasks": ["5.1"] },
    { "id": 7, "tasks": ["5.2"] },
    { "id": 8, "tasks": ["6.1", "7.1", "11.1"] },
    { "id": 9, "tasks": ["6.3", "7.3", "11.2"] },
    { "id": 10, "tasks": ["6.5", "7.6", "7.7", "11.5"] },
    { "id": 11, "tasks": ["7.9", "11.6", "10.1"] },
    { "id": 12, "tasks": ["10.2"] },
    { "id": 13, "tasks": ["9.1", "10.4"] },
    { "id": 14, "tasks": ["9.4", "10.6", "12.1"] },
    { "id": 15, "tasks": ["12.3", "13.1"] },
    { "id": 16, "tasks": ["15.1", "15.2", "15.3"] }
  ]
}
```
