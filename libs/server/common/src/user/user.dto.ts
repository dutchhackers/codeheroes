export interface CreateUserInput {
  uid?: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
}

export interface UpdateUserInput {
  uid?: string;
  displayName?: string;
  photoUrl?: string;
}
