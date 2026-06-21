import { cn } from "@/lib/utils";

const LOGO_SRC = "/dbs-logo.png";

export function AppLogo({
  className,
  imageClassName,
  showSubtitle = true,
  subtitle = "Department Management",
}: {
  className?: string;
  imageClassName?: string;
  showSubtitle?: boolean;
  subtitle?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_SRC}
        alt="DBS — Department of Building Services"
        width={200}
        height={80}
        decoding="async"
        className={cn("h-auto w-full max-w-[200px] object-contain", imageClassName)}
      />
      {showSubtitle && (
        <p className="mt-2 text-xs text-slate-400">{subtitle}</p>
      )}
    </div>
  );
}

export function AppLogoCompact({
  className,
}: {
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt="DBS — Department of Building Services"
      width={140}
      height={56}
      decoding="async"
      className={cn("h-10 w-auto object-contain", className)}
    />
  );
}
