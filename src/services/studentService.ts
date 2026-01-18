import type { Student } from '../types/student.types';
import {
  COLLECTIONS,
  createDocument,
  getDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  where,
  getDocumentsByIds,
} from '../utils/firestore';
import { cache, cacheKeys } from '../utils/cache';

export const studentService = {
  async create(
    classId: string,
    firstName: string,
    lastName: string
  ): Promise<string> {
    const studentData = {
      classId,
      firstName,
      lastName,
    };

    const id = await createDocument<Student>(COLLECTIONS.STUDENTS, studentData);

    // Invalidate cache for this class
    cache.invalidatePattern(`students:class:${classId}`);

    return id;
  },

  async getById(studentId: string): Promise<Student | null> {
    const cacheKey = cacheKeys.student(studentId);
    const cached = cache.get<Student>(cacheKey);

    if (cached) {
      return cached;
    }

    const student = await getDocument<Student>(COLLECTIONS.STUDENTS, studentId);

    if (student) {
      cache.set(cacheKey, student);
    }

    return student;
  },

  async getByIds(studentIds: string[]): Promise<Student[]> {
    if (studentIds.length === 0) return [];

    const cacheKey = cacheKeys.studentsByIds(studentIds);
    const cached = cache.get<Student[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const students = await getDocumentsByIds<Student>(COLLECTIONS.STUDENTS, studentIds);
    cache.set(cacheKey, students);

    return students;
  },

  async getByClassId(classId: string): Promise<Student[]> {
    const cacheKey = cacheKeys.students(classId);
    const cached = cache.get<Student[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const students = await getDocuments<Student>(
      COLLECTIONS.STUDENTS,
      where('classId', '==', classId)
    );

    cache.set(cacheKey, students);

    return students;
  },

  async update(
    studentId: string,
    data: {
      firstName?: string;
      lastName?: string;
    }
  ): Promise<void> {
    await updateDocument<Student>(COLLECTIONS.STUDENTS, studentId, data);

    // Invalidate cache for this student
    cache.delete(cacheKeys.student(studentId));
    cache.invalidatePattern('students:');
  },

  async delete(studentId: string): Promise<void> {
    await deleteDocument(COLLECTIONS.STUDENTS, studentId);

    // Invalidate cache for this student
    cache.delete(cacheKeys.student(studentId));
    cache.invalidatePattern('students:');
  },
};
