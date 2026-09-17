import { useMemo } from 'react';
import PageHeader from '../components/layout/PageHeader';
import StatCard from '../components/dashboard/StatCard';
import PriorityBreakdown from '../components/dashboard/PriorityBreakdown';
import { RecentTickets } from '../components/dashboard/RecentTickets';
import { useTicketContext } from '../context/TicketContext';

/**
 * Returns true when the ISO string falls on today's calendar date.
 */
function isToday(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}

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

  const resolvedTodayCount = useMemo(
    () =>
      tickets.filter(
        t => t.status === 'Resolved' && isToday(t.updatedAt)
      ).length,
    [tickets]
  );

  const avgAgeHrs = useMemo(() => {
    const openTickets = tickets.filter(t => t.status === 'Open');
    if (openTickets.length === 0) return 'N/A';
    const totalHrs = openTickets.reduce(
      (sum, t) =>
        sum + (Date.now() - new Date(t.createdAt).getTime()) / 3_600_000,
      0
    );
    return `${(totalHrs / openTickets.length).toFixed(1)} hrs`;
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
            description="Mean hours since creation"
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
