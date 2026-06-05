import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShellLayout } from "./app-shell-layout";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <AppShellLayout user={session.user}>{children}</AppShellLayout>;
}
