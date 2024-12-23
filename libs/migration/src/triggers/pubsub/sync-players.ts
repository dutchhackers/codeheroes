import { db } from "../../core/config/firebase.config";
import { FirestoreCollections } from "../../core/enums";

export async function onSyncPlayers() {
  const snapshot = await db.collection(FirestoreCollections.EMPLOYEES).get();

  console.log(`Synchronizing ${snapshot.size} employees...`);
  for (const doc of snapshot.docs) {
    await syncPlayer(doc.data());
  }
  console.log("Done :-)");
}

async function syncPlayer(player): Promise<any> {
  if (!player && !player.id) {
    return null;
  }
  const data = {
    givenName: player.givenName,
    familyName: player.familyName,
    name: player.name,
    displayName: player.givenName,
    photoUrl: player.photoUrl,
    active: player.active,
    email: player.primaryEmail,
    githubAccount: player.primaryGitHubAccount,
  };
  const playerRef = db.collection(FirestoreCollections.USERS).doc(player.id);
  return playerRef.set(data, { merge: true });
}
