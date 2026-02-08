import type { Tag, ArtifactGroup } from '../types/artifact.types';
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

  // Удаление тега с каскадным удалением из всех групп артефактов
  async deleteWithCascade(tagId: string): Promise<number> {
    const groups = await getDocuments<ArtifactGroup>(COLLECTIONS.ARTIFACT_GROUPS);

    let updatedCount = 0;
    for (const group of groups) {
      if (group.tags.includes(tagId)) {
        const newTags = group.tags.filter(t => t !== tagId);
        await updateDocument<ArtifactGroup>(COLLECTIONS.ARTIFACT_GROUPS, group.id, { tags: newTags });
        updatedCount++;
      }
    }

    await deleteDocument(COLLECTIONS.TAGS, tagId);

    return updatedCount;
  },

};
