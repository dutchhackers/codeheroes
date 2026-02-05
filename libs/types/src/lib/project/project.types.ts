import { BaseDocument } from '../core/base.types';
import { ConnectedAccountProvider } from '../core/providers';
import { ActivityCounters } from '../activity/activity.types';
import { GameActionType } from '../game/action.types';

// ============================================================================
// Core Project Types
// ============================================================================

export interface ProjectRepository {
  provider: ConnectedAccountProvider;
  owner: string;
  name: string;
  fullName: string; // "owner/name"
}

export interface Project extends BaseDocument {
  name: string;
  slug: string;
  description?: string;
  repositories: ProjectRepository[];
}

// ============================================================================
// Reverse Lookup
// ============================================================================

export interface RepoProjectMapping {
  projectId: string;
  projectName: string;
  provider: ConnectedAccountProvider;
  owner: string;
  repoName: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Project Stats
// ============================================================================

export interface ProjectStats {
  totalXp: number;
  totalActions: number;
  activeMembers: string[]; // all-time user IDs
  activeRepos: string[]; // all-time repo fullNames
  counters: ActivityCounters;
  lastActivity?: {
    type: GameActionType;
    timestamp: string;
    userId: string;
  };
}

export interface ProjectTimeBasedStats {
  timeframeId: string;
  xpGained: number;
  counters: ActivityCounters;
  activeMembers: string[]; // that period's active users
  activeRepos: string[]; // that period's active repos
  lastActivity?: {
    type: GameActionType;
    timestamp: string;
    userId: string;
  };
}

// ============================================================================
// DTOs
// ============================================================================

export interface CreateProjectDto {
  name: string;
  slug: string;
  description?: string;
  repositories?: ProjectRepository[];
}

export interface UpdateProjectDto {
  name?: string;
  slug?: string;
  description?: string;
  repositories?: ProjectRepository[];
}

export interface ProjectSummaryDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  repositoryCount: number;
  totalXp: number;
  totalActions: number;
  activeMemberCount: number;
  activeRepoCount: number;
}

export interface ProjectDetailDto extends Project {
  stats?: ProjectStats;
}
