import { useTicketContext } from '../context/TicketContext';
import type { Ticket } from '../types';

export function useTicket(id: string): Ticket | undefined {
  const { state } = useTicketContext();
  return state.tickets.find(t => t.id === id);
}
