// src/components/admin/Pagination.jsx
import React from 'react';
import { IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5';

const Pagination = ({ page, pages, total, onPageChange }) => {
  if (pages <= 1) return null;

  const pageNumbers = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i += 1) pageNumbers.push(i);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border-default px-5 py-4 sm:flex-row">
      <p className="text-xs text-fg-muted">
        Showing <span className="font-semibold text-fg">{total}</span> total records
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border-default text-fg-muted transition hover:bg-surface-muted hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <IoChevronBackOutline size={15} />
        </button>
        {pageNumbers.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`h-8 w-8 rounded-md text-xs font-medium transition ${
              p === page
                ? 'bg-brand text-slate-950'
                : 'border border-border-default text-fg-muted hover:bg-surface-muted hover:text-fg'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border-default text-fg-muted transition hover:bg-surface-muted hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <IoChevronForwardOutline size={15} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;