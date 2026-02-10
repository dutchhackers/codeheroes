export interface CreateUserInput {
  uid?: string;
  email: string | null;
  name?: string;
  displayName: string | null;
  photoUrl: string | null;
  userType?: 'user' | 'bot' | 'system';
}

export interface UpdateUserInput {
  uid?: string;
  name?: string;
  displayName?: string;
  photoUrl?: string;
  active?: boolean;
  userType?: 'user' | 'bot' | 'system';
}
