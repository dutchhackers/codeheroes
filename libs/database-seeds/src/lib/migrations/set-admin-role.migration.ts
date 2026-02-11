import { getAuth } from 'firebase-admin/auth';

export class SetAdminRoleMigration {
  async run(db: FirebaseFirestore.Firestore, email: string): Promise<void> {
    console.log(`Setting admin role for user with email: ${email}`);

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Update Firestore role
    await userDoc.ref.update({ role: 'admin' });
    console.log(`Updated Firestore role to 'admin' for user ${userDoc.id}`);

    // Update Firebase Auth custom claims if user has a UID
    if (userData.uid) {
      try {
        await getAuth().setCustomUserClaims(userData.uid, { role: 'admin' });
        console.log(`Updated Firebase Auth custom claims for UID ${userData.uid}`);
      } catch (error) {
        console.warn('Could not set Firebase Auth custom claims (may not exist in Auth):', error);
      }
    } else {
      console.warn('User has no Firebase Auth UID — only Firestore role was updated');
    }

    console.log('Done.');
  }
}
