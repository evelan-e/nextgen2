import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ticketReducer, initialState } from './ticketReducer';
import type { TicketState, TicketAction } from './ticketReducer';
import ticketService from '../services/ticketService';

// ---------------------------------------------------------------------------
// Context value shape
// ---------------------------------------------------------------------------

export interface TicketContextValue {
  state: TicketState;
  dispatch: React.Dispatch<TicketAction>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const TicketContext = createContext<TicketContextValue | undefined>(
  undefined
);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function TicketProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(ticketReducer, initialState);

  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
    ticketService
      .listTickets()
      .then(tickets => {
        dispatch({ type: 'LOAD_TICKETS', payload: tickets });
      })
      .catch(err => {
        dispatch({
          type: 'SET_ERROR',
          payload: err instanceof Error ? err.message : 'Failed to load tickets',
        });
      });
  }, []);

  return (
    <TicketContext.Provider value={{ state, dispatch }}>
      {children}
    </TicketContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTicketContext(): TicketContextValue {
  const ctx = useContext(TicketContext);
  if (ctx === undefined) {
    throw new Error('useTicketContext must be used within a TicketProvider');
  }
  return ctx;
}
