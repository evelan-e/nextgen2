import { supabase } from '../lib/supabase';
import type { Ticket, Comment, Priority, Status, SystemEvent } from '../types';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateTicketInput {
  subject: string;
  customerName: string;
  customerEmail: string;
  priority: Priority;
  description?: string;
}

// ---------------------------------------------------------------------------
// ID generators (still exported — AddComment.tsx and TicketDetailSidebar.tsx
// import these to build optimistic local objects before persisting)
// ---------------------------------------------------------------------------

export function generateCommentId(): string {
  return `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function generateEventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ---------------------------------------------------------------------------
// Row shape returned by Supabase (snake_case)
// ---------------------------------------------------------------------------

interface TicketRow {
  id: string;
  subject: string;
  customer_name: string;
  customer_email: string;
  priority: Priority;
  status: Status;
  assignee: string;
  description: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  comments: Comment[];
  events: SystemEvent[];
}

// ---------------------------------------------------------------------------
// Mapping: DB row → Ticket (camelCase)
// ---------------------------------------------------------------------------

function rowToTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    subject: row.subject,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    priority: row.priority,
    status: row.status,
    assignee: row.assignee ?? '',
    description: row.description ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: row.tags ?? [],
    comments: row.comments ?? [],
    events: row.events ?? [],
  };
}

// ---------------------------------------------------------------------------
// Mapping: Ticket patch (camelCase) → DB column names (snake_case)
// Only maps the fields that are actual DB columns; ignores nested arrays
// that are stored as JSONB and can be passed through directly.
// ---------------------------------------------------------------------------

function patchToRow(patch: Partial<Ticket>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.subject !== undefined)       row['subject']        = patch.subject;
  if (patch.customerName !== undefined)  row['customer_name']  = patch.customerName;
  if (patch.customerEmail !== undefined) row['customer_email'] = patch.customerEmail;
  if (patch.priority !== undefined)      row['priority']       = patch.priority;
  if (patch.status !== undefined)        row['status']         = patch.status;
  if (patch.assignee !== undefined)      row['assignee']       = patch.assignee;
  if (patch.description !== undefined)   row['description']    = patch.description;
  if (patch.tags !== undefined)          row['tags']           = patch.tags;
  if (patch.comments !== undefined)      row['comments']       = patch.comments;
  if (patch.events !== undefined)        row['events']         = patch.events;
  // always bump updated_at on any patch
  row['updated_at'] = new Date().toISOString();
  return row;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const ticketService = {
  // ── List all tickets ──────────────────────────────────────────────────────
  async listTickets(): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data as TicketRow[]).map(rowToTicket);
  },

  // ── Get a single ticket ───────────────────────────────────────────────────
  async getTicket(id: string): Promise<Ticket | undefined> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // PostgREST returns PGRST116 when no row is found — treat as undefined
      if (error.code === 'PGRST116') return undefined;
      throw new Error(error.message);
    }
    return rowToTicket(data as TicketRow);
  },

  // ── Create a ticket ───────────────────────────────────────────────────────
  async createTicket(input: CreateTicketInput): Promise<Ticket> {
    const now = new Date().toISOString();
    // Generate a sequential-style ID client-side so the UI keeps TKT-XXXX format.
    // The DB id column is text, so any unique string is valid.
    const id = `TKT-${String(Date.now()).slice(-6)}`;

    const row = {
      id,
      subject: input.subject,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      priority: input.priority,
      status: 'Open' as Status,
      assignee: '',
      description: input.description ?? '',
      created_at: now,
      updated_at: now,
      tags: [],
      comments: [],
      events: [],
    };

    const { data, error } = await supabase
      .from('tickets')
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return rowToTicket(data as TicketRow);
  },

  // ── Update a ticket ───────────────────────────────────────────────────────
  async updateTicket(id: string, patch: Partial<Ticket>): Promise<Ticket> {
    const { data, error } = await supabase
      .from('tickets')
      .update(patchToRow(patch))
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return rowToTicket(data as TicketRow);
  },

  // ── Add a comment ─────────────────────────────────────────────────────────
  // Comments are stored as a JSONB array on the ticket row.
  async addComment(
    ticketId: string,
    commentInput: Omit<Comment, 'id' | 'createdAt'>
  ): Promise<Comment> {
    // Fetch current comments first so we can append
    const ticket = await this.getTicket(ticketId);
    if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

    const comment: Comment = {
      ...commentInput,
      id: generateCommentId(),
      createdAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('tickets')
      .update({
        comments: [...ticket.comments, comment],
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    if (error) throw new Error(error.message);
    return comment;
  },
};

export default ticketService;
