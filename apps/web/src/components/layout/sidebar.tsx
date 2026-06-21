"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ListTree,
  Wallet,
  ClipboardList,
  Settings,
  Download,
  LogOut,
  ChevronDown,
  ChevronRight,
  FileBarChart,
  Network,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/budget";
import { MASTER_LIST_VIEWS } from "@/lib/master-list-views";
import { AppLogo } from "@/components/layout/app-logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["DIRECTOR", "HOS", "OFFICER", "PROJECT_ADMIN", "ADMIN"] },
  { href: "/organization", label: "Organization", icon: Network, roles: ["DIRECTOR", "HOS", "OFFICER", "PROJECT_ADMIN", "ADMIN"] },
  { href: "/budget", label: "Budget", icon: Wallet, roles: ["DIRECTOR", "HOS", "ADMIN", "PROJECT_ADMIN"] },
  {
    href: "/contractor-track-record",
    label: "Contractor Track Record",
    icon: ClipboardList,
    roles: ["DIRECTOR", "HOS", "OFFICER", "PROJECT_ADMIN", "ADMIN"],
  },
  { href: "/export", label: "Export", icon: Download, roles: ["DIRECTOR", "ADMIN"] },
  { href: "/admin", label: "Admin", icon: Settings, roles: ["ADMIN"] },
];

const masterListChildren = MASTER_LIST_VIEWS.map(({ href, label }) => ({ href, label }));

const reportsChildren = [
  { href: "/reports/statistics", label: "Statistics" },
  { href: "/reports/project-reports", label: "Project Reports" },
  { href: "/reports/expenditure", label: "Expenditure Report" },
  { href: "/reports/tender-status", label: "Tender Status Report" },
];

const sidebarAsideClass =
  "flex h-full w-64 flex-col border-r border-slate-200 bg-slate-900 text-white";

export function SidebarPanel({
  user,
  className,
  onNavigate,
}: {
  user: { name: string; role: string; email: string };
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [masterOpen, setMasterOpen] = useState(pathname.startsWith("/master-list"));
  const [reportsOpen, setReportsOpen] = useState(pathname.startsWith("/reports"));

  useEffect(() => {
    if (pathname.startsWith("/master-list")) setMasterOpen(true);
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith("/reports")) setReportsOpen(true);
  }, [pathname]);

  const items = navItems.filter((item) => item.roles.includes(user.role));
  const showMasterList = ["DIRECTOR", "HOS", "OFFICER", "PROJECT_ADMIN", "ADMIN"].includes(user.role);
  const showReports = ["DIRECTOR", "HOS", "OFFICER", "PROJECT_ADMIN", "ADMIN"].includes(user.role);
  const masterActive = pathname.startsWith("/master-list");
  const reportsActive = pathname.startsWith("/reports");

  const linkProps = onNavigate ? { onClick: onNavigate } : {};

  return (
    <aside className={cn(sidebarAsideClass, className)}>
      <div className="border-b border-slate-700 px-4 py-5">
        <AppLogo showSubtitle subtitle="Project Management" priority />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.slice(0, 1).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              {...linkProps}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {showMasterList && (
          <div>
            <button
              type="button"
              onClick={() => setMasterOpen((o) => !o)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                masterActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <ListTree className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Master List</span>
              {masterOpen ? (
                <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />
              )}
            </button>
            {masterOpen && (
              <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-700 pl-2">
                {masterListChildren.map((child) => {
                  const childActive =
                    pathname === child.href || pathname.startsWith(child.href + "/");
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      {...linkProps}
                      className={cn(
                        "block rounded-lg px-3 py-2 text-sm transition-colors",
                        childActive
                          ? "bg-slate-700 text-white"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {showReports && (
          <div>
            <button
              type="button"
              onClick={() => setReportsOpen((o) => !o)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                reportsActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <FileBarChart className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Reports</span>
              {reportsOpen ? (
                <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />
              )}
            </button>
            {reportsOpen && (
              <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-700 pl-2">
                {reportsChildren.map((child) => {
                  const childActive =
                    pathname === child.href || pathname.startsWith(child.href + "/");
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      {...linkProps}
                      className={cn(
                        "block rounded-lg px-3 py-2 text-sm transition-colors",
                        childActive
                          ? "bg-slate-700 text-white"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {items.slice(1).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              {...linkProps}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-700 px-4 py-4">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="text-xs text-slate-400">{ROLE_LABELS[user.role] ?? user.role}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function SidebarDesktop({
  user,
}: {
  user: { name: string; role: string; email: string };
}) {
  return (
    <div className="hidden h-screen shrink-0 lg:block">
      <SidebarPanel user={user} className="h-screen" />
    </div>
  );
}
