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

    if (existing.length > 0) {
      await updateDocument<Attendance>(COLLECTIONS.ATTENDANCE, existing[0].id, {
        isPresent,
      });
      return existing[0].id;
    }

    return await createDocument<Attendance>(COLLECTIONS.ATTENDANCE, {
      lessonId,
      studentId,
      isPresent,
    });
  },

  async getAttendance(lessonId: string): Promise<Attendance[]> {
    return await getDocuments<Attendance>(
      COLLECTIONS.ATTENDANCE,
      where('lessonId', '==', lessonId)
    );
  },

  async addGrade(
    lessonId: string,
    studentId: string,
    grade: number,
    comment?: string
  ): Promise<string> {
    return await createDocument<Grade>(COLLECTIONS.GRADES, {
      lessonId,
      studentId,
      grade,
      comment,
    });
  },

  async getGrades(lessonId: string): Promise<Grade[]> {
    return await getDocuments<Grade>(
      COLLECTIONS.GRADES,
      where('lessonId', '==', lessonId)
    );
  },

  async updateGrade(
    gradeId: string,
    data: { grade?: number; comment?: string }
  ): Promise<void> {
    await updateDocument<Grade>(COLLECTIONS.GRADES, gradeId, data);
  },

  async deleteGrade(gradeId: string): Promise<void> {
    await deleteDocument(COLLECTIONS.GRADES, gradeId);
  },
};
