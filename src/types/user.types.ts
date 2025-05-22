export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUserDTO {
  email: string;
  password_hash: string;
  full_name?: string;
}

export interface UpdateUserDTO {
  email?: string;
  full_name?: string;
}
