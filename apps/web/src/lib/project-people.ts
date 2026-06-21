export function getProjectOicDisplayName(project: {
  oicName?: string | null;
  oicEmail?: string | null;
  oic?: { name?: string | null } | null;
}) {
  return project.oicName ?? project.oic?.name ?? null;
}
