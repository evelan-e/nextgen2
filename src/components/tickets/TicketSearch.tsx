interface TicketSearchProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Text input for searching tickets by subject or customer name.
 * Requirements 5.2, 5.4, 5.5
 */
export function TicketSearch({ value, onChange }: TicketSearchProps) {
  return (
    <div className="relative">
      {/* Search icon */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3" aria-hidden="true">
        <svg
          className="h-4 w-4 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      </div>

      <input
        type="search"
        aria-label="Search tickets"
        placeholder="Search tickets..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 sm:w-64"
      />
    </div>
  );
}
