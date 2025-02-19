export enum StreakType {
  CodePush = 'code_pushes',
  PullRequestCreate = 'pr_creations',
  PullRequestClose = 'pr_closes',
  PullRequestMerge = 'pr_merges',
}

export interface StreakData {
  current: number;
  best: number;
  lastActionDate: string | null;
}

export interface StreakResult {
  newStreak: number;
  bonusXP: number;
}
