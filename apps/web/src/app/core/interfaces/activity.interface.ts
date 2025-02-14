import type { ActivityDataType, ActivityType, EventType } from '../types';

export interface IActivity {
  id: string;
  userId: string;
  type: ActivityType;
  eventType: EventType;
  processingResult: IProcessingResult;
  externalEventId?: string;
  data: IActivityData;
  metrics?: IMetrics;
  userFacingDescription: string;
  createdAt: string;
  updatedAt: string;
  eventId: string;
  provider: string;
}

export interface IProcessingResult {
  achievements?: IAchievement[];
  processed: boolean;
  processedAt: string;
  xp: IXpResult;
}

export interface IAchievement {
  completed: boolean;
  description: string;
  progress: number;
  id: string;
  name: string;
  completedAt: string;
}

export interface IXpResult {
  awarded: number;
  breakdown: IXpBreakdown[];
  processed: boolean;
}

export interface IXpBreakdown {
  xp: number;
  description: string;
}

export interface IMetrics {
  changedFiles?: number;
  deletions?: number;
  additions?: number;
  commits?: number;
}

export interface IActivityData {
  prNumber?: number;
  type: ActivityDataType;
  title?: string;
  merged?: boolean;
  action?: string;
  draft?: boolean;
  branch?: string;
  commitCount?: number;
  state?: 'approved' | 'commented';
  submittedAt?: string;
  ref?: string;
  metrics?: {
    commits?: number;
  };
}
