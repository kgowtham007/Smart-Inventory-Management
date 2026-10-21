import React from 'react';

const Pagination = ({ page, limit, total, onPageChange }) => {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-1 py-3 text-sm text-gray-600">
      <p>
        Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          aria-label="Previous page"
        >
          ‹
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1.5 rounded border transition-colors ${
              p === page
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default Pagination;
