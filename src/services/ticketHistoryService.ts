import { supabase } from '../lib/supabase';
import type { HistoryTicket, HistoryFilter, Priority, Comment, SystemEvent } from '../types';

// ---------------------------------------------------------------------------
// Row shape returned by Supabase (snake_case)
// ---------------------------------------------------------------------------

interface HistoryRow {
  id: string;
  subject: string;
  customer_name: string;
  customer_email: string;
  priority: Priority;
  status: 'Resolved' | 'Closed';
  assignee: string;
  description: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  comments: Comment[];
  events: SystemEvent[];
  resolved_at: string;
  resolved_by: string;
}

// ---------------------------------------------------------------------------
// Mapping: DB row → HistoryTicket (camelCase)
// ---------------------------------------------------------------------------

function rowToHistoryTicket(row: HistoryRow): HistoryTicket {
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
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by,
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const ticketHistoryService = {
  // ── Move an active ticket into history ────────────────────────────────────
  async moveTicketToHistory(
    ticketId: string,
    assignee: string,
    newStatus: 'Resolved' | 'Closed'
  ): Promise<void> {
    // Write the terminal status first so the RPC copies the correct status
    const { error: updateError } = await supabase
      .from('tickets')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    if (updateError) throw new Error(updateError.message);

    const resolvedAt = new Date().toISOString();
    const resolvedBy = assignee.trim() || 'unassigned';

    const { error } = await supabase.rpc('move_ticket_to_history', {
      p_ticket_id: ticketId,
      p_resolved_at: resolvedAt,
      p_resolved_by: resolvedBy,
    });

    if (error) throw new Error(error.message);
  },

  // ── List history tickets with filters ─────────────────────────────────────
  async listHistory(filter: HistoryFilter): Promise<HistoryTicket[]> {
    let query = supabase
      .from('ticket_history')
      .select('*')
      .order('resolved_at', { ascending: false })
      .limit(100);

    if (filter.fromDate) query = query.gte('resolved_at', filter.fromDate);
    if (filter.toDate)   query = query.lte('resolved_at', filter.toDate + 'T23:59:59Z');
    if (filter.priority) query = query.eq('priority', filter.priority);
    if (filter.assignee) query = query.eq('assignee', filter.assignee);
    if (filter.search)   query = query.or(
      `subject.ilike.%${filter.search}%,customer_name.ilike.%${filter.search}%`
    );

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as HistoryRow[]).map(rowToHistoryTicket);
  },

  // ── Get a single history ticket by ID ─────────────────────────────────────
  async getHistoryTicket(id: string): Promise<HistoryTicket | undefined> {
    const { data, error } = await supabase
      .from('ticket_history')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(error.message);
    }
    return rowToHistoryTicket(data as HistoryRow);
  },

  // ── Get distinct assignee values from ticket_history ──────────────────────
  async listAssignees(): Promise<string[]> {
    const { data, error } = await supabase
      .from('ticket_history')
      .select('assignee');

    if (error) throw new Error(error.message);
    const unique = Array.from(
      new Set((data as { assignee: string }[]).map(r => r.assignee).filter(Boolean))
    );
    return unique.sort();
  },

  // ── Reopen a history ticket as an active Open ticket ──────────────────────
  async reopenTicket(ticketId: string, assignee: string): Promise<void> {
    const { error } = await supabase.rpc('reopen_ticket', {
      p_ticket_id: ticketId,
      p_assignee: assignee,
      p_reason: '',
    });

    if (error) throw new Error(error.message);
  },
};

export default ticketHistoryService;
