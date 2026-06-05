import Link from "next/link";
import { cn } from "@/lib/utils";

export function DesktopDataTable({
  children,
  className,
  dense,
}: {
  children: React.ReactNode;
  className?: string;
  dense?: boolean;
}) {
  return (
    <table
      className={cn(
        "w-full table-fixed border-collapse",
        dense ? "text-xs" : "text-sm",
        className
      )}
    >
      {children}
    </table>
  );
}

export const desktopThClass = cn(
  "break-words whitespace-normal align-top px-2 py-2 font-medium text-slate-500 lg:px-3 lg:py-2.5"
);
export const desktopTdClass = cn(
  "break-words whitespace-normal align-top px-2 py-2 lg:px-3 lg:py-2.5"
);

export function ResponsiveDataView({
  desktop,
  mobile,
}: {
  desktop: React.ReactNode;
  mobile: React.ReactNode;
}) {
  return (
    <>
      <div className="hidden min-w-0 lg:block">{desktop}</div>
      <div className="lg:hidden">{mobile}</div>
    </>
  );
}

export function MobileRecordCard({
  href,
  title,
  subtitle,
  children,
}: {
  href?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 min-w-0 border-b border-slate-100 pb-2">
        {href ? (
          <Link href={href} className="line-clamp-2 text-sm font-semibold text-slate-900 hover:underline">
            {title}
          </Link>
        ) : (
          <div className="line-clamp-2 text-sm font-semibold text-slate-900">{title}</div>
        )}
        {subtitle && <div className="mt-1 line-clamp-2 text-xs text-slate-500">{subtitle}</div>}
      </div>
      <div className="grid flex-1 grid-cols-3 gap-x-2 gap-y-3">{children}</div>
    </div>
  );
}

export function MobileField({
  label,
  value,
  className,
  span = 1,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
  span?: 1 | 2 | 3;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-0.5",
        span === 2 && "col-span-2",
        span === 3 && "col-span-3",
        className
      )}
    >
      <dt className="text-[10px] font-medium leading-tight text-slate-500">{label}</dt>
      <dd className="min-w-0 text-xs leading-snug text-slate-800">{value}</dd>
    </div>
  );
}

export function MobileCardList({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-3">{children}</div>;
}
