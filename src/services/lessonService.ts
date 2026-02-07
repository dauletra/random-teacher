import {
  where,
  Timestamp,
  orderBy,
  collection,
  query,
  getDocs,
  doc,
} from 'firebase/firestore';
import type { Lesson, Attendance, Grade } from '../types/lesson.types';
import {
  COLLECTIONS,
  createDocument,
  getDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  runFirestoreTransaction,
} from '../utils/firestore';
import { db } from '../config/firebase';
import { cache, cacheKeys } from '../utils/cache';

export const lessonService = {
  async getOrCreateTodayLesson(journalId: string): Promise<Lesson> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTimestamp = Timestamp.fromDate(tomorrow);

    // Use Firestore transaction to prevent race condition
    // This ensures atomic "check and create" operation
    return await runFirestoreTransaction(async (transaction) => {
      // 1. Check for existing lesson within the transaction
      const lessonsRef = collection(db, COLLECTIONS.LESSONS);
      const q = query(
        lessonsRef,
        where('journalId', '==', journalId),
        where('date', '>=', todayTimestamp),
        where('date', '<', tomorrowTimestamp)
      );

      const snapshot = await getDocs(q);

      // 2. If lesson exists, return it
      if (!snapshot.empty) {
        const existingDoc = snapshot.docs[0];
        return {
          id: existingDoc.id,
          ...existingDoc.data()
        } as Lesson;
      }

      // 3. If not found, create new lesson within the same transaction
      const newLessonRef = doc(lessonsRef);
      const newLesson: Lesson = {
        id: newLessonRef.id,
        journalId,
        date: todayTimestamp,
      };

      transaction.set(newLessonRef, {
        journalId,
        date: todayTimestamp,
        createdAt: Timestamp.now(),
      });

      return newLesson;
    });
  },

  async getById(lessonId: string): Promise<Lesson | null> {
    return await getDocument<Lesson>(COLLECTIONS.LESSONS, lessonId);
  },

  async getByJournalId(journalId: string): Promise<Lesson[]> {
    return await getDocuments<Lesson>(
      COLLECTIONS.LESSONS,
      where('journalId', '==', journalId),
      orderBy('date', 'desc')
    );
  },

  async delete(lessonId: string): Promise<void> {
    await deleteDocument(COLLECTIONS.LESSONS, lessonId);
    // Invalidate attendance and grades cache for this lesson
    cache.delete(cacheKeys.attendance(lessonId));
    cache.delete(cacheKeys.grades(lessonId));
  },

  async markAttendance(
    lessonId: string,
    studentId: string,
    isPresent: boolean
  ): Promise<string> {
    const existing = await getDocuments<Attendance>(
      COLLECTIONS.ATTENDANCE,
      where('lessonId', '==', lessonId),
      where('studentId', '==', studentId)
    );

    let id: string;
    if (existing.length > 0) {
      await updateDocument<Attendance>(COLLECTIONS.ATTENDANCE, existing[0].id, {
        isPresent,
      });
      id = existing[0].id;
    } else {
      id = await createDocument<Attendance>(COLLECTIONS.ATTENDANCE, {
        lessonId,
        studentId,
        isPresent,
      });
    }

    // Invalidate attendance cache for this lesson
    cache.delete(cacheKeys.attendance(lessonId));
    return id;
  },

  async getAttendance(lessonId: string): Promise<Attendance[]> {
    const cached = cache.get<Attendance[]>(cacheKeys.attendance(lessonId));
    if (cached) return cached;

    const result = await getDocuments<Attendance>(
      COLLECTIONS.ATTENDANCE,
      where('lessonId', '==', lessonId)
    );
    cache.set(cacheKeys.attendance(lessonId), result);
    return result;
  },

  async addGrade(
    lessonId: string,
    studentId: string,
    grade: number,
    comment?: string
  ): Promise<string> {
    const id = await createDocument<Grade>(COLLECTIONS.GRADES, {
      lessonId,
      studentId,
      grade,
      comment,
    });
    cache.delete(cacheKeys.grades(lessonId));
    return id;
  },

  async getGrades(lessonId: string): Promise<Grade[]> {
    const cached = cache.get<Grade[]>(cacheKeys.grades(lessonId));
    if (cached) return cached;

    const result = await getDocuments<Grade>(
      COLLECTIONS.GRADES,
      where('lessonId', '==', lessonId)
    );
    cache.set(cacheKeys.grades(lessonId), result);
    return result;
  },

  async updateGrade(
    gradeId: string,
    data: { grade?: number; comment?: string }
  ): Promise<void> {
    await updateDocument<Grade>(COLLECTIONS.GRADES, gradeId, data);
    cache.invalidatePattern('grades:');
  },

  async deleteGrade(gradeId: string): Promise<void> {
    await deleteDocument(COLLECTIONS.GRADES, gradeId);
    cache.invalidatePattern('grades:');
  },
};
