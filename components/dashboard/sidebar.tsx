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
}

const navItems = [
  { label: "Overview", href: "/dashboard", icon: "📊" },
  { label: "Forecasting", href: "/dashboard/forecasting", icon: "📈" },
  { label: "Workspace Settings", href: "/dashboard/workspace/settings", icon: "⚙️" },
];

export function Sidebar({
  workspaces,
  currentWorkspaceId,
  userEmail,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-4 dark:border-gray-800">
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          CRM Dashboard
        </h1>
      </div>

      {/* Workspace Switcher */}
      <div className="border-b border-gray-200 p-3 dark:border-gray-800">
        <WorkspaceSwitcher
          workspaces={workspaces}
          currentWorkspaceId={currentWorkspaceId}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-200 p-3 dark:border-gray-800">
        <div className="mb-2 truncate text-sm text-gray-500 dark:text-gray-400">
          {userEmail}
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
