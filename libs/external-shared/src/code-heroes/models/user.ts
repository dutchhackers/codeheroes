import { IUserPreferences } from "./user-preferences";
import { IUserBadge } from "./user-badge";

export interface IUser {
  uid: string;
  name: string;
  displayName: string;
  email: string;
  photoUrl: string;
  xp: number;
  totalXp: number;
  level: number /* 0 - 20 */;
  currency: number;
  preferences: IUserPreferences;
  timeZone: string;
  active: boolean;
  badges: IUserBadge[];
  score?: number;
}
