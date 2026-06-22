// lib/module-codes.ts

export const MODULES = {
  USERS: "USERS",
  ROLES: "ROLES",
  BRANCHES: "BRANCHES",
  MASTER_LEADS: "MASTER_LEADS",
  MBBS_LEADS: "MBBS_LEADS",
  UNIVERSITIES: "UNIVERSITIES",
} as const;

export const PERMISSIONS = {
  CREATE: "canCreate",
  READ: "canRead",
  UPDATE: "canUpdate",
  DELETE: "canDelete",
} as const;

export type PermissionAction =
  | "canCreate"
  | "canRead"
  | "canUpdate"
  | "canDelete";
