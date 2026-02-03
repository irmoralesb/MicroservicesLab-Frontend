/**
 * Auth-related types. JWT payload shape matches IdentityService token.
 */
export interface TokenPayload {
  sub: string
  email: string
  roles: Record<string, string[]>
  exp: number
  iat: number
}

export interface AuthUser {
  id: string
  email: string
  /** Roles by service, e.g. { "identity-service": ["admin"] } */
  roles: Record<string, string[]>
}
