import { CollectionReference } from 'firebase-admin/firestore';
import { PaginatedResponse, PaginationParams } from '../core/interfaces/pagination.interface';
import { BaseFirestoreService } from '../core/services';
import { CounterService } from '../core/services';
import { getCurrentTimeAsISO } from '../core/firebase';
import { userConverter } from './user.converter';
import { CreateUserInput, UpdateUserInput } from './user.dto';
import { User } from './user.model';

export class UserService extends BaseFirestoreService<User> {
  protected collection: CollectionReference<User>;
  private counterService: CounterService;

  constructor() {
    super();
    this.collection = this.db.collection('users').withConverter(userConverter);
    this.counterService = new CounterService();
  }

  async createUser(input: CreateUserInput) {
    if (!input) {
      throw new Error('User data is required');
    }

    // Get the next sequential user ID
    const nextId = await this.counterService.getNextUserId();
    const timestamps = this.createTimestamps();

    const userDoc: User = {
      id: nextId,
      active: true,
      lastLogin: getCurrentTimeAsISO(),
      ...input,
      ...timestamps,
    };

    await this.collection.doc(nextId).set(userDoc);
    return this.getUser(nextId);
  }

  async getUser(userId: string): Promise<User> {
    const snapshot = await this.collection.doc(userId).get();
    return snapshot.data();
  }

  async getUsers(params: PaginationParams = {}): Promise<PaginatedResponse<User>> {
    const limit = params.limit || 10;
    let query = this.collection.orderBy('createdAt', 'desc').limit(limit + 1);

    if (params.startAfterId) {
      const startAfterDoc = await this.collection.doc(params.startAfterId).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const snapshot = await query.get();
    const items = snapshot.docs.slice(0, limit).map((doc) => doc.data());
    const hasMore = snapshot.docs.length > limit;
    const lastId = items.length > 0 ? items[items.length - 1].id : null;

    return {
      items,
      lastId,
      hasMore,
    };
  }

  async updateUser(userId: string, input: UpdateUserInput): Promise<User> {
    const docRef = this.collection.doc(userId);
    const timestamps = this.updateTimestamps();

    await docRef.update({
      ...input,
      ...timestamps,
    });

    return this.getUser(userId);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const snapshot = await this.collection.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data();
  }

  // Helper: Get initial user stats
  async initializeNewUser(userId: string, username: string) {
    const userStatsRef = this.db.collection('userStats').doc(userId);

    try {
      // Check if stats already exist
      const existingStats = await userStatsRef.get();

      if (!existingStats.exists) {
        // Create initial stats
        // await userStatsRef.set(this.getInitialUserStats(userId, username));
        await userStatsRef.set({
          userId,
          username,
          level: 1,
        });

        // // Create first daily stats
        // const today = new Date().toISOString().split('T')[0];
        // await this.db
        //   .collection('users')
        //   .doc(userId)
        //   .collection('daily_stats')
        //   .doc(today)
        //   .set({
        //     date: today,
        //     totalXP: 0,
        //     activities: {
        //       pr_merges: 0,
        //     }
        //   });

        console.log(`Initialized stats for new user: ${userId}`);
        return true;
      }

      return false; // Stats already existed
    } catch (error) {
      console.error('Error initializing user stats:', error);
    }
  }
}
