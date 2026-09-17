const PAGE_SIZE = 10;

interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

/**
 * Previous / Next pagination controls with "Showing X–Y of Z" summary text.
 * Buttons are disabled at the boundaries and fully keyboard accessible.
 * Requirements 4.6, 5.1
 */
export function Pagination({
  page,
  totalPages,
  totalCount,
  onPageChange,
}: PaginationProps) {
  // Guard: nothing to paginate
  if (totalCount === 0) return null;

  const firstRow = page * PAGE_SIZE + 1;
  const lastRow = Math.min((page + 1) * PAGE_SIZE, totalCount);

  const isFirst = page === 0;
  const isLast = page >= totalPages - 1;

  return (
    <nav
      className="flex items-center justify-between px-4 py-3 border-t border-gray-200"
      aria-label="Pagination"
    >
      {/* Page summary */}
      <p className="text-sm text-gray-600">
        Showing{' '}
        <span className="font-medium">{firstRow}</span>
        {' – '}
        <span className="font-medium">{lastRow}</span>
        {' of '}
        <span className="font-medium">{totalCount}</span>
      </p>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={isFirst}
          aria-label="Previous page"
          className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Previous
        </button>

        {/* Current page indicator */}
        <span className="text-sm text-gray-600" aria-current="page">
          Page {page + 1} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={isLast}
          aria-label="Next page"
          className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
