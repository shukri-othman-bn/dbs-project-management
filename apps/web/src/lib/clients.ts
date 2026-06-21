import { prisma } from "./prisma";

export function uniqueClientMinistries(clients: { ministry: string }[]) {
  return [...new Set(clients.map((c) => c.ministry))].sort((a, b) => a.localeCompare(b));
}

export async function resolveClientId(
  ministry: string | null | undefined,
  department: string | null | undefined
): Promise<string | null> {
  const trimmedMinistry = ministry?.trim();
  if (!trimmedMinistry) return null;

  const trimmedDepartment = department?.trim() ?? "";
  const departmentKey = trimmedDepartment === "" ? "" : trimmedDepartment;

  const client = await prisma.client.upsert({
    where: {
      ministry_department: {
        ministry: trimmedMinistry,
        department: departmentKey,
      },
    },
    update: {},
    create: {
      ministry: trimmedMinistry,
      department: departmentKey,
    },
  });

  return client.id;
}
