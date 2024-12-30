import { BaseDocument } from './common.model';

// User Document
export interface User extends BaseDocument {
  email: string;
  displayName: string;
  photoUrl: string;
  lastLogin: string;
  active: boolean;
  uid?: string; // via Firebase Auth
}
