'use client';

import type { PaginationInfo } from '@/types';

type PaginationProps = {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
};

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { currentPage, totalPages, totalRecords, limit, hasNextPage, hasPreviousPage } = pagination;
  if (totalPages <= 1) return null;

  const firstPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => firstPage + index);
  const firstRecord = (currentPage - 1) * limit + 1;
  const lastRecord = Math.min(currentPage * limit, totalRecords);

  return (
    <nav
      aria-label="Pagination"
      className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
    >
      <p className="text-center text-xs text-slate-500 sm:text-left">
        Showing {firstRecord}–{lastRecord} of {totalRecords}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          disabled={!hasPreviousPage}
          onClick={() => onPageChange(currentPage - 1)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            aria-current={page === currentPage ? 'page' : undefined}
            onClick={() => onPageChange(page)}
            className={`h-9 min-w-9 rounded-lg px-2 text-xs font-bold ${page === currentPage ? 'bg-[#263b49] text-white' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
          >
            {page}
          </button>
        ))}
        <span className="px-1 text-xs text-slate-500">of {totalPages}</span>
        <button
          type="button"
          disabled={!hasNextPage}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
