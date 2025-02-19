export interface IUser {
  active: boolean;
  currentLevelXp: number;
  displayName: string;
  email: string;
  id: number;
  lastLogin: string;
  level: number;
  photoUrl?: string;
  stats: IUserStats;
  uid: string;
  updatedAt: string;
  xp: number;
  xpToNextLevel: number;
}

export interface IUserStats {
  branches: {
    active: number;
    deleted: number;
    total: number;
  };
  issues: {
    closed: number;
    reopened: number;
    total: number;
  };
  tags: {
    deleted: number;
    total: number;
  };
}
