"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/actions/auth";
import type { WorkspaceWithRole } from "@/types/database";
import { WorkspaceSwitcher } from "./workspace-switcher";

interface SidebarProps {
  workspaces: WorkspaceWithRole[];
  currentWorkspaceId: string;
  userEmail: string;
  userRole?: string;
}

const baseNavItems = [
  { label: "Overview", href: "/dashboard", icon: "📊" },
  { label: "Forecasting", href: "/dashboard/forecasting", icon: "📈" },
  { label: "Workspace Settings", href: "/dashboard/workspace/settings", icon: "⚙️" },
];

export function Sidebar({
  workspaces,
  currentWorkspaceId,
  userEmail,
  userRole,
}: SidebarProps) {
  const pathname = usePathname();

  const navItems = [...baseNavItems];
  if (userRole === "admin") {
    navItems.push({ label: "Admin Panel", href: "/admin", icon: "🛡️" });
  }

  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : "U";

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-zinc-200/80 bg-white/80 backdrop-blur-xl transition-all duration-200 dark:border-zinc-800/80 dark:bg-zinc-950/80 z-20">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-200/70 px-4 dark:border-zinc-800/70">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/25">
            <span className="text-xs font-bold tracking-tight">CRM</span>
          </div>
          <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Nexus CRM
          </span>
        </div>
        {userRole === "admin" && (
          <span className="rounded-full border border-violet-200/60 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/50 dark:text-violet-300">
            Admin
          </span>
        )}
      </div>

      {/* Workspace Switcher */}
      <div className="border-b border-zinc-200/70 p-3 dark:border-zinc-800/70">
        <WorkspaceSwitcher
          workspaces={workspaces}
          currentWorkspaceId={currentWorkspaceId}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Navigation
        </div>
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium tracking-tight transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-50/90 to-violet-50/70 font-semibold text-indigo-700 shadow-xs dark:from-indigo-950/40 dark:to-violet-950/30 dark:text-indigo-300 border-l-2 border-indigo-600 dark:border-indigo-400"
                      : "text-zinc-600 hover:bg-zinc-100/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/70 dark:hover:text-zinc-100"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.href === "/admin" && (
                    <span className="ml-auto text-xs text-violet-500 opacity-80">★</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Footer with Glassmorphism Card */}
      <div className="border-t border-zinc-200/70 p-3 dark:border-zinc-800/70">
        <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-zinc-200/60 bg-zinc-50/70 p-2.5 backdrop-blur-xs dark:border-zinc-800/60 dark:bg-zinc-900/60">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-zinc-200 to-zinc-300 text-xs font-semibold text-zinc-700 dark:from-zinc-700 dark:to-zinc-800 dark:text-zinc-200">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
              {userEmail}
            </p>
            <p className="text-[10px] capitalize text-zinc-400 dark:text-zinc-500">
              {userRole || "User"}
            </p>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-xl border border-transparent px-3 py-2 text-center text-xs font-medium text-zinc-600 transition-all duration-200 hover:border-rose-200/70 hover:bg-rose-50/80 hover:text-rose-600 dark:text-zinc-400 dark:hover:border-rose-900/60 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
