import { ButtonHTMLAttributes } from 'react';
import { Spinner } from './spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variantStyles = {
  primary:
    'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/20 hover:from-indigo-500 hover:to-violet-500 hover:shadow-md hover:shadow-indigo-500/25 focus-visible:ring-indigo-500 active:scale-[0.99]',
  secondary:
    'bg-zinc-100 text-zinc-900 border border-zinc-200/80 hover:bg-zinc-200/80 focus-visible:ring-zinc-400 dark:bg-zinc-800/90 dark:text-zinc-100 dark:border-zinc-700/80 dark:hover:bg-zinc-700 active:scale-[0.99]',
  danger:
    'bg-rose-600 text-white shadow-sm shadow-rose-500/20 hover:bg-rose-500 hover:shadow-md hover:shadow-rose-500/25 focus-visible:ring-rose-500 active:scale-[0.99]',
  ghost:
    'bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/80',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs font-medium',
  md: 'px-4 py-2 text-sm font-medium',
  lg: 'px-5 py-2.5 text-base font-semibold',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl font-medium tracking-tight transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Spinner className="mr-2 h-4 w-4" />}
      {children}
    </button>
  );
}
