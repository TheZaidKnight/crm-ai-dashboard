import { ReactNode } from 'react';

interface AlertProps {
  children: ReactNode;
  variant?: 'success' | 'error' | 'info' | 'warning';
  className?: string;
}

const variantStyles = {
  success:
    'bg-emerald-50/90 text-emerald-900 border-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/60',
  error:
    'bg-rose-50/90 text-rose-900 border-rose-200/80 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/60',
  info:
    'bg-indigo-50/90 text-indigo-900 border-indigo-200/80 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800/60',
  warning:
    'bg-amber-50/90 text-amber-900 border-amber-200/80 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/60',
};

const variantIcons = {
  success: '✓',
  error: '⚠',
  info: 'ℹ',
  warning: '!',
};

export function Alert({ children, variant = 'info', className = '' }: AlertProps) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xs backdrop-blur-sm transition-all duration-200 ${variantStyles[variant]} ${className}`}
      role="alert"
    >
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-xs font-bold opacity-80">
        {variantIcons[variant]}
      </span>
      <div className="flex-1 leading-relaxed">{children}</div>
    </div>
  );
}
