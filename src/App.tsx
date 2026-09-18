import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TicketProvider } from './context/TicketContext';
import AppShell from './components/layout/AppShell';
import EmptyState from './components/ui/EmptyState';
import DashboardPage from './pages/DashboardPage';
import TicketsPage from './pages/TicketsPage';
import TicketDetailPage from './pages/TicketDetailPage';
import SettingsPage from './pages/SettingsPage';
import HistoryPage from './pages/HistoryPage';
import HistoryDetailPage from './pages/HistoryDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <TicketProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/history/:id" element={<HistoryDetailPage />} />
            <Route
              path="*"
              element={
                <EmptyState
                  message="Page not found"
                  description="The page you are looking for does not exist."
                />
              }
            />
          </Routes>
        </AppShell>
      </TicketProvider>
    </BrowserRouter>
  );
}
