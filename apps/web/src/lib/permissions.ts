import { Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  email?: string | null;
  role: Role;
  sectionId?: string | null;
};

export function canViewAllProjects(user: SessionUser) {
  return (
    user.role === Role.DIRECTOR ||
    user.role === Role.ADMIN ||
    user.role === Role.PROJECT_ADMIN
  );
}

export function canAccessBudget(user: SessionUser) {
  return (
    user.role === Role.DIRECTOR ||
    user.role === Role.HOS ||
    user.role === Role.ADMIN ||
    user.role === Role.PROJECT_ADMIN
  );
}

export function canEditBudgetAllocation(user: SessionUser) {
  return user.role === Role.PROJECT_ADMIN;
}

export function canEditProject(
  user: SessionUser,
  project: { oicUserId: string | null; oicEmail?: string | null; sectionId: string | null }
) {
  if (user.role === Role.ADMIN || user.role === Role.PROJECT_ADMIN) return true;
  if (
    user.role === Role.OFFICER &&
    ((project.oicUserId && project.oicUserId === user.id) ||
      (user.email &&
        project.oicEmail &&
        user.email.toLowerCase() === project.oicEmail.toLowerCase()))
  ) {
    return true;
  }
  if (user.role === Role.HOS && project.sectionId === user.sectionId) return true;
  return false;
}

export function canCreateProject(user: SessionUser) {
  return (
    user.role === Role.OFFICER ||
    user.role === Role.PROJECT_ADMIN ||
    user.role === Role.ADMIN
  );
}

export function canAccessAdmin(user: SessionUser) {
  return user.role === Role.ADMIN;
}

export function projectFilterForUser(user: SessionUser) {
  if (canViewAllProjects(user)) return {};
  if (user.role === Role.HOS && user.sectionId) {
    return { sectionId: user.sectionId };
  }
  if (user.role === Role.OFFICER) {
    if (user.email) {
      return {
        OR: [{ oicUserId: user.id }, { oicEmail: { equals: user.email, mode: "insensitive" as const } }],
      };
    }
    return { oicUserId: user.id };
  }
  return { id: "none" };
}

export function matterRequestFilterForUser(user: SessionUser) {
  if (canViewAllProjects(user)) return {};
  if (user.sectionId) {
    return { sectionId: user.sectionId };
  }
  return { id: "none" };
}
