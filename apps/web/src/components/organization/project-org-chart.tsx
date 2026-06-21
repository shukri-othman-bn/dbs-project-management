import type { ReactNode } from "react";
import { PROJECT_ORG_LEADERSHIP, PROJECT_ORG_UNIT_CODES, PROJECT_ORG_UNIT_NOTE } from "@/lib/org-chart";
import { cn } from "@/lib/utils";

function OrgBox({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border-2 border-blue-700 bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

function VerticalStem({ className }: { className?: string }) {
  return <div className={cn("w-0.5 bg-blue-700", className)} />;
}

function HorizontalRail({ className }: { className?: string }) {
  return <div className={cn("h-0.5 bg-blue-700", className)} />;
}

export function ProjectOrgChart() {
  const units = PROJECT_ORG_UNIT_CODES;

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">{PROJECT_ORG_UNIT_NOTE}</p>

      <div className="overflow-x-auto pb-4">
        <div className="mx-auto flex min-w-[960px] flex-col items-center">
          {/* Director */}
          <OrgBox>Director</OrgBox>
          <VerticalStem className="h-8" />

          {/* Assistant Director (offset left like the chart) */}
          <div className="relative flex w-full max-w-md flex-col items-center">
            <VerticalStem className="absolute left-1/2 top-0 h-8 -translate-x-1/2" />
            <HorizontalRail className="absolute left-[18%] top-8 w-[32%]" />
            <VerticalStem className="absolute left-[18%] top-8 h-6" />
            <div className="mt-8 self-start">
              <OrgBox className="min-w-[160px]">{PROJECT_ORG_LEADERSHIP[1].title}</OrgBox>
            </div>
          </div>

          <VerticalStem className="h-8" />

          {/* Head of Section */}
          <OrgBox className="min-w-[160px]">{PROJECT_ORG_LEADERSHIP[2].title}</OrgBox>
          <VerticalStem className="h-8" />

          {/* Executive Engineer (offset left) */}
          <div className="relative flex w-full max-w-md flex-col items-center">
            <VerticalStem className="absolute left-1/2 top-0 h-8 -translate-x-1/2" />
            <HorizontalRail className="absolute left-[18%] top-8 w-[32%]" />
            <VerticalStem className="absolute left-[18%] top-8 h-6" />
            <div className="mt-8 self-start">
              <OrgBox className="min-w-[160px]">{PROJECT_ORG_LEADERSHIP[3].title}</OrgBox>
            </div>
          </div>

          <VerticalStem className="h-10" />

          {/* Units row */}
          <div className="relative w-full">
            <HorizontalRail className="absolute left-0 right-0 top-0" />
            <div className="flex justify-between gap-1 px-1 pt-0">
              {units.map((code) => (
                <div key={code} className="flex flex-col items-center">
                  <VerticalStem className="h-4" />
                  <OrgBox className="min-w-[52px] px-2 py-1.5 text-xs">{code}</OrgBox>
                  <VerticalStem className="h-3" />
                  <OrgBox className="min-w-[52px] px-2 py-1 text-[10px]">OIC</OrgBox>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        UMR and UAB are additional units maintained alongside BM1–BM10 and IMU1–IMU3.
      </p>
    </div>
  );
}
