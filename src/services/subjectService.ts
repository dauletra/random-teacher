import type { Subject } from '../types/artifact.types';
import {
  COLLECTIONS,
  createDocument,
  getDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  orderBy,
} from '../utils/firestore';

export const subjectService = {
  async create(data: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return await createDocument<Subject>(COLLECTIONS.SUBJECTS, data);
  },

  async getById(subjectId: string): Promise<Subject | null> {
    return await getDocument<Subject>(COLLECTIONS.SUBJECTS, subjectId);
  },

  async getAll(): Promise<Subject[]> {
    return await getDocuments<Subject>(
      COLLECTIONS.SUBJECTS,
      orderBy('order', 'asc')
    );
  },

  async update(subjectId: string, data: Partial<Omit<Subject, 'id' | 'createdAt'>>): Promise<void> {
    await updateDocument<Subject>(COLLECTIONS.SUBJECTS, subjectId, data);
  },

  async delete(subjectId: string): Promise<void> {
    await deleteDocument(COLLECTIONS.SUBJECTS, subjectId);
  },
};
