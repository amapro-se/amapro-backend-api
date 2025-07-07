export interface User {
  id: string;
  provider: string;
  provider_id: string;
  email: string;
  name: string;
  picture: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
}

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}
