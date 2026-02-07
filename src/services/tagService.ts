import type { Tag, Artifact } from '../types/artifact.types';
import {
  COLLECTIONS,
  createDocument,
  getDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  orderBy,
} from '../utils/firestore';

export const tagService = {
  async create(data: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return await createDocument<Tag>(COLLECTIONS.TAGS, data);
  },

  async getById(tagId: string): Promise<Tag | null> {
    return await getDocument<Tag>(COLLECTIONS.TAGS, tagId);
  },

  async getAll(): Promise<Tag[]> {
    return await getDocuments<Tag>(
      COLLECTIONS.TAGS,
      orderBy('order', 'asc')
    );
  },

  async update(tagId: string, data: Partial<Omit<Tag, 'id' | 'createdAt'>>): Promise<void> {
    await updateDocument<Tag>(COLLECTIONS.TAGS, tagId, data);
  },

  async delete(tagId: string): Promise<void> {
    await deleteDocument(COLLECTIONS.TAGS, tagId);
  },

  // Удаление тега с каскадным удалением из всех артефактов
  async deleteWithCascade(tagId: string): Promise<number> {
    const artifacts = await getDocuments<Artifact>(COLLECTIONS.ARTIFACTS);

    let updatedCount = 0;
    for (const artifact of artifacts) {
      if (artifact.tags.includes(tagId)) {
        const newTags = artifact.tags.filter(t => t !== tagId);
        await updateDocument<Artifact>(COLLECTIONS.ARTIFACTS, artifact.id, { tags: newTags });
        updatedCount++;
      }
    }

    await deleteDocument(COLLECTIONS.TAGS, tagId);

    return updatedCount;
  },

};
