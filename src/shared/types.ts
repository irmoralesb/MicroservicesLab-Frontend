/**
 * DTOs matching MicroservicesLab-IdentityService API.
 */

export interface UserProfileResponse {
  id: string | null
  first_name: string
  middle_name: string | null
  last_name: string
  email: string
  is_active: boolean
  is_verified: boolean
  created_at: string | null
  updated_at: string | null
}

export interface UserResponse {
  id: string | null
  first_name: string
  middle_name: string | null
  last_name: string
  email: string
}

export interface CreateUserRequest {
  first_name: string
  middle_name: string
  last_name: string
  email: string
  password: string
}

export interface UpdateProfileRequest {
  first_name: string
  middle_name: string | null
  last_name: string
  email: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface UnlockAccountRequest {
  user_id: string
}

export interface ServiceResponse {
  id: string | null
  name: string
  description: string | null
  is_active: boolean
  url: string | null
  port: number | null
}

export interface ServiceCreateRequest {
  name: string
  description: string | null
  is_active: boolean
  url: string | null
  port: number | null
}

export interface ServiceUpdateRequest {
  name: string
  description: string | null
  is_active: boolean
  url: string | null
  port: number | null
}

export interface RoleResponse {
  id: string | null
  name: string
  description: string
  service_id: string | null
}

export interface RoleCreateRequest {
  name: string
  description: string
  service_id: string
}

export interface RoleUpdateRequest {
  name: string
  description: string
  service_id?: string | null
}

export interface RoleAssignRequest {
  user_id: string
  role_id: string
}
