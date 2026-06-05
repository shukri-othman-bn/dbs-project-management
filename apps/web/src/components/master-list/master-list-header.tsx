import { cn } from "@/lib/utils";

export function MasterListHeader({
  view,
  action,
}: {
  view: "by-status" | "contract-matters" | "payment-matters";
  action?: React.ReactNode;
}) {
  const subtitle =
    view === "by-status"
      ? "By status — lifecycle and monitoring views"
      : view === "contract-matters"
        ? "Contract matters — projects, payments, and related records"
        : "Payment matters — certification, dispatch, and payment processing";

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Master list</h1>
        <p className="text-slate-600">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function MasterListViewPills({
  active,
}: {
  active: "by-status" | "contract-matters" | "payment-matters";
}) {
  const items = [
    { id: "contract-matters" as const, href: "/master-list/contract-matters", label: "Contract Matters" },
    { id: "payment-matters" as const, href: "/master-list/payment-matters", label: "Payment Matters" },
    { id: "by-status" as const, href: "/master-list/by-status", label: "By Status" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <a
          key={item.id}
          href={item.href}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            active === item.id
              ? "bg-slate-800 text-white"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          )}
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}
