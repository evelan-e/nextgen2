import { useSidebar } from '../../hooks/useSidebar';
import Sidebar from './Sidebar';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Top-level layout component.
 * Renders the fixed Sidebar and the main content area whose left margin
 * tracks the sidebar width so content is never obscured.
 */
export default function AppShell({ children }: AppShellProps) {
  const { isCollapsed, toggle } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isCollapsed={isCollapsed} toggle={toggle} />

      {/* Main content — offset by sidebar width */}
      <main
        className={[
          'transition-all duration-200 ease-in-out min-h-screen',
          isCollapsed ? 'ml-14' : 'ml-60',
        ].join(' ')}
      >
        {children}
      </main>
    </div>
  );
}
