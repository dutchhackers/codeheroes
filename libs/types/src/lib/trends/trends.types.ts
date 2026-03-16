export interface TrendsResponse {
  weekIds: string[];
  users: TrendsEntityData[];
  bots: TrendsEntityData[];
  projects: TrendsProjectData[];
}

export interface TrendsEntityData {
  id: string;
  displayName: string;
  photoUrl: string | null;
  level: number;
  totalXp: number;
  weeklyData: TrendsWeeklyDataPoint[];
}

export interface TrendsProjectData {
  id: string;
  name: string;
  slug: string;
  totalXp: number;
  weeklyData: TrendsWeeklyDataPoint[];
}

export interface TrendsWeeklyDataPoint {
  weekId: string;
  xpGained: number;
  counters: Record<string, number>;
}
