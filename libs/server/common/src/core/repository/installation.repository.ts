import { Firestore } from 'firebase-admin/firestore';
import { Collections, GitHubInstallation, InstallationRepository as InstallationRepo } from '@codeheroes/types';
import { BaseRepository } from './base-repository';
import { getCurrentTimeAsISO } from '../firebase/time.utils';

export class InstallationRepository extends BaseRepository<GitHubInstallation> {
  protected collectionPath = Collections.Installations;

  constructor(db: Firestore) {
    super(db);
  }

  async findByGithubInstallationId(githubInstallationId: number): Promise<GitHubInstallation | null> {
    const results = await this.findWhere('githubInstallationId', '==', githubInstallationId, 1);
    return results[0] ?? null;
  }

  async findByLinkedUserId(userId: string): Promise<GitHubInstallation[]> {
    return this.findWhere('linkedUserId', '==', userId);
  }

  async findByAccountLogin(login: string): Promise<GitHubInstallation[]> {
    return this.findWhere('accountLogin', '==', login);
  }

  async findActive(): Promise<GitHubInstallation[]> {
    return this.findWhere('status', '==', 'active');
  }

  async linkToUser(installationId: string, userId: string): Promise<void> {
    await this.update(installationId, {
      linkedUserId: userId,
      linkedAt: getCurrentTimeAsISO(),
    } as Partial<GitHubInstallation>);
  }

  async unlinkUser(installationId: string): Promise<void> {
    const now = getCurrentTimeAsISO();
    const docRef = this.getDocRef(installationId);
    await docRef.update({
      linkedUserId: null,
      linkedAt: null,
      updatedAt: now,
    });
  }

  async updateRepositories(installationId: string, repos: InstallationRepo[]): Promise<void> {
    await this.update(installationId, {
      repositories: repos,
    } as Partial<GitHubInstallation>);
  }

  async updateStatus(installationId: string, status: GitHubInstallation['status']): Promise<void> {
    await this.update(installationId, { status } as Partial<GitHubInstallation>);
  }
}
