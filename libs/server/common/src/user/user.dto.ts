export interface CreateUserInput {
  uid?: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
  userType?: 'user' | 'bot' | 'system';
}

export interface UpdateUserInput {
  uid?: string;
  displayName?: string;
  photoUrl?: string;
  userType?: 'user' | 'bot' | 'system';
}
