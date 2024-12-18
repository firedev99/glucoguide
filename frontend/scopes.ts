export const SCOPES: Record<string, string[]> = {
  user: [
    "patient:read",
    "patient:write",
    "patient:update",
    "health:read",
    "health:write",
    "health:update",
    "health:delete",
  ],
  doctor: [
    "patient:read",
    "patient:update",
    "doctor:read",
    "doctor:update",
    "health:read",
  ],
  staff: [
    "staff:read",
    "staff:update",
    "doctor:read",
    "doctor:write",
    "doctor:update",
    "doctor:delete",
    "health:read",
  ],
  admin: [
    "patient:read",
    "patient:write",
    "patient:update",
    "patient:delete",
    "doctor:read",
    "doctor:write",
    "doctor:update",
    "doctor:delete",
    "staff:read",
    "staff:write",
    "staff:update",
    "staff:delete",
    "admin:read",
    "admin:write",
    "admin:update",
    "admin:delete",
    "health:read",
    "health:write",
    "health:update",
    "health:delete",
  ],
}
