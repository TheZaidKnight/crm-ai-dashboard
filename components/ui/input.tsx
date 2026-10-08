import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`block w-full rounded-xl border px-3.5 py-2.5 text-sm shadow-xs transition-all duration-200 placeholder:text-zinc-400 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed ${
            error
              ? 'border-rose-500 text-rose-900 focus:ring-rose-500/15 focus:border-rose-500 dark:border-rose-500 dark:text-rose-200'
              : 'border-zinc-200 bg-white/90 text-zinc-900 focus:border-indigo-500 focus:ring-indigo-500/15 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20'
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
