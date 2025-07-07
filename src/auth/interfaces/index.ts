export * from './user.interface';

export interface GooglePayload {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

export interface SupabaseResponse<T> {
  data: T | null;
  error: any;
}
