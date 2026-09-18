# Implementation Plan: Resolved Ticket History

## Overview

Implement the Resolved Ticket History feature in TypeScript/React on top of the existing Supabase-backed support desk app. The Supabase schema (table, RLS policies, RPCs) is already live. All work here is client-side: new types, reducer actions, a service module, two hooks, a cluster of components, two pages, and route/sidebar wiring.

---

## Tasks

- [x] 1. Add new TypeScript types to `src/types/index.ts`
  - [x] 1.1 Add `HistoryTicket` interface with all `Ticket` fields plus `resolvedAt: string` and `resolvedBy: string`; constrain `status` to `'Resolved' | 'Closed'`
    - Export `HistoryTicket` from the same file alongside `Ticket`
    - _Requirements: 1.4, 2.3, 4.1_
  - [x] 1.2 Add `HistoryFilter` interface with fields `fromDate: string`, `toDate: string`, `priority: Priority | ''`, `assignee: string`, `search: string`
    - Export `HistoryFilter` from the same file
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_

- [x] 2. Extend `src/context/ticketReducer.ts` with two new actions
  - [x] 2.1 Add `REMOVE_TICKET` action (`{ type: 'REMOVE_TICKET'; ticketId: string }`) to the `TicketAction` union and implement its reducer case to filter out the ticket by ID
    - _Requirements: 1.2, 6.2_
  - [ ]* 2.2 Write property test for `REMOVE_TICKET` (Property 1)
    - **Property 1: REMOVE_TICKET removes exactly one ticket by ID**
    - Test with fast-check: for any list of tickets and any ID in that list, dispatching `REMOVE_TICKET` removes exactly that ticket and leaves all others intact; also verify dispatching with an absent ID is a no-op
    - Place test in `src/context/ticketReducer.test.ts`
    - **Validates: Requirements 1.2, 6.2**
  - [x] 2.3 Add `REOPEN_TICKET` action (`{ type: 'REOPEN_TICKET'; payload: Ticket }`) to the `TicketAction` union and implement its reducer case to prepend the ticket to the active list
    - _Requirements: 5.5, 6.3_
  - [ ]* 2.4 Write property test for `REOPEN_TICKET` (Property 2)
    - **Property 2: REOPEN_TICKET adds the ticket to the active list with Open status**
    - Test with fast-check: for any active list and any `HistoryTicket`, dispatching `REOPEN_TICKET` produces a list containing a ticket with matching `id` and `status === 'Open'`; prior list contents are preserved
    - Place test in `src/context/ticketReducer.test.ts`
    - **Validates: Requirements 5.5, 6.3**

- [x] 3. Create `src/services/ticketHistoryService.ts`
  - [x] 3.1 Add the `HistoryRow` internal interface (snake_case Supabase columns) and `rowToHistoryTicket` mapping function; implement `moveTicketToHistory(ticketId, assignee)` which calls `supabase.rpc('move_ticket_to_history', ...)` with `resolved_at` and `resolved_by` (defaulting to `'unassigned'` when assignee is blank)
    - Mirror the structure of `ticketService.ts`
    - _Requirements: 1.1, 1.5, 1.6, 8.2_
  - [ ]* 3.2 Write property test for `moveTicketToHistory` resolved_by logic (Property 3)
    - **Property 3: moveTicketToHistory populates resolved_by correctly for all assignee inputs**
    - Test with fast-check: for any string assignee (including empty and whitespace-only), the `p_resolved_by` argument passed to `supabase.rpc` equals `assignee.trim() || 'unassigned'`; mock the `supabase` boundary
    - Place test in `src/services/ticketHistoryService.test.ts`
    - **Validates: Requirements 1.5, 1.6**
  - [x] 3.3 Implement `listHistory(filter)` — builds a Supabase query with `.order('resolved_at', { ascending: false }).limit(100)` and applies all non-empty `HistoryFilter` fields as AND conditions; `toDate` appends `T23:59:59Z`; `search` uses `.or('subject.ilike.%…%,customer_name.ilike.%…%')`
    - _Requirements: 2.2, 3.1, 3.2, 3.3, 3.4, 3.6_
  - [ ]* 3.4 Write property test for `listHistory` filter AND composition (Property 5)
    - **Property 5: History filter AND composition**
    - Test with fast-check: for any combination of non-empty `HistoryFilter` fields, every `HistoryTicket` in the returned list satisfies all active filter conditions simultaneously; mock at the `supabase` boundary
    - Place test in `src/services/ticketHistoryService.test.ts`
    - **Validates: Requirements 3.1, 3.4, 3.6**
  - [x] 3.5 Implement `getHistoryTicket(id)` — fetches a single record by primary key; returns `undefined` on PGRST116 (not found), throws on other errors
    - _Requirements: 4.1, 4.4_
  - [x] 3.6 Implement `listAssignees()` — selects the `assignee` column from `ticket_history`, deduplicates client-side, and returns a sorted array of unique non-empty strings
    - _Requirements: 3.3_
  - [ ]* 3.7 Write property test for `listAssignees` distinct values (Property 6)
    - **Property 6: Distinct assignee list reflects all unique assignee values**
    - Test with fast-check: for any array of rows, `listAssignees` returns a list with no duplicates and containing exactly the distinct non-empty assignee values; mock at the `supabase` boundary
    - Place test in `src/services/ticketHistoryService.test.ts`
    - **Validates: Requirements 3.3**
  - [x] 3.8 Implement `reopenTicket(ticketId, assignee)` — calls `supabase.rpc('reopen_ticket', { p_ticket_id, p_assignee, p_reason: '' })` and throws on error
    - _Requirements: 5.4, 8.5_

- [x] 4. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 5. Update `src/hooks/useTickets.ts` default filter
  - [x] 5.1 In the status filter step, when `filter.status === ''` add a secondary filter that excludes tickets with `status === 'Resolved'` or `status === 'Closed'`; keep existing branch for explicit status selections unchanged
    - _Requirements: 6.1_
  - [ ]* 5.2 Write property test for default filter exclusion (Property 4)
    - **Property 4: Default active filter excludes Resolved and Closed tickets**
    - Test with fast-check: for any list of tickets with mixed statuses, calling `useTickets` with default `FilterState` (status `''`) returns a list where no ticket has `status === 'Resolved'` or `status === 'Closed'`
    - Place test in `src/hooks/useTickets.test.ts`
    - **Validates: Requirements 6.1**

- [x] 6. Create `src/hooks/useHistoryFilter.ts`
  - [x] 6.1 Mirror `useFilterState` — parse `HistoryFilter` fields from URL search params (with safe fallbacks), write back via `useSearchParams`; validate that `fromDate ≤ toDate` and return a `dateError: string | null` as the third tuple element
    - Return signature: `[HistoryFilter, (patch: Partial<HistoryFilter>) => void, string | null]`
    - _Requirements: 3.1, 3.5_

- [x] 7. Create `src/hooks/useHistoryTickets.ts`
  - [x] 7.1 Implement `useHistoryTickets(filter: HistoryFilter)` — manages `rows`, `loading`, and `error` state; calls `ticketHistoryService.listHistory(filter)` on filter changes; debounces `filter.search` changes by 300 ms while firing immediately for all other filter field changes; fetches `listAssignees()` separately and returns it alongside main results
    - Return type: `{ rows: HistoryTicket[]; loading: boolean; error: string | null; assigneeOptions: string[] }`
    - _Requirements: 2.2, 3.5, 3.7_

- [x] 8. Create `src/components/history/HistoryRow.tsx`
  - [x] 8.1 Render a single `<tr>` with columns: Ticket ID, Subject, Customer Name, Priority (using `Badge`), Status (using `Badge`), Assignee, Resolved At (formatted via `formatDateTime`), Resolved By; navigate to `/history/${ticket.id}` via `useNavigate` on row click; add `cursor-pointer hover:bg-gray-50` row styles; include an `aria-label` on the row
    - Props: `{ ticket: HistoryTicket }`
    - _Requirements: 2.3, 2.4_
  - [ ]* 8.2 Write property test for `HistoryRow` column rendering (Property 7)
    - **Property 7: HistoryRow renders all required columns for any HistoryTicket**
    - Test with fast-check: for any `HistoryTicket` instance, rendering `HistoryRow` produces output containing the ticket's `id`, `subject`, `customerName`, `priority`, `status`, `assignee`, `resolvedAt`, and `resolvedBy` values
    - Place test in `src/components/history/HistoryRow.test.tsx`
    - **Validates: Requirements 2.3, 2.4**

- [x] 9. Create `src/components/history/HistoryTable.tsx`
  - [x] 9.1 Render a `<table>` with a `<thead>` containing all eight column headers; map `rows` to `<HistoryRow>` components; when `loading` is true render exactly 5 `<LoadingSkeleton>` rows spanning all columns; when not loading and `rows` is empty delegate to `<EmptyState>`
    - Props: `{ rows: HistoryTicket[]; loading: boolean }`
    - _Requirements: 2.3, 2.5, 2.7, 2.8_

- [x] 10. Create `src/components/history/HistoryFilters.tsx`
  - [x] 10.1 Render a `from` date `<input type="date">` and a `to` date `<input type="date">`; when `dateError` is non-null display it as an inline validation message below the date inputs using a red text style; render a priority `<select>` with options `All | Low | Medium | High | Urgent`; render an assignee `<select>` populated from `assigneeOptions` with an "All" default
    - Props: `{ filter: HistoryFilter; assigneeOptions: string[]; onFilterChange: (patch: Partial<HistoryFilter>) => void; dateError: string | null }`
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 10.2 Add the text search `<input>` to `HistoryFilters` with debounce handled by the parent hook (the component just calls `onFilterChange({ search: value })` on every keystroke; debouncing happens in `useHistoryTickets`)
    - _Requirements: 3.4, 3.5_

- [x] 11. Create `src/components/history/HistoryDetailHeader.tsx`
  - [x] 11.1 Mirror `TicketDetailHeader` structure: render the ticket subject as the page title, a "← Back to History" link that navigates to `/history` (restoring query params from `location.state?.from` if present), and a metadata row beneath the subject showing `resolvedAt` (formatted) and `resolvedBy`
    - Props: `{ ticket: HistoryTicket }`
    - _Requirements: 4.1, 4.2_

- [x] 12. Create `src/components/history/HistoryDetailSidebar.tsx`
  - [x] 12.1 Render all ticket fields as plain text (no `<select>` controls): Status (using `Badge`), Priority (using `Badge`), Assignee, Customer name and email, Created, Resolved At, Resolved By, Tags; render a "Reopen" button at the top of the sidebar that calls an `onReopen` callback prop
    - Props: `{ ticket: HistoryTicket; onReopen: () => void }`
    - _Requirements: 4.2, 4.3_

- [x] 13. Create `src/components/history/ReopenModal.tsx`
  - [x] 13.1 Wrap the existing `Modal` component; render an assignee `<select>` using the same `ASSIGNEE_OPTIONS` list as `TicketDetailSidebar` (excluding the empty option — selection is required); render an optional `<textarea>` for the reason (max 1000 characters with visible character count); display a validation error adjacent to the assignee dropdown when form is submitted without a selection
    - Props: `{ isOpen: boolean; ticket: HistoryTicket; onClose: () => void; onSuccess: () => void }`
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 13.2 On submit: call `ticketHistoryService.reopenTicket(ticket.id, assignee)`, then dispatch `REOPEN_TICKET` to `TicketContext`; if a reason was entered call `ticketService.addComment` to add an internal comment on the reopened ticket; on success call `onSuccess()`; on failure display an inline error message; disable the submit button and assignee dropdown while the operation is in progress
    - _Requirements: 5.4, 5.5, 5.6, 5.8, 5.9_

- [x] 14. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 15. Create `src/pages/HistoryPage.tsx`
  - [x] 15.1 Compose `useHistoryFilter`, `useHistoryTickets`, `HistoryFilters`, `HistoryTable`, and `Pagination`; pass `dateError` to `HistoryFilters`; render an inline error message when `useHistoryTickets` returns a non-null `error`; render within the existing page layout pattern using `PageHeader`
    - Route: `/history`
    - _Requirements: 2.1, 2.2, 2.5, 2.6, 2.7, 2.8, 3.1–3.7_

- [x] 16. Create `src/pages/HistoryDetailPage.tsx`
  - [x] 16.1 Read `:id` from `useParams`; fetch the history ticket via `ticketHistoryService.getHistoryTicket(id)` on mount; render `HistoryDetailHeader`, `Timeline` (read-only, no new comment form), and `HistoryDetailSidebar`; when `onReopen` is triggered open `ReopenModal`; after `onSuccess` navigate to `/history`
    - Route: `/history/:id`
    - _Requirements: 4.1, 4.2, 4.3, 5.7_
  - [x] 16.2 Render a not-found `EmptyState` with a "← Back to History" link when `getHistoryTicket` returns `undefined`
    - _Requirements: 4.4_

- [x] 17. Update `src/components/layout/Sidebar.tsx`
  - [x] 17.1 Add an `IconArchive` inline SVG function (heroicons archive-box style) and append `{ path: '/history', label: 'History', Icon: IconArchive, end: false }` to `NAV_ITEMS`; no other structural changes needed — existing `NavLink` rendering handles collapsed mode and active highlighting automatically
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 18. Update `src/App.tsx`
  - [x] 18.1 Import `HistoryPage` and `HistoryDetailPage`; add `<Route path="/history" element={<HistoryPage />} />` and `<Route path="/history/:id" element={<HistoryDetailPage />} />` inside the existing `<Routes>` block within `<AppShell>`
    - _Requirements: 2.1, 4.1_

- [x] 19. Update `src/components/ticket-detail/TicketDetailSidebar.tsx`
  - [x] 19.1 Import `ticketHistoryService` and the `useTicketContext` dispatch; modify `handleStatusChange` so that when `newStatus === 'Resolved' || 'Closed'`, after the user confirms, it calls `ticketHistoryService.moveTicketToHistory(ticket.id, ticket.assignee)` via an async flow: on success dispatch `REMOVE_TICKET` and navigate to `/tickets`; on failure show a Toast error and leave the ticket status unchanged (do NOT call `ticketService.updateTicket` for terminal statuses)
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6_

- [x] 20. Final Checkpoint — Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All property tests use [fast-check](https://github.com/dubzzz/fast-check) — add it as a dev dependency (`npm install --save-dev fast-check`) if not already present
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties; unit tests validate specific examples and edge cases
- The Supabase database (table, RLS, RPCs) is already live — no database setup tasks are included

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.3", "3.1", "5.1"] },
    { "id": 2, "tasks": ["2.2", "2.4", "3.2", "3.3", "5.2", "6.1"] },
    { "id": 3, "tasks": ["3.4", "3.5", "3.6", "7.1"] },
    { "id": 4, "tasks": ["3.7", "3.8", "8.1", "10.1", "10.2"] },
    { "id": 5, "tasks": ["8.2", "9.1", "11.1", "12.1", "13.1"] },
    { "id": 6, "tasks": ["13.2", "15.1"] },
    { "id": 7, "tasks": ["16.1", "16.2", "17.1"] },
    { "id": 8, "tasks": ["18.1", "19.1"] }
  ]
}
```
