import { Firestore, FieldValue } from 'firebase-admin/firestore';
import {
  Collections,
  ConnectedAccountProvider,
  UnmatchedEvent,
  UnmatchedEventCategory,
  UnmatchedEventResolutionAction,
  UnmatchedEventStatus,
} from '@codeheroes/types';
import { BaseRepository } from './base-repository';
import { getCurrentTimeAsISO } from '../firebase/time.utils';

interface RecordUnknownUserInput {
  provider: ConnectedAccountProvider;
  externalUserId: string;
  externalUserName?: string;
  eventType?: string;
}

interface RecordUnlinkedRepoInput {
  provider: ConnectedAccountProvider;
  owner: string;
  repoName: string;
  eventType?: string;
}

interface ResolveInput {
  resolvedBy: string;
  resolutionAction: UnmatchedEventResolutionAction;
  resolutionTargetId: string;
}

export class UnmatchedEventRepository extends BaseRepository<UnmatchedEvent> {
  protected collectionPath = Collections.UnmatchedEvents;

  constructor(db: Firestore) {
    super(db);
  }

  async recordUnknownUser(input: RecordUnknownUserInput): Promise<void> {
    const docId = `${input.provider}_${input.externalUserId}`;
    const docRef = this.getCollectionRef().doc(docId);
    const now = getCurrentTimeAsISO();

    const createData = {
      category: 'unknown_user' as UnmatchedEventCategory,
      status: 'pending' as UnmatchedEventStatus,
      provider: input.provider,
      externalUserId: input.externalUserId,
      externalUserName: input.externalUserName || null,
      eventCount: 1,
      lastSeenAt: now,
      lastEventType: input.eventType || null,
      sampleEventTypes: input.eventType ? [input.eventType] : [],
      createdAt: now,
      updatedAt: now,
    };

    try {
      await docRef.create(createData);
    } catch (error: any) {
      if (error?.code === 6 || error?.code === 'already-exists') {
        const updateData: Record<string, any> = {
          eventCount: FieldValue.increment(1),
          lastSeenAt: now,
          updatedAt: now,
        };
        if (input.eventType) {
          updateData.lastEventType = input.eventType;
          updateData.sampleEventTypes = FieldValue.arrayUnion(input.eventType);
        }
        if (input.externalUserName) {
          updateData.externalUserName = input.externalUserName;
        }
        await docRef.update(updateData);
      } else {
        throw error;
      }
    }
  }

  async recordUnlinkedRepo(input: RecordUnlinkedRepoInput): Promise<void> {
    const docId = `${input.provider}_${input.owner}_${input.repoName}`;
    const docRef = this.getCollectionRef().doc(docId);
    const now = getCurrentTimeAsISO();

    const createData = {
      category: 'unlinked_repo' as UnmatchedEventCategory,
      status: 'pending' as UnmatchedEventStatus,
      provider: input.provider,
      repoOwner: input.owner,
      repoName: input.repoName,
      repoFullName: `${input.owner}/${input.repoName}`,
      eventCount: 1,
      lastSeenAt: now,
      lastEventType: input.eventType || null,
      sampleEventTypes: input.eventType ? [input.eventType] : [],
      createdAt: now,
      updatedAt: now,
    };

    try {
      await docRef.create(createData);
    } catch (error: any) {
      if (error?.code === 6 || error?.code === 'already-exists') {
        const updateData: Record<string, any> = {
          eventCount: FieldValue.increment(1),
          lastSeenAt: now,
          updatedAt: now,
        };
        if (input.eventType) {
          updateData.lastEventType = input.eventType;
          updateData.sampleEventTypes = FieldValue.arrayUnion(input.eventType);
        }
        await docRef.update(updateData);
      } else {
        throw error;
      }
    }
  }

  async getByCategory(
    category: UnmatchedEventCategory,
    status?: UnmatchedEventStatus,
  ): Promise<UnmatchedEvent[]> {
    let query = this.getCollectionRef()
      .where('category', '==', category);

    if (status) {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('lastSeenAt', 'desc');

    const snapshot = await query.get();
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as UnmatchedEvent,
    );
  }

  async getSummary(): Promise<{ unknownUserCount: number; unlinkedRepoCount: number }> {
    const [unknownUserSnap, unlinkedRepoSnap] = await Promise.all([
      this.getCollectionRef()
        .where('category', '==', 'unknown_user')
        .where('status', '==', 'pending')
        .count()
        .get(),
      this.getCollectionRef()
        .where('category', '==', 'unlinked_repo')
        .where('status', '==', 'pending')
        .count()
        .get(),
    ]);

    return {
      unknownUserCount: unknownUserSnap.data().count,
      unlinkedRepoCount: unlinkedRepoSnap.data().count,
    };
  }

  async resolve(id: string, input: ResolveInput): Promise<void> {
    const now = getCurrentTimeAsISO();
    await this.getCollectionRef().doc(id).update({
      status: 'resolved',
      resolvedAt: now,
      resolvedBy: input.resolvedBy,
      resolutionAction: input.resolutionAction,
      resolutionTargetId: input.resolutionTargetId,
      updatedAt: now,
    });
  }

  async dismiss(id: string): Promise<void> {
    const now = getCurrentTimeAsISO();
    await this.getCollectionRef().doc(id).update({
      status: 'dismissed',
      updatedAt: now,
    });
  }
}
