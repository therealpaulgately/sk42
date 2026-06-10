export type UserRole = "admin" | "leader" | "officer" | "viewer";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 4,
  leader: 3,
  officer: 2,
  viewer: 1,
};

export function hasMinimumRole(
  userRole: UserRole | null | undefined,
  required: UserRole
): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required];
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  leader: "Leader",
  officer: "Officer",
  viewer: "Viewer",
};
