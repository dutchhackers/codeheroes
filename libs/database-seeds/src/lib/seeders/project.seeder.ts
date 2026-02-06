import { Firestore } from 'firebase-admin/firestore';
import { Seeder } from '../types/seeder.interface';

interface ProjectSeed {
  name: string;
  slug: string;
  description?: string;
  repositories: Array<{ provider: string; owner: string; name: string; fullName: string }>;
}

export class ProjectSeeder implements Seeder<ProjectSeed> {
  async seed(db: Firestore, projects: ProjectSeed[]): Promise<void> {
    for (const project of projects) {
      const now = new Date().toISOString();

      // Create project document using slug as document ID
      const projectRef = db.collection('projects').doc(project.slug);
      await projectRef.set({
        name: project.name,
        slug: project.slug,
        description: project.description || null,
        repositories: project.repositories,
        createdAt: now,
        updatedAt: now,
      });

      console.log(`  Seeding project "${project.name}" (${projectRef.id}) with ${project.repositories.length} repos`);

      // Create repoProjectMap entries
      const batch = db.batch();
      for (const repo of project.repositories) {
        const mapDocId = `${repo.provider}_${repo.owner}_${repo.name}`;
        const mapRef = db.collection('repoProjectMap').doc(mapDocId);
        batch.set(mapRef, {
          projectId: projectRef.id,
          projectName: project.name,
          provider: repo.provider,
          owner: repo.owner,
          repoName: repo.name,
          fullName: repo.fullName,
          createdAt: now,
          updatedAt: now,
        });
      }
      await batch.commit();
    }

    console.log(`  Seeded ${projects.length} projects`);
  }

  async clear(db: Firestore): Promise<void> {
    // Clear projects
    const projectsSnapshot = await db.collection('projects').get();
    const batch1 = db.batch();
    projectsSnapshot.docs.forEach((doc) => batch1.delete(doc.ref));
    await batch1.commit();

    // Clear repoProjectMap
    const mapSnapshot = await db.collection('repoProjectMap').get();
    const batch2 = db.batch();
    mapSnapshot.docs.forEach((doc) => batch2.delete(doc.ref));
    await batch2.commit();
  }
}
