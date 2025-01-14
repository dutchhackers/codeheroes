import { BaseDocument } from './common.model';

export interface CreateUserInput {
  uid?: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
}

// later TODO: User could additionaly extend UserXpData
export interface User extends BaseDocument {
  email: string;
  displayName: string;
  photoUrl: string;
  lastLogin: string;
  active: boolean;
  uid?: string;
}
