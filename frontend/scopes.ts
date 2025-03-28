export const SCOPES: Record<string, string[]> = {
  user: [
    "users:chat",
    "patient:read",
    "patient:write",
    "patient:update",
    "monitoring:read",
    "monitoring:write",
    "monitoring:update",
    "appointment:read",
    "appointment:write",
    "appointment:update",
    "medication:read",
    "medication:write",
    "medication:update",
    "medication:delete",
  ],
  doctor: [
    "users:chat",
    "patient:read",
    "doctor:read",
    "doctor:update",
    "doctor:analytics",
    "monitoring:read",
    "medication:read",
    "medication:update",
    "appointment:read",
    "appointment:write",
    "appointment:update",
    "medication:delete",
  ],
  admin: [
    "users:chat",
    "users:read",
    "users:write",
    "users:update",
    "users:delete",
    "doctor:analytics",
    "appointment:read",
    "appointment:write",
    "appointment:update",
    "appointment:delete",
    "monitoring:read",
    "monitoring:delete",
    "medication:read",
    "medication:delete",
  ],
}
