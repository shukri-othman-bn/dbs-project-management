"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarPanel, SidebarDesktop } from "./sidebar";

export function AppShellLayout({
  user,
  children,
}: {
  user: { name: string; role: string; email: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen, closeMenu]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarDesktop user={user} />

      {/* Mobile drawer backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!menuOpen}
        onClick={closeMenu}
      />

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-200 ease-out lg:hidden",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal={menuOpen}
        aria-hidden={!menuOpen}
        aria-label="Navigation menu"
      >
        <SidebarPanel user={user} className="h-full shadow-xl" onNavigate={closeMenu} />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="text-base font-semibold text-slate-900">DBS Projects</span>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
