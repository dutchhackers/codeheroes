export interface Achievement {
  id: string;
  userId: string;
  name: string;
  description: string;
  progress: number;
  maxProgress: number;
  completed: boolean;
  completedAt?: string;
  category: string;
  requirements: Array<{
    type: string;
    value: number;
    current: number;
  }>;
  rewards: {
    xp: number;
    badges?: string[];
  };
}
