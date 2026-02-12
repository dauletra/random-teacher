import type { Class } from '../types/class.types';
import type { Journal } from '../types/journal.types';
import {
  COLLECTIONS,
  createDocument,
  getDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  where,
} from '../utils/firestore';

export const classService = {
  async create(teacherId: string, name: string): Promise<string> {
    const classData = {
      teacherId,
      name,
    };

    const classId = await createDocument<Class>(COLLECTIONS.CLASSES, classData);

    await createDocument<Journal>(COLLECTIONS.JOURNALS, {
      classId,
      name: 'Жалпы журнал',
      isDefault: true,
    });

    return classId;
  },

  async getById(classId: string): Promise<Class | null> {
    return await getDocument<Class>(COLLECTIONS.CLASSES, classId);
  },

  async getByTeacherId(teacherId: string): Promise<Class[]> {
    return await getDocuments<Class>(
      COLLECTIONS.CLASSES,
      where('teacherId', '==', teacherId)
    );
  },

  async update(classId: string, data: { name?: string }): Promise<void> {
    await updateDocument<Class>(COLLECTIONS.CLASSES, classId, data);
  },

  async delete(classId: string): Promise<void> {
    await deleteDocument(COLLECTIONS.CLASSES, classId);
  },
};
