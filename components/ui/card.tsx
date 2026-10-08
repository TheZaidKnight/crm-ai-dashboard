import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200/80 bg-white/85 p-6 sm:p-8 shadow-xs backdrop-blur-md transition-all duration-200 hover:shadow-md hover:border-zinc-300 dark:border-zinc-800/80 dark:bg-zinc-900/85 dark:hover:border-zinc-700 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div className={`space-y-1.5 mb-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: CardProps) {
  return (
    <h2
      className={`text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 ${className}`}
    >
      {children}
    </h2>
  );
}

export function CardDescription({ children, className = '' }: CardProps) {
  return (
    <p className={`text-sm text-zinc-500 dark:text-zinc-400 ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '' }: CardProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }: CardProps) {
  return (
    <div className={`mt-6 flex items-center ${className}`}>
      {children}
    </div>
  );
}

