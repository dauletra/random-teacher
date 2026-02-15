import type { Topic } from '../types/artifact.types';
import {
  COLLECTIONS,
  createDocument,
  getDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  orderBy,
} from '../utils/firestore';

export const topicService = {
  async create(data: Omit<Topic, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return await createDocument<Topic>(COLLECTIONS.TOPICS, data);
  },

  async getById(topicId: string): Promise<Topic | null> {
    return await getDocument<Topic>(COLLECTIONS.TOPICS, topicId);
  },

  async getAll(): Promise<Topic[]> {
    return await getDocuments<Topic>(
      COLLECTIONS.TOPICS,
      orderBy('order', 'asc')
    );
  },

  async update(topicId: string, data: Partial<Omit<Topic, 'id' | 'createdAt'>>): Promise<void> {
    await updateDocument<Topic>(COLLECTIONS.TOPICS, topicId, data);
  },

  async delete(topicId: string): Promise<void> {
    await deleteDocument(COLLECTIONS.TOPICS, topicId);
  },
};
