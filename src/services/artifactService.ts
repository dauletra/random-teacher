import type { Artifact } from '../types/artifact.types';
import {
  COLLECTIONS,
  createDocument,
  getDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  where,
  orderBy,
} from '../utils/firestore';

export const artifactService = {
  async create(data: Omit<Artifact, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return await createDocument<Artifact>(COLLECTIONS.ARTIFACTS, data);
  },

  async getById(artifactId: string): Promise<Artifact | null> {
    return await getDocument<Artifact>(COLLECTIONS.ARTIFACTS, artifactId);
  },

  async getAll(): Promise<Artifact[]> {
    return await getDocuments<Artifact>(
      COLLECTIONS.ARTIFACTS,
      orderBy('order', 'asc')
    );
  },

  async getByGroupId(groupId: string): Promise<Artifact[]> {
    return await getDocuments<Artifact>(
      COLLECTIONS.ARTIFACTS,
      where('groupId', '==', groupId),
      orderBy('order', 'asc')
    );
  },

  async update(artifactId: string, data: Partial<Omit<Artifact, 'id' | 'createdAt'>>): Promise<void> {
    await updateDocument<Artifact>(COLLECTIONS.ARTIFACTS, artifactId, data);
  },

  async delete(artifactId: string): Promise<void> {
    await deleteDocument(COLLECTIONS.ARTIFACTS, artifactId);
  },
};
