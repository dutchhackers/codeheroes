import { AccountSource } from "../enums/account-source";

export interface Account {
  source: AccountSource;
  username: string;
  displayName: string;
  photoURL: string;
  userRef: string;
  verified: boolean;
  token?: string;
}
