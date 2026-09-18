import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/layout/PageHeader';
import StatCard from '../components/dashboard/StatCard';
import PriorityBreakdown from '../components/dashboard/PriorityBreakdown';
import { RecentTickets } from '../components/dashboard/RecentTickets';
import { useTicketContext } from '../context/TicketContext';
import { supabase } from '../lib/supabase';

/**
 * Dashboard overview page — KPI stat cards.
 * Requirements: 11.1, 11.2
 */
export default function DashboardPage() {
  const { state } = useTicketContext();
  const { tickets } = state;

  const openCount = useMemo(
    () => tickets.filter(t => t.status === 'Open').length,
    [tickets]
  );

  const unassignedCount = useMemo(
    () => tickets.filter(t => !t.assignee).length,
    [tickets]
  );

  const [resolvedTodayCount, setResolvedTodayCount] = useState(0);

  useEffect(() => {
    // Start of today in UTC
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    supabase
      .from('ticket_history')
      .select('id', { count: 'exact', head: true })
      .gte('resolved_at', startOfToday.toISOString())
      .then(({ count }) => {
        if (count !== null) setResolvedTodayCount(count);
      });
  }, []);

  const avgAgeHrs = useMemo(() => {
    const activeTickets = tickets.filter(
      t => t.status !== 'Resolved' && t.status !== 'Closed'
    );
    if (activeTickets.length === 0) return 'N/A';
    const totalHrs = activeTickets.reduce(
      (sum, t) =>
        sum + (Date.now() - new Date(t.createdAt).getTime()) / 3_600_000,
      0
    );
    return `${(totalHrs / activeTickets.length).toFixed(1)} hrs`;
  }, [tickets]);

  return (
    <div>
      <PageHeader title="Dashboard" />
      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Open Tickets"
            value={openCount}
            description="Currently open"
          />
          <StatCard
            title="Unassigned"
            value={unassignedCount}
            description="No assignee yet"
          />
          <StatCard
            title="Resolved Today"
            value={resolvedTodayCount}
            description="Closed since midnight"
          />
          <StatCard
            title="Avg Age (Open)"
            value={avgAgeHrs}
            description="Mean age of active tickets"
          />
        </div>

        {/* Secondary widgets row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <PriorityBreakdown tickets={tickets} />
          <RecentTickets tickets={tickets} />
        </div>
      </div>
    </div>
  );
}
