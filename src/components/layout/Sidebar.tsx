import { NavLink } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Icon components (inline SVGs â€” heroicons style)
// ---------------------------------------------------------------------------

function IconDashboard() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function IconTickets() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
      />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Nav items definition
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { path: '/',          label: 'Dashboard', Icon: IconDashboard,  end: true  },
  { path: '/tickets',   label: 'Tickets',   Icon: IconTickets,    end: false },
  { path: '/settings',  label: 'Settings',  Icon: IconSettings,   end: false },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SidebarProps {
  isCollapsed: boolean;
  toggle: () => void;
}

export default function Sidebar({ isCollapsed, toggle }: SidebarProps) {
  return (
    <aside
      className={[
        'fixed left-0 top-0 h-screen z-30',
        'bg-white border-r border-gray-200',
        'flex flex-col',
        'transition-all duration-200 ease-in-out',
        isCollapsed ? 'w-14' : 'w-60',
      ].join(' ')}
    >
      {/* ----------------------------------------------------------------- */}
      {/* Top â€” product logo / name                                          */}
      {/* ----------------------------------------------------------------- */}
      <div
        className={[
          'flex items-center gap-3 h-14 px-3 border-b border-gray-200 shrink-0',
          isCollapsed ? 'justify-center' : '',
        ].join(' ')}
      >
        {/* Logo mark */}
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-600 text-white font-bold text-sm shrink-0">
          S
        </div>
        {/* Product name â€” hidden when collapsed */}
        {!isCollapsed && (
          <span className="font-semibold text-gray-900 text-sm tracking-tight truncate">
            SupportDesk
          </span>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Middle â€” navigation                                                */}
      {/* ----------------------------------------------------------------- */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5" aria-label="Main navigation">
        {NAV_ITEMS.map(({ path, label, Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium',
                'transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                isCollapsed ? 'justify-center' : '',
              ].join(' ')
            }
            title={isCollapsed ? label : undefined}
          >
            <Icon />
            {!isCollapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* ----------------------------------------------------------------- */}
      {/* Collapse / expand toggle                                           */}
      {/* ----------------------------------------------------------------- */}
      <div className="px-2 py-2 border-t border-gray-200 shrink-0">
        <button
          onClick={toggle}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={[
            'flex items-center gap-2 w-full rounded-md px-2 py-2 text-sm text-gray-500',
            'hover:bg-gray-50 hover:text-gray-700 transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
            isCollapsed ? 'justify-center' : '',
          ].join(' ')}
        >
          {isCollapsed ? <IconChevronRight /> : <IconChevronLeft />}
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Bottom â€” user avatar + name                                        */}
      {/* ----------------------------------------------------------------- */}
      <div
        className={[
          'flex items-center gap-3 px-3 py-3 border-t border-gray-200 shrink-0',
          isCollapsed ? 'justify-center' : '',
        ].join(' ')}
      >
        {/* Avatar initials */}
        <div
          className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold shrink-0"
          aria-hidden="true"
        >
          JD
        </div>
        {/* Name â€” hidden when collapsed */}
        {!isCollapsed && (
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">John Doe</p>
            <p className="text-xs text-gray-500 truncate">Support Agent</p>
          </div>
        )}
      </div>
    </aside>
  );
}


