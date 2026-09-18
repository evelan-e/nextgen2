# Requirements Document

## Introduction

The Resolved Ticket History feature provides support agents with a dedicated area to browse and manage tickets that have reached a terminal state (Resolved or Closed). Active tickets pile up when resolved work is never removed from the main list, making it harder for agents to focus on open work. This feature moves Resolved and Closed tickets into a separate `ticket_history` table in Supabase, exposes them at a new `/history` route, and allows agents to reopen any history ticket back to Open when needed.

## Glossary

- **History_Ticket**: A ticket record stored in the `ticket_history` table. It carries all original ticket fields plus `resolved_at` (the timestamp the ticket became Resolved or Closed) and `resolved_by` (the agent who made the change).
- **Active_Ticket**: A ticket record stored in the `tickets` table with status `Open`, `In Progress`, or `Waiting on Customer`.
- **Move_Operation**: The atomic database transaction that inserts a record into `ticket_history` and deletes the corresponding record from `tickets` in a single Supabase RPC call.
- **Reopen_Operation**: The operation that inserts a History_Ticket back into `tickets` as an Open Active_Ticket and deletes the source record from `ticket_history`.
- **History_Page**: The `/history` route and its associated UI, which renders the list of History_Tickets and the read-only detail view.
- **History_Service**: The client-side service module (`src/services/ticketHistoryService.ts`) responsible for all interactions with the `ticket_history` table.
- **Reopen_Modal**: The dialog that collects the required assignee and an optional reason comment before executing a Reopen_Operation.
- **Status_Badge**: The colored label that displays the current status value of a ticket or history ticket.
- **History_Filter**: The set of filter controls on the History_Page: date range (from/to), priority, assignee, and text search.

---

## Requirements

### Requirement 1: Move Resolved and Closed Tickets to History

**User Story:** As a support agent, I want Resolved and Closed tickets to be automatically moved out of the active ticket list, so that I can focus on tickets that still need attention.

#### Acceptance Criteria

1. WHEN a ticket's status is changed to `Resolved` or `Closed`, THE History_Service SHALL execute a Move_Operation that atomically inserts the ticket into `ticket_history` and deletes it from `tickets`, completing both operations within a single database transaction.
2. WHEN the Move_Operation completes successfully, THE TicketContext SHALL dispatch a `REMOVE_TICKET` action that removes the ticket from the active in-memory list by its ID within 500 milliseconds of the database transaction committing.
3. IF the Move_Operation fails for any reason, THEN THE System SHALL display an error message indicating the move failed, leave the ticket record unchanged in `tickets`, make no insertion into `ticket_history`, and retain the ticket's prior status in the active in-memory list.
4. THE `ticket_history` table SHALL store all columns present in `tickets` plus a `resolved_at` timestamptz column and a `resolved_by` text column of at most 255 characters.
5. WHEN a Move_Operation is executed, THE History_Service SHALL populate `resolved_at` with the current UTC timestamp and `resolved_by` with the assignee's name at the time of resolution, or with the string `"unassigned"` if no assignee is set.
6. IF a ticket being moved has no assignee at the time of resolution, THEN THE History_Service SHALL set `resolved_by` to `"unassigned"` and SHALL NOT abort the Move_Operation.

---

### Requirement 2: Display History Tickets on a Dedicated Page

**User Story:** As a support agent, I want a dedicated History page at `/history`, so that I can review all past Resolved and Closed tickets in one place.

#### Acceptance Criteria

1. THE History_Page SHALL be accessible at the `/history` route and rendered within the existing application shell.
2. WHEN the History_Page mounts, THE History_Service SHALL fetch the most recent 100 History_Tickets from `ticket_history` ordered by `resolved_at` descending.
3. THE History_Page SHALL display History_Tickets in a table with the following columns: Ticket ID, Subject, Customer Name, Priority, Status, Assignee, Resolved At, and Resolved By.
4. THE History_Page SHALL render a Status_Badge on each row that shows whether the ticket was `Resolved` or `Closed`.
5. WHILE the History_Page is loading History_Tickets, THE History_Page SHALL display exactly 5 loading skeleton rows in place of the table.
6. IF the History_Service fetch fails, THEN THE History_Page SHALL display an inline error message in place of the table.
7. IF the current History_Filter produces no matching results but `ticket_history` contains records, THEN THE History_Page SHALL display an empty-state message indicating no results match the current filter.
8. IF `ticket_history` contains no records at all, THEN THE History_Page SHALL display an empty-state message indicating no tickets have been resolved yet.

---

### Requirement 3: Filter and Search History Tickets

**User Story:** As a support agent, I want to filter and search the history list, so that I can quickly find a specific past ticket.

#### Acceptance Criteria

1. THE History_Page SHALL provide a date-range filter with a `from` date input and a `to` date input that restrict results to tickets whose `resolved_at` falls within the selected range (inclusive). IF `fromDate` is later than `toDate`, THEN THE History_Page SHALL display an inline validation error, disable re-querying, and not update the displayed results.
2. THE History_Page SHALL provide a priority dropdown filter with options `Low`, `Medium`, `High`, `Urgent`, and an "All" default that returns tickets of any priority.
3. THE History_Page SHALL provide an assignee dropdown filter that lists all distinct assignee values present in `ticket_history`, plus an "All" default. IF the assignee list cannot be loaded, THEN the dropdown SHALL show only the "All" option.
4. THE History_Page SHALL provide a text search input that filters History_Tickets whose `subject` or `customer_name` contains the entered text, using a case-insensitive substring match.
5. WHEN any non-text History_Filter value changes, THE History_Page SHALL immediately re-query the History_Service. WHEN the text search input changes, THE History_Page SHALL wait 300 milliseconds after the last keystroke before re-querying.
6. THE History_Service `listHistory` function SHALL accept a filter object containing `fromDate`, `toDate`, `priority`, `assignee`, and `search` fields and apply all non-empty fields as AND conditions in the database query.
7. IF the History_Service re-query returns no results, THEN THE History_Page SHALL display the empty-state message defined in Requirement 2, criterion 7.

---

### Requirement 4: View a History Ticket in Read-Only Detail

**User Story:** As a support agent, I want to click a history ticket row to see its full detail, so that I can review the complete context of a past interaction.

#### Acceptance Criteria

1. WHEN an agent clicks a row on the History_Page, THE History_Page SHALL navigate to `/history/:id` and render the full ticket detail including subject, description, customer information, priority, status, assignee, resolved_at, resolved_by, all comments, and all system events.
2. THE History_Page detail view SHALL be read-only — no status, priority, or assignee select controls SHALL be rendered or interactive.
3. THE History_Page detail view SHALL display a "Reopen" button that is always visible and enabled.
4. IF the `/history/:id` route is accessed directly and no History_Ticket with that ID exists, THEN THE History_Page SHALL display a not-found message and a link back to `/history`.

---

### Requirement 5: Reopen a History Ticket

**User Story:** As a support agent, I want to reopen a resolved or closed ticket, so that I can continue working on an issue that needs further attention.

#### Acceptance Criteria

1. WHEN an agent activates the "Reopen" button, THE Reopen_Modal SHALL open and display an assignee selection dropdown and an optional reason text input with a maximum of 1000 characters.
2. THE Reopen_Modal assignee dropdown SHALL list the same fixed set of agents available in the rest of the application and SHALL not allow submission without a selection.
3. WHEN the agent submits the Reopen_Modal without selecting an assignee, THE Reopen_Modal SHALL display a validation error adjacent to the assignee dropdown and prevent submission.
4. WHEN the agent submits the Reopen_Modal with a valid assignee, THE History_Service SHALL execute a Reopen_Operation that inserts the ticket into `tickets` with status `Open` and the selected assignee, then deletes the record from `ticket_history`.
5. WHEN the Reopen_Operation completes successfully, THE TicketContext SHALL dispatch a `REOPEN_TICKET` action that adds the reopened ticket to the active in-memory list.
6. WHEN the Reopen_Operation completes successfully and a reason was entered, THE System SHALL add an internal comment to the reopened ticket with the reason text, attributed to the agent who performed the reopen, not visible to customers.
7. WHEN the Reopen_Operation completes successfully, THE History_Page SHALL navigate back to `/history` and the reopened ticket SHALL no longer appear in the history list.
8. WHEN the Reopen_Operation fails, THE Reopen_Modal SHALL display an error message and leave both tables unchanged.
9. WHILE the Reopen_Operation is in progress, THE Reopen_Modal submit button and assignee dropdown SHALL be disabled to prevent duplicate submissions.

---

### Requirement 6: Active Ticket List Excludes History Tickets

**User Story:** As a support agent, I want the main Tickets page to show only active tickets, so that I don't see work that has already been resolved.

#### Acceptance Criteria

1. THE TicketsPage SHALL apply a default status filter that excludes tickets with status `Resolved` or `Closed` from the displayed results.
2. WHEN a ticket is moved to history via the Move_Operation, THE TicketsPage SHALL no longer display that ticket without requiring a page reload.
3. WHEN a ticket is reopened via the Reopen_Operation, THE TicketsPage SHALL display the reopened ticket without requiring a page reload.

---

### Requirement 7: Sidebar Navigation for History

**User Story:** As a support agent, I want a History link in the sidebar navigation, so that I can reach the History page from anywhere in the application.

#### Acceptance Criteria

1. THE Sidebar SHALL include a navigation link labelled "History" with an archive-style icon that navigates to `/history`.
2. WHILE the current route is `/history` or `/history/:id`, THE Sidebar SHALL apply the active highlight style to the History navigation link.
3. WHILE the Sidebar is in collapsed mode, THE Sidebar SHALL display only the History icon and use the label as the accessible `title` attribute on the link.

---

### Requirement 8: Data Persistence and Integrity

**User Story:** As a support team lead, I want history records to be stored permanently in Supabase with proper access controls, so that the audit trail is never lost.

#### Acceptance Criteria

1. THE `ticket_history` table SHALL retain all records indefinitely with no automatic expiry or archival window.
2. THE Move_Operation SHALL be implemented as a Supabase database RPC function so that the insert into `ticket_history` and the delete from `tickets` execute as a single atomic transaction.
3. IF the RPC function's insert step succeeds but its delete step fails, THEN THE database SHALL roll back the insert so that the ticket remains only in `tickets`.
4. THE `ticket_history` table SHALL have Row Level Security policies that permit `select`, `insert`, `update`, and `delete` operations for the `anon` role.
5. THE Reopen_Operation SHALL be implemented such that the insert into `tickets` and the delete from `ticket_history` execute atomically, preventing a ticket from existing in both tables simultaneously.
