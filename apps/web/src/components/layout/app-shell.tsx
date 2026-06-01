import { auth } from "@/lib/auth";
import { Sidebar } from "./sidebar";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
