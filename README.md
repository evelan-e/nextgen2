# NextGen Support — Customer Support Dashboard

A browser-based customer support ticket management system built with React, TypeScript, and Supabase. Support agents can view, filter, create, and update tickets in real time — all backed by a live Supabase PostgreSQL database.

---

## Features

- **Ticket list** — paginated table with sort, search, and filter by status, priority, and assignee
- **Ticket detail** — full timeline of comments and system events, editable status / priority / assignee in the sidebar
- **New ticket** — modal form with validation that writes directly to Supabase
- **Comments** — add public replies or internal notes on any ticket
- **Dashboard** — stat cards and priority breakdown charts for an at-a-glance overview
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
|   |-- layout/          # AppShell, Sidebar, PageHeader
|   |-- ticket-detail/   # Timeline, comments, sidebar controls
|   |-- tickets/         # TicketTable, filters, search, NewTicketModal
|   +-- ui/              # Badge, Modal, Toast, EmptyState, LoadingSkeleton
|-- context/
|   |-- TicketContext.tsx # Global state provider
|   +-- ticketReducer.ts # Pure reducer for all ticket actions
|-- hooks/               # useTickets, useTicket, useFilterState, useSidebar
|-- lib/
|   +-- supabase.ts      # Supabase client (reads from .env)
|-- pages/               # DashboardPage, TicketsPage, TicketDetailPage, SettingsPage
|-- services/
|   +-- ticketService.ts # All Supabase queries
+-- types/
    +-- index.ts         # Ticket, Comment, SystemEvent, Priority, Status, FilterState
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

Run the following SQL in the Supabase SQL editor:

```sql
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

## Data Model

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
| comments | Comment[] | Stored as JSONB in Supabase |
| events | SystemEvent[] | Audit trail, stored as JSONB |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| VITE_SUPABASE_URL | Yes | Your Supabase project URL |
| VITE_SUPABASE_ANON_KEY | Yes | Your Supabase anon public key |

These must be prefixed with `VITE_` to be exposed to the browser by Vite.
