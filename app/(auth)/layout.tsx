import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950 overflow-hidden">
      {/* Decorative background glows */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/5" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-500/5" />

      {/* Brand Header */}
      <div className="mb-6 flex flex-col items-center">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 font-bold text-white shadow-md shadow-indigo-500/20 transition-transform duration-200 group-hover:scale-105">
            N
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Nexus <span className="text-indigo-600 dark:text-indigo-400">CRM</span>
          </span>
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
