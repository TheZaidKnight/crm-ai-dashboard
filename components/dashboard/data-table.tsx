"use client";

import { useState, useMemo } from "react";

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  searchableKeys?: (keyof T)[];
  emptyMessage?: string;
  pageSize?: number;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchableKeys = [],
  emptyMessage = "No data found.",
  pageSize = 10,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      searchableKeys.some((key) =>
        String(row[key] ?? "")
          .toLowerCase()
          .includes(q)
      )
    );
  }, [data, search, searchableKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      {searchableKeys.length > 0 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Search records..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-zinc-200/90 bg-white/90 py-2.5 pl-10 pr-4 text-sm text-zinc-900 shadow-2xs backdrop-blur-xs placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20 transition-all duration-200"
          />
          <svg
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200/80 bg-white/80 shadow-xs backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200/80 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800/80 dark:bg-zinc-950/50 dark:text-zinc-400">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-4 py-3.5 font-semibold"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr
                  key={i}
                  className="transition-colors duration-150 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className="px-4 py-3 text-zinc-900 dark:text-zinc-100"
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : String(row[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1">
          <span>
            Showing <strong className="text-zinc-700 dark:text-zinc-300">{(safeCurrentPage - 1) * pageSize + 1}</strong>–
            <strong className="text-zinc-700 dark:text-zinc-300">{Math.min(safeCurrentPage * pageSize, filtered.length)}</strong> of{" "}
            <strong className="text-zinc-700 dark:text-zinc-300">{filtered.length}</strong>
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="rounded-xl border border-zinc-200/80 bg-white/80 px-3 py-1.5 font-medium text-zinc-700 shadow-2xs transition-all duration-200 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={safeCurrentPage === totalPages}
              className="rounded-xl border border-zinc-200/80 bg-white/80 px-3 py-1.5 font-medium text-zinc-700 shadow-2xs transition-all duration-200 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
