import type { Classroom } from '../types/classroom.types';
import {
  COLLECTIONS,
  createDocument,
  getDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  where,
} from '../utils/firestore';
import { cache } from '../utils/cache';

const cacheKeys = {
  classroom: (id: string) => `classroom:${id}`,
  classrooms: (teacherId: string) => `classrooms:teacher:${teacherId}`,
};

export const classroomService = {
  async create(teacherId: string, name: string, columns: number, desksPerColumn: number[]): Promise<string> {
    const classroomData = {
      teacherId,
      name,
      columns,
      desksPerColumn,
    };

    const id = await createDocument<Classroom>(COLLECTIONS.CLASSROOMS, classroomData);

    // Invalidate cache
    cache.invalidatePattern(`classrooms:teacher:${teacherId}`);

    return id;
  },

  async getById(classroomId: string): Promise<Classroom | null> {
    const cacheKey = cacheKeys.classroom(classroomId);

    // Check cache first
    if (cache.has(cacheKey)) {
      return cache.get<Classroom>(cacheKey);
    }

    const classroom = await getDocument<Classroom>(COLLECTIONS.CLASSROOMS, classroomId);

    if (classroom) {
      cache.set(cacheKey, classroom);
    }

    return classroom;
  },

  async getByTeacherId(teacherId: string): Promise<Classroom[]> {
    const cacheKey = cacheKeys.classrooms(teacherId);

    // Check cache first
    if (cache.has(cacheKey)) {
      return cache.get<Classroom[]>(cacheKey) || [];
    }

    const classrooms = await getDocuments<Classroom>(
      COLLECTIONS.CLASSROOMS,
      where('teacherId', '==', teacherId)
    );

    // Cache individual classrooms and the list
    classrooms.forEach(classroom => {
      cache.set(cacheKeys.classroom(classroom.id), classroom);
    });
    cache.set(cacheKey, classrooms);

    return classrooms;
  },

  async update(classroomId: string, data: { name?: string; columns?: number; desksPerColumn?: number[] }): Promise<void> {
    await updateDocument<Classroom>(COLLECTIONS.CLASSROOMS, classroomId, data);

    // Invalidate cache
    cache.delete(cacheKeys.classroom(classroomId));

    // Get classroom to invalidate teacher cache
    const classroom = await getDocument<Classroom>(COLLECTIONS.CLASSROOMS, classroomId);
    if (classroom) {
      cache.invalidatePattern(`classrooms:teacher:${classroom.teacherId}`);
    }
  },

  async delete(classroomId: string): Promise<void> {
    // Get classroom to invalidate teacher cache
    const classroom = await getDocument<Classroom>(COLLECTIONS.CLASSROOMS, classroomId);

    await deleteDocument(COLLECTIONS.CLASSROOMS, classroomId);

    // Invalidate cache
    cache.delete(cacheKeys.classroom(classroomId));
    if (classroom) {
      cache.invalidatePattern(`classrooms:teacher:${classroom.teacherId}`);
    }
  },
};
