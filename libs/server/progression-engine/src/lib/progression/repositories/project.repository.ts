import { BaseRepository, getCurrentTimeAsISO, logger } from '@codeheroes/common';
import {
  Collections,
  Project,
  RepoProjectMapping,
  ProjectStats,
  ProjectTimeBasedStats,
  ActivityCounters,
  GameActionType,
} from '@codeheroes/types';
import { FieldValue, Firestore } from 'firebase-admin/firestore';
import { getTimePeriodIds } from '../../utils/time-periods.utils';

export interface UpdateProjectStatsParams {
  projectId: string;
  xpGained: number;
  actionType: GameActionType;
  userId: string;
  repoFullName: string;
}

export class ProjectRepository extends BaseRepository<Project> {
  protected collectionPath = Collections.Projects;

  constructor(db: Firestore) {
    super(db);
  }

  async createProject(data: {
    name: string;
    slug: string;
    description?: string;
    repositories: Project['repositories'];
  }): Promise<Project> {
    const project = await this.create(data as Omit<Project, 'id' | 'createdAt' | 'updatedAt'>, data.slug);
    await this.syncRepoMappings(project);
    return project;
  }

  async updateProject(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      repositories?: Project['repositories'];
    },
  ): Promise<void> {
    await this.update(id, data);

    if (data.repositories) {
      const project = await this.findById(id);
      if (project) {
        await this.syncRepoMappings(project);
      }
    }
  }

  async getProject(id: string): Promise<Project | null> {
    return this.findById(id);
  }

  async getAllProjects(): Promise<Project[]> {
    return this.findAll(500);
  }

  async deleteProject(id: string): Promise<void> {
    // Clean up repo mappings first
    const project = await this.findById(id);
    if (project) {
      await this.deleteRepoMappings(project.repositories);
    }
    await this.delete(id);
  }

  /**
   * O(1) lookup: resolve which project a repo belongs to
   */
  async resolveProjectForRepo(
    provider: string,
    owner: string,
    repoName: string,
  ): Promise<RepoProjectMapping | null> {
    const docId = `${provider}_${owner}_${repoName}`;
    try {
      const doc = await this.db
        .collection(Collections.RepoProjectMap)
        .doc(docId)
        .get();

      if (!doc.exists) {
        return null;
      }

      return { id: doc.id, ...doc.data() } as unknown as RepoProjectMapping;
    } catch (error) {
      logger.error('Error resolving project for repo', { owner, repoName, error });
      throw error;
    }
  }

  /**
   * Update project stats across current, daily, and weekly docs.
   * Uses FieldValue.increment and arrayUnion for atomic updates.
   */
  async updateProjectStats(params: UpdateProjectStatsParams): Promise<void> {
    const { projectId, xpGained, actionType, userId, repoFullName } = params;
    const now = getCurrentTimeAsISO();
    const timeFrames = getTimePeriodIds();

    const currentStatsRef = this.db
      .collection(Collections.Projects)
      .doc(projectId)
      .collection('stats')
      .doc('current');

    const dailyStatsRef = this.db
      .collection(Collections.Projects)
      .doc(projectId)
      .collection('activityStats')
      .doc('daily')
      .collection('records')
      .doc(timeFrames.daily);

    const weeklyStatsRef = this.db
      .collection(Collections.Projects)
      .doc(projectId)
      .collection('activityStats')
      .doc('weekly')
      .collection('records')
      .doc(timeFrames.weekly);

    const lastActivity = { type: actionType, timestamp: now, userId };

    // Read all three docs to check existence
    const [currentDoc, dailyDoc, weeklyDoc] = await Promise.all([
      currentStatsRef.get(),
      dailyStatsRef.get(),
      weeklyStatsRef.get(),
    ]);

    const batch = this.db.batch();

    // 1. Current stats
    if (currentDoc.exists) {
      batch.update(currentStatsRef, {
        totalXp: FieldValue.increment(xpGained),
        totalActions: FieldValue.increment(1),
        activeMembers: FieldValue.arrayUnion(userId),
        activeRepos: FieldValue.arrayUnion(repoFullName),
        [`counters.actions.${actionType}`]: FieldValue.increment(1),
        lastActivity,
        updatedAt: now,
      });
    } else {
      const initialStats: ProjectStats = {
        totalXp: xpGained,
        totalActions: 1,
        activeMembers: [userId],
        activeRepos: [repoFullName],
        counters: this.createCountersWithAction(actionType),
        lastActivity,
      };
      batch.set(currentStatsRef, { ...initialStats, createdAt: now, updatedAt: now });
    }

    // 2. Daily stats
    if (dailyDoc.exists) {
      batch.update(dailyStatsRef, {
        xpGained: FieldValue.increment(xpGained),
        activeMembers: FieldValue.arrayUnion(userId),
        activeRepos: FieldValue.arrayUnion(repoFullName),
        [`counters.actions.${actionType}`]: FieldValue.increment(1),
        lastActivity,
        updatedAt: now,
      });
    } else {
      const initialDaily: ProjectTimeBasedStats = {
        timeframeId: timeFrames.daily,
        xpGained,
        counters: this.createCountersWithAction(actionType),
        activeMembers: [userId],
        activeRepos: [repoFullName],
        lastActivity,
      };
      batch.set(dailyStatsRef, { ...initialDaily, createdAt: now, updatedAt: now });
    }

    // 3. Weekly stats
    if (weeklyDoc.exists) {
      batch.update(weeklyStatsRef, {
        xpGained: FieldValue.increment(xpGained),
        activeMembers: FieldValue.arrayUnion(userId),
        activeRepos: FieldValue.arrayUnion(repoFullName),
        [`counters.actions.${actionType}`]: FieldValue.increment(1),
        lastActivity,
        updatedAt: now,
      });
    } else {
      const initialWeekly: ProjectTimeBasedStats = {
        timeframeId: timeFrames.weekly,
        xpGained,
        counters: this.createCountersWithAction(actionType),
        activeMembers: [userId],
        activeRepos: [repoFullName],
        lastActivity,
      };
      batch.set(weeklyStatsRef, { ...initialWeekly, createdAt: now, updatedAt: now });
    }

    await batch.commit();
  }

  /**
   * Get current aggregate stats for a project
   */
  async getProjectStats(projectId: string): Promise<ProjectStats | null> {
    const doc = await this.db
      .collection(Collections.Projects)
      .doc(projectId)
      .collection('stats')
      .doc('current')
      .get();

    return doc.exists ? (doc.data() as ProjectStats) : null;
  }

  /**
   * Get time-based stats for a project
   */
  async getProjectTimeBasedStats(
    projectId: string,
    period: 'daily' | 'weekly',
    timeframeId: string,
  ): Promise<ProjectTimeBasedStats | null> {
    const doc = await this.db
      .collection(Collections.Projects)
      .doc(projectId)
      .collection('activityStats')
      .doc(period)
      .collection('records')
      .doc(timeframeId)
      .get();

    return doc.exists ? (doc.data() as ProjectTimeBasedStats) : null;
  }

  /**
   * Sync repo-to-project mappings: delete old ones, create new ones
   */
  private async syncRepoMappings(project: Project): Promise<void> {
    // Find existing mappings for this project
    const existingMappings = await this.db
      .collection(Collections.RepoProjectMap)
      .where('projectId', '==', project.id)
      .get();

    const batch = this.db.batch();
    const now = getCurrentTimeAsISO();

    // Delete old mappings
    for (const doc of existingMappings.docs) {
      batch.delete(doc.ref);
    }

    // Create new mappings
    for (const repo of project.repositories) {
      const docId = `${repo.provider}_${repo.owner}_${repo.name}`;
      const ref = this.db.collection(Collections.RepoProjectMap).doc(docId);
      const mapping: RepoProjectMapping = {
        projectId: project.id,
        projectName: project.name,
        provider: repo.provider,
        owner: repo.owner,
        repoName: repo.name,
        fullName: repo.fullName,
        createdAt: now,
        updatedAt: now,
      };
      batch.set(ref, mapping);
    }

    await batch.commit();
  }

  private async deleteRepoMappings(
    repositories: Project['repositories'],
  ): Promise<void> {
    const batch = this.db.batch();
    for (const repo of repositories) {
      const docId = `${repo.provider}_${repo.owner}_${repo.name}`;
      const ref = this.db.collection(Collections.RepoProjectMap).doc(docId);
      batch.delete(ref);
    }
    await batch.commit();
  }

  private createCountersWithAction(actionType: GameActionType): ActivityCounters {
    return {
      actions: { [actionType]: 1 },
    };
  }
}
