import type { ArtifactGroup } from '../types/artifact.types';
import { updateDoc } from 'firebase/firestore';
import {
  COLLECTIONS,
  createDocument,
  getDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  getDocRef,
  where,
  orderBy,
  increment,
} from '../utils/firestore';
import { artifactService } from './artifactService';

export const artifactGroupService = {
  async create(data: Omit<ArtifactGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return await createDocument<ArtifactGroup>(COLLECTIONS.ARTIFACT_GROUPS, data);
  },

  async getById(groupId: string): Promise<ArtifactGroup | null> {
    return await getDocument<ArtifactGroup>(COLLECTIONS.ARTIFACT_GROUPS, groupId);
  },

  async getAll(): Promise<ArtifactGroup[]> {
    return await getDocuments<ArtifactGroup>(
      COLLECTIONS.ARTIFACT_GROUPS,
      orderBy('order', 'asc')
    );
  },

  async getPublic(): Promise<ArtifactGroup[]> {
    return await getDocuments<ArtifactGroup>(
      COLLECTIONS.ARTIFACT_GROUPS,
      where('isPublic', '==', true),
      orderBy('order', 'asc')
    );
  },

  async getBySubject(subjectId: string): Promise<ArtifactGroup[]> {
    return await getDocuments<ArtifactGroup>(
      COLLECTIONS.ARTIFACT_GROUPS,
      where('subjectId', '==', subjectId),
      orderBy('order', 'asc')
    );
  },

  async update(groupId: string, data: Partial<Omit<ArtifactGroup, 'id' | 'createdAt'>>): Promise<void> {
    await updateDocument<ArtifactGroup>(COLLECTIONS.ARTIFACT_GROUPS, groupId, data);
  },

  async getByAuthor(authorId: string): Promise<ArtifactGroup[]> {
    return await getDocuments<ArtifactGroup>(
      COLLECTIONS.ARTIFACT_GROUPS,
      where('authorId', '==', authorId),
      orderBy('createdAt', 'desc')
    );
  },

  async incrementViewCount(groupId: string): Promise<void> {
    const docRef = getDocRef(COLLECTIONS.ARTIFACT_GROUPS, groupId);
    await updateDoc(docRef, { viewCount: increment(1) });
  },

  async setFeatured(groupId: string, isFeatured: boolean): Promise<void> {
    await updateDocument<ArtifactGroup>(COLLECTIONS.ARTIFACT_GROUPS, groupId, { isFeatured });
  },

  async delete(groupId: string): Promise<void> {
    // Каскадное удаление дочерних артефактов
    const artifacts = await artifactService.getByGroupId(groupId);
    for (const artifact of artifacts) {
      await deleteDocument(COLLECTIONS.ARTIFACTS, artifact.id);
    }
    await deleteDocument(COLLECTIONS.ARTIFACT_GROUPS, groupId);
  },
};
