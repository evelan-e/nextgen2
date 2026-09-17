import type { Ticket, Comment, SystemEvent } from '../types';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export interface TicketState {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
}

export const initialState: TicketState = {
  tickets: [],
  loading: false,
  error: null,
};

// ---------------------------------------------------------------------------
// Action union
// ---------------------------------------------------------------------------

export type TicketAction =
  | { type: 'LOAD_TICKETS'; payload: Ticket[] }
  | { type: 'ADD_TICKET'; payload: Ticket }
  | { type: 'UPDATE_TICKET'; payload: Ticket }
  | { type: 'ADD_COMMENT'; ticketId: string; comment: Comment }
  | { type: 'ADD_EVENT'; ticketId: string; event: SystemEvent }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string };

// ---------------------------------------------------------------------------
// Pure reducer
// ---------------------------------------------------------------------------

export function ticketReducer(
  state: TicketState,
  action: TicketAction
): TicketState {
  switch (action.type) {
    case 'LOAD_TICKETS':
      return { ...state, tickets: action.payload, loading: false, error: null };

    case 'ADD_TICKET':
      // Prepend the new ticket so it appears at the top of the list
      return { ...state, tickets: [action.payload, ...state.tickets] };

    case 'UPDATE_TICKET':
      return {
        ...state,
        tickets: state.tickets.map(t =>
          t.id === action.payload.id ? action.payload : t
        ),
      };

    case 'ADD_COMMENT':
      return {
        ...state,
        tickets: state.tickets.map(t => {
          if (t.id !== action.ticketId) return t;
          return {
            ...t,
            comments: [...t.comments, action.comment],
            updatedAt: new Date().toISOString(),
          };
        }),
      };

    case 'ADD_EVENT':
      return {
        ...state,
        tickets: state.tickets.map(t => {
          if (t.id !== action.ticketId) return t;
          return {
            ...t,
            events: [...t.events, action.event],
            updatedAt: new Date().toISOString(),
          };
        }),
      };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    default:
      return state;
  }
}
