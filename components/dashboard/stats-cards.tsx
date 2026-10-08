import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
}

export function StatsCard({ title, value, description, icon }: StatsCardProps) {
  return (
    <div className="group rounded-2xl border border-zinc-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-md transition-all duration-200 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:hover:border-zinc-700">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </p>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50/80 text-lg transition-transform duration-200 group-hover:scale-105 dark:bg-indigo-950/40">
            {icon}
          </div>
        )}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
        {value}
      </p>
      {description && (
        <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      )}
    </div>
  );
}

interface StatsGridProps {
  children: ReactNode;
}

export function StatsGrid({ children }: StatsGridProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
  );
}
