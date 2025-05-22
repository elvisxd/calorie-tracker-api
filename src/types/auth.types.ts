export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
  };
  expiresIn: number; // seconds until token expiration
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number; // issued at
  exp?: number; // expiration time
}

export interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmation {
  token: string;
  newPassword: string;
}
