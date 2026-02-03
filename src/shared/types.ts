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
