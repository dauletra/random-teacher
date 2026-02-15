import type { Mode } from '../types/artifact.types';
import {
  COLLECTIONS,
  createDocument,
  getDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  orderBy,
} from '../utils/firestore';

export const modeService = {
  async create(data: Omit<Mode, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return await createDocument<Mode>(COLLECTIONS.MODES, data);
  },

  async getById(modeId: string): Promise<Mode | null> {
    return await getDocument<Mode>(COLLECTIONS.MODES, modeId);
  },

  async getAll(): Promise<Mode[]> {
    return await getDocuments<Mode>(
      COLLECTIONS.MODES,
      orderBy('order', 'asc')
    );
  },

  async update(modeId: string, data: Partial<Omit<Mode, 'id' | 'createdAt'>>): Promise<void> {
    await updateDocument<Mode>(COLLECTIONS.MODES, modeId, data);
  },

  async delete(modeId: string): Promise<void> {
    await deleteDocument(COLLECTIONS.MODES, modeId);
  },
};
