# Requirements Document

## Introduction

A single-page customer support dashboard built with React 18 + TypeScript, Vite, Tailwind CSS, and React Router. The application uses an in-memory mock data layer behind `src/services/ticketService.ts` and shares state across views via React Context + useReducer. It provides ticket management, inline editing, a comment/activity timeline, and a summary dashboard — all client-side with no backend dependency.

## Glossary

- **App**: The customer support dashboard single-page application.
- **Sidebar**: The fixed left navigation panel, 240 px wide when expanded and ~56 px wide (icon-only) when collapsed.
- **TicketService**: The service module at `src/services/ticketService.ts` that encapsulates all data access and mutation operations against the in-memory mock store.
- **Store**: The global React Context + useReducer state container that holds all ticket data and exposes dispatch actions to every view.
- **Ticket**: A support request record containing ID, Subject, Customer name, Customer email, Priority, Status, Assignee, Description, Created timestamp, Updated timestamp, and Tags.
- **Comment**: A user-authored entry attached to a Ticket, containing author name, author initials, body text, timestamp, and a type of either `public` (customer-facing reply) or `internal` (internal note).
- **SystemEvent**: An automatically generated timeline entry recording a property change on a Ticket, containing the changed field, old value, new value, and timestamp.
- **Timeline**: The merged, chronologically ordered sequence of Comments and SystemEvents displayed on the Ticket detail view.
- **Priority**: An enumerated ticket field with values Low, Medium, High, and Urgent.
- **Status**: An enumerated ticket field with values Open, In Progress, Waiting on Customer, Resolved, and Closed.
- **Badge**: A small, color-coded UI label used to display Priority and Status values.
- **Toast**: A transient, non-blocking notification message displayed to the user after a successful operation.
- **LoadingSkeleton**: An animated placeholder UI shown while data is being resolved from TicketService.
- **EmptyState**: A UI message shown when a filtered query returns zero results or a requested resource is not found.
- **FilterState**: The combined set of active Status filter, Priority filter, Assignee filter, and text search string applied to the ticket list.
- **DeepLink**: A URL that encodes enough state (route path and query parameters) to reproduce a specific view on reload or when shared.
- **Pagination**: Client-side division of ticket list results into pages of 10 rows each.

---

## Requirements

### Requirement 1 — Application Shell and Layout

**User Story:** As a support agent, I want a consistent shell layout with a sidebar and content area, so that I can navigate the application without losing context.

#### Acceptance Criteria

1. THE App SHALL render a fixed left Sidebar alongside a main content area that fills the remaining viewport width.
2. THE Sidebar SHALL be 240 px wide when expanded.
3. WHEN the viewport width is less than 768 px, THE Sidebar SHALL collapse to an icon-only state approximately 56 px wide.
4. WHEN the Sidebar is collapsed, THE App SHALL display only navigation icons without text labels.
5. THE Sidebar SHALL display the product name or logo at the top of the navigation panel.
6. THE Sidebar SHALL display the current user's avatar initials and name at the bottom of the navigation panel.
7. THE main content area SHALL display a page header above a content region for each route.

---

### Requirement 2 — Sidebar Navigation

**User Story:** As a support agent, I want a navigation sidebar with clear route links, so that I can move between sections of the app without a full page reload.

#### Acceptance Criteria

1. THE Sidebar SHALL display navigation items for Dashboard, Tickets, Customers, and Settings, each accompanied by an icon.
2. WHEN a user activates a Sidebar navigation item, THE App SHALL navigate to the corresponding route using client-side routing without a full page reload.
3. WHILE a route is active, THE Sidebar SHALL apply a distinct visual highlight to the corresponding navigation item.
4. THE App SHALL render full content for the Dashboard route (`/`) and the Tickets route (`/tickets`).
5. THE App SHALL render placeholder content for the Customers and Settings routes.

---

### Requirement 3 — Mock Data Layer and Global Store

**User Story:** As a developer, I want a swappable service module backed by a global state store, so that all views reflect mutations immediately and the data layer can be replaced with a real API later.

#### Acceptance Criteria

1. THE TicketService SHALL expose functions for listing tickets, retrieving a single ticket by ID, creating a ticket, updating ticket properties, and appending a Comment.
2. THE TicketService SHALL be seeded with 15 mock Tickets on application initialisation, each containing 2–4 existing Comments with realistic data.
3. THE Store SHALL initialise by loading all Tickets from TicketService on application mount.
4. WHEN a mutation operation is performed (create, update, or comment), THE Store SHALL update its state so that all subscribed components reflect the change without a manual refresh.
5. THE TicketService SHALL return data asynchronously (e.g., via a resolved Promise) so that it can be replaced by a real API call without changing call sites.

---

### Requirement 4 — Ticket List View

**User Story:** As a support agent, I want to see all tickets in a sortable, filterable table, so that I can find and prioritise work quickly.

#### Acceptance Criteria

1. THE App SHALL render the ticket list at route `/tickets`.
2. THE ticket list SHALL display columns for Ticket ID, Subject, Customer, Priority, Status, Assigned To, and Updated.
3. THE ticket list SHALL render Priority and Status values as color-coded Badges.
4. WHEN data is being resolved from TicketService, THE App SHALL display a LoadingSkeleton in place of the ticket rows.
5. WHEN the active FilterState matches no Tickets, THE App SHALL display an EmptyState message.
6. THE ticket list SHALL support client-side Pagination with 10 rows per page.
7. WHEN a user activates a ticket row, THE App SHALL navigate to `/tickets/:id` for the selected Ticket.

---

### Requirement 5 — Filtering, Sorting, and Search

**User Story:** As a support agent, I want to filter, sort, and search the ticket list, so that I can narrow down to relevant tickets efficiently.

#### Acceptance Criteria

1. THE ticket list SHALL support filtering by Status, filtering by Priority, and filtering by Assignee independently and in combination.
2. THE ticket list SHALL support a text search that matches against the Subject and Customer name fields of each Ticket.
3. THE ticket list SHALL support ascending and descending sort by the Updated column and by the Priority column.
4. WHEN a user applies any combination of filters, sort, or search, THE App SHALL compose all active criteria simultaneously to produce a single result set.
5. WHEN a user applies a filter, sort order, or search term, THE App SHALL synchronise the active FilterState to URL query parameters.
6. WHEN a user navigates directly to a `/tickets` URL containing query parameters, THE App SHALL restore the FilterState from those parameters on load, producing a DeepLink.

---

### Requirement 6 — New Ticket Modal

**User Story:** As a support agent, I want a modal form to create new tickets, so that I can log incoming requests without leaving the ticket list.

#### Acceptance Criteria

1. THE ticket list page header SHALL display a "New Ticket" primary action button.
2. WHEN a user activates the "New Ticket" button, THE App SHALL open a modal form.
3. THE modal form SHALL contain fields for Subject (text input, required), Customer name (text input, required), Email (text input, required), Priority (select, defaults to Medium), and Description (textarea, optional).
4. THE modal form SHALL display inline validation error messages adjacent to each invalid field when the user attempts to submit.
5. THE modal form SHALL validate that the Email field contains a properly formatted email address.
6. WHILE the modal form contains one or more validation errors, THE App SHALL keep the Save action disabled.
7. WHEN a user submits a valid modal form, THE App SHALL generate a sequential Ticket ID, set Status to Open, set Created and Updated to the current timestamp, prepend the new Ticket to the ticket list, close the modal, and display a success Toast.
8. WHEN a user activates the Cancel action or presses the Escape key, THE App SHALL close the modal without saving any data.
9. THE modal SHALL trap keyboard focus within its boundaries while open and SHALL be operable using only a keyboard.

---

### Requirement 7 — Ticket Detail View

**User Story:** As a support agent, I want to view all information about a ticket on a dedicated page, so that I can understand its history and context.

#### Acceptance Criteria

1. THE App SHALL render the ticket detail view at route `/tickets/:id`.
2. THE ticket detail view SHALL be a DeepLink: loading the route directly or after a page refresh SHALL display the correct Ticket.
3. THE ticket detail view header SHALL display the Ticket ID, Subject, and current Status and Priority Badges.
4. THE ticket detail view header SHALL display a back link that navigates to the ticket list and restores the FilterState the user had before entering the detail view.
5. THE ticket detail view SHALL display a left/main column containing the Ticket description followed by the Timeline.
6. THE ticket detail view SHALL display a right sidebar panel containing Customer name, Customer email, Assignee, Priority, Created timestamp, Last Updated timestamp, and Tags.
7. IF the requested Ticket ID does not exist, THEN THE App SHALL display a 404-style EmptyState in place of the ticket detail content.

---

### Requirement 8 — Activity Timeline

**User Story:** As a support agent, I want to see comments and property changes interleaved in time order, so that I can follow the full history of a ticket in one place.

#### Acceptance Criteria

1. THE Timeline SHALL display all Comments and SystemEvents for the Ticket in a single chronological sequence ordered by timestamp ascending.
2. THE Timeline SHALL visually distinguish internal note Comments from public reply Comments.
3. THE Timeline SHALL render each Comment with the author name, author avatar initials, a relative timestamp, and the comment body.
4. THE Timeline SHALL render each SystemEvent with a description of the changed field, old value, and new value.

---

### Requirement 9 — Add Comment

**User Story:** As a support agent, I want to add comments to a ticket from the detail view, so that I can communicate updates or internal notes.

#### Acceptance Criteria

1. THE ticket detail view SHALL display a comment input area pinned at the bottom of the Timeline section, containing a textarea, a "Reply" submit button, and a toggle to select between "Internal note" and "Public reply" comment types.
2. WHEN a user submits a non-empty comment, THE App SHALL optimistically append the Comment to the Timeline, clear the textarea, scroll the new Comment into view, and update the Ticket's Updated timestamp.
3. IF a user attempts to submit a comment with an empty or whitespace-only textarea, THEN THE App SHALL display an inline validation message and SHALL NOT append a Comment.
4. WHEN a user presses Cmd+Enter or Ctrl+Enter while the textarea is focused, THE App SHALL submit the comment.

---

### Requirement 10 — Inline Property Editing

**User Story:** As a support agent, I want to update ticket properties directly from the detail view, so that I can manage ticket state without a separate form.

#### Acceptance Criteria

1. THE ticket detail sidebar SHALL render Status, Priority, and Assignee as interactive dropdown controls.
2. WHEN a user selects a new value from a dropdown, THE App SHALL immediately persist the change to the Store, append a SystemEvent to the Timeline, and display a brief confirmation to the user.
3. WHEN a user changes Status to Resolved or Closed, THE App SHALL display a confirmation prompt before applying the change.
4. WHEN a property change is saved, THE App SHALL update the corresponding Ticket in the Store so that the ticket list view reflects the new value without a manual refresh.

---

### Requirement 11 — Dashboard Overview

**User Story:** As a support manager, I want a dashboard with summary statistics, so that I can assess the team's current workload at a glance.

#### Acceptance Criteria

1. THE App SHALL render the dashboard overview at route `/`.
2. THE dashboard SHALL display stat cards for: count of Open tickets, count of Unassigned tickets, count of tickets Resolved today, and average age in hours of Open tickets.
3. THE dashboard SHALL display a breakdown of Open tickets grouped by Priority.
4. THE dashboard SHALL display a list of the 5 most recently updated Tickets, each rendered as a link to the corresponding ticket detail view.
5. THE dashboard SHALL derive all displayed figures from the same Store data used by the ticket list, not from hardcoded values.

---

### Requirement 12 — Accessibility and Keyboard Navigation

**User Story:** As a support agent using keyboard navigation, I want all interactive elements to be reachable and operable without a mouse, so that the app is usable with assistive technologies.

#### Acceptance Criteria

1. THE App SHALL ensure every interactive element (links, buttons, inputs, dropdowns, toggles) is reachable via sequential keyboard navigation using the Tab key.
2. THE App SHALL display a visible focus indicator on every focused interactive element.
3. THE modal form SHALL trap keyboard focus within its boundaries while open, preventing focus from reaching elements outside the modal.
4. THE App SHALL provide appropriate ARIA roles, labels, or descriptions for Badges, Toasts, and modal dialogs.

---

### Requirement 13 — Responsive Layout

**User Story:** As a support agent on a smaller screen, I want the layout and ticket table to remain usable, so that I can work effectively without a large monitor.

#### Acceptance Criteria

1. WHEN the viewport width is less than 768 px, THE Sidebar SHALL render in its collapsed (icon-only) state by default.
2. WHEN the viewport width is less than 768 px, THE ticket list SHALL remain horizontally scrollable or otherwise adapted so that all columns are accessible without breaking the page layout.
