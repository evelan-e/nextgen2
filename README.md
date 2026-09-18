# NextGen Support — Customer Support Dashboard

A browser-based customer support ticket management system built with React, TypeScript, and Supabase. Support agents can view, filter, create, update, and resolve tickets in real time — all backed by a live Supabase PostgreSQL database.

---

## Features

- **Ticket list** — paginated table with sort, search, and filter by status, priority, and assignee (Resolved/Closed tickets are hidden by default)
- **Ticket detail** — full timeline of comments and system events, editable status / priority / assignee in the sidebar
- **New ticket** — modal form with validation that writes directly to Supabase
- **Comments** — add public replies or internal notes on any ticket
- **Resolve/Close flow** — marking a ticket Resolved or Closed atomically moves it to a separate history table via a Supabase RPC transaction
- **Ticket history** — dedicated `/history` page showing all resolved/closed tickets with date range, priority, assignee, and text search filters
- **Reopen tickets** — any history ticket can be reopened back to Open with a required assignee selection and optional reason comment
- **Dashboard** — stat cards (including live Resolved Today count from history), priority breakdown, and recent tickets
- **Live data** — all reads and writes go to Supabase; no in-memory mock data

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Database | Supabase (PostgreSQL) |
| DB client | @supabase/supabase-js v2 |
| State | React Context + useReducer |

---

## Project Structure

```
src/
|-- components/
|   |-- dashboard/       # StatCard, PriorityBreakdown, RecentTickets
|   |-- history/         # HistoryTable, HistoryFilters, HistoryDetailHeader,
|   |                    # HistoryDetailSidebar, ReopenModal
|   |-- layout/          # AppShell, Sidebar, PageHeader
|   |-- ticket-detail/   # Timeline, AddComment, TicketDetailSidebar
|   |-- tickets/         # TicketTable, TicketFilters, TicketSearch, NewTicketModal
|   +-- ui/              # Badge, Modal, Toast, EmptyState, LoadingSkeleton
|-- context/
|   |-- TicketContext.tsx # Global state provider
|   +-- ticketReducer.ts # Pure reducer (LOAD, ADD, UPDATE, REMOVE, REOPEN tickets)
|-- hooks/               # useTickets, useTicket, useFilterState,
|                        # useHistoryFilter, useHistoryTickets
|-- lib/
|   +-- supabase.ts      # Supabase client (reads from .env)
|-- pages/               # DashboardPage, TicketsPage, TicketDetailPage,
|                        # HistoryPage, HistoryDetailPage, SettingsPage
|-- services/
|   |-- ticketService.ts        # CRUD for active tickets
|   +-- ticketHistoryService.ts # Queries for ticket_history table and RPCs
+-- types/
    +-- index.ts         # Ticket, HistoryTicket, Comment, SystemEvent,
                         # Priority, Status, FilterState, HistoryFilter
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root and fill in your credentials from the Supabase dashboard under **Project Settings > API**:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Set up the database

Run the following SQL in the Supabase SQL editor to create both tables, enable RLS, and create the two RPC functions that handle atomic ticket moves:

```sql
-- Active tickets table
create table public.tickets (
  id             text        primary key,
  subject        text        not null,
  customer_name  text        not null,
  customer_email text        not null,
  priority       text        not null check (priority in ('Low', 'Medium', 'High', 'Urgent')),
  status         text        not null check (status in ('Open', 'In Progress', 'Waiting on Customer', 'Resolved', 'Closed')),
  assignee       text        not null default '',
  description    text        not null default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  tags           text[]      not null default '{}',
  comments       jsonb       not null default '[]',
  events         jsonb       not null default '[]'
);

alter table public.tickets enable row level security;
create policy "anon can read tickets"   on public.tickets for select to anon using (true);
create policy "anon can insert tickets" on public.tickets for insert to anon with check (true);
create policy "anon can update tickets" on public.tickets for update to anon using (true);

-- Resolved/closed ticket history table
create table public.ticket_history (
  id             text        primary key,
  subject        text        not null,
  customer_name  text        not null,
  customer_email text        not null,
  priority       text        not null,
  status         text        not null,
  assignee       text        not null default '',
  description    text        not null default '',
  created_at     timestamptz not null,
  updated_at     timestamptz not null,
  tags           text[]      not null default '{}',
  comments       jsonb       not null default '[]',
  events         jsonb       not null default '[]',
  resolved_at    timestamptz not null,
  resolved_by    text        not null
);

alter table public.ticket_history enable row level security;
create policy "anon full access" on public.ticket_history for all to anon using (true) with check (true);

-- RPC: atomically move a ticket from tickets -> ticket_history
create or replace function move_ticket_to_history(
  p_ticket_id   text,
  p_resolved_at timestamptz,
  p_resolved_by text
)
returns void language plpgsql security definer as $$
declare
  v_ticket tickets%rowtype;
begin
  select * into v_ticket from tickets where id = p_ticket_id for update;
  if not found then
    raise exception 'Ticket % not found', p_ticket_id;
  end if;
  insert into ticket_history (
    id, subject, customer_name, customer_email, priority, status, assignee,
    description, created_at, updated_at, tags, comments, events, resolved_at, resolved_by
  ) values (
    v_ticket.id, v_ticket.subject, v_ticket.customer_name, v_ticket.customer_email,
    v_ticket.priority, v_ticket.status, v_ticket.assignee, v_ticket.description,
    v_ticket.created_at, v_ticket.updated_at, v_ticket.tags, v_ticket.comments,
    v_ticket.events, p_resolved_at, p_resolved_by
  );
  delete from tickets where id = p_ticket_id;
end;
$$;

-- RPC: atomically move a ticket from ticket_history -> tickets (reopen)
create or replace function reopen_ticket(
  p_ticket_id text,
  p_assignee  text,
  p_reason    text
)
returns void language plpgsql security definer as $$
declare
  v_hist ticket_history%rowtype;
  v_now  timestamptz := now();
begin
  select * into v_hist from ticket_history where id = p_ticket_id for update;
  if not found then
    raise exception 'History ticket % not found', p_ticket_id;
  end if;
  insert into tickets (
    id, subject, customer_name, customer_email, priority, status, assignee,
    description, created_at, updated_at, tags, comments, events
  ) values (
    v_hist.id, v_hist.subject, v_hist.customer_name, v_hist.customer_email,
    v_hist.priority, 'Open', p_assignee, v_hist.description,
    v_hist.created_at, v_now, v_hist.tags, v_hist.comments, v_hist.events
  );
  delete from ticket_history where id = p_ticket_id;
end;
$$;
```

### 4. Start the dev server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the project |

---

## Data Models

### Ticket (active queue — `tickets` table)

| Field | Type | Notes |
|---|---|---|
| id | string | Format: TKT-XXXX |
| subject | string | One-line summary |
| customerName | string | |
| customerEmail | string | |
| priority | Low / Medium / High / Urgent | |
| status | Open / In Progress / Waiting on Customer / Resolved / Closed | |
| assignee | string | Agent name, empty if unassigned |
| description | string | Full issue description |
| createdAt | string | ISO 8601 |
| updatedAt | string | ISO 8601 |
| tags | string[] | Free-form labels |
| comments | Comment[] | Stored as JSONB |
| events | SystemEvent[] | Audit trail, stored as JSONB |

### HistoryTicket (resolved/closed — `ticket_history` table)

All fields from Ticket, plus:

| Field | Type | Notes |
|---|---|---|
| resolvedAt | string | ISO 8601 — when moved to history |
| resolvedBy | string | Assignee name at time of resolution |

---

## How Ticket Resolution Works

1. Agent opens a ticket detail and changes status to **Resolved** or **Closed**
2. The app first writes the new status to the `tickets` table
3. The `move_ticket_to_history` Supabase RPC then atomically copies the full row to `ticket_history` and deletes it from `tickets` — both in one transaction
4. The ticket disappears from the active list immediately (no page reload needed)
5. The **History** page at `/history` shows all resolved/closed tickets
6. Any history ticket can be **reopened** — the `reopen_ticket` RPC moves it back to `tickets` with status `Open`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| VITE_SUPABASE_URL | Yes | Your Supabase project URL |
| VITE_SUPABASE_ANON_KEY | Yes | Your Supabase anon public key |

These must be prefixed with `VITE_` to be exposed to the browser by Vite.
