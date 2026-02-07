import type { Journal, JournalStudent } from '../types/journal.types';
import {
  COLLECTIONS,
  createDocument,
  getDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  setDocumentWithId,
  where,
} from '../utils/firestore';

export const journalService = {
  async create(classId: string, name: string, isDefault: boolean = false): Promise<string> {
    const journalData = {
      classId,
      name,
      isDefault,
    };

    return await createDocument<Journal>(COLLECTIONS.JOURNALS, journalData);
  },

  async getById(journalId: string): Promise<Journal | null> {
    return await getDocument<Journal>(COLLECTIONS.JOURNALS, journalId);
  },

  async getByClassId(classId: string): Promise<Journal[]> {
    return await getDocuments<Journal>(
      COLLECTIONS.JOURNALS,
      where('classId', '==', classId)
    );
  },

  async update(journalId: string, data: { name?: string; defaultClassroomId?: string }): Promise<void> {
    await updateDocument<Journal>(COLLECTIONS.JOURNALS, journalId, data);
  },

  async delete(journalId: string): Promise<void> {
    await deleteDocument(COLLECTIONS.JOURNALS, journalId);
  },

  async addStudent(journalId: string, studentId: string): Promise<string> {
    // Use deterministic ID to avoid check-then-create (N+1)
    // setDoc with this ID is idempotent — no read needed
    const docId = `${journalId}_${studentId}`;
    await setDocumentWithId<JournalStudent>(COLLECTIONS.JOURNAL_STUDENTS, docId, {
      journalId,
      studentId,
    });
    return docId;
  },

  async removeStudent(journalId: string, studentId: string): Promise<void> {
    // Deterministic ID — delete directly without querying first
    const docId = `${journalId}_${studentId}`;
    await deleteDocument(COLLECTIONS.JOURNAL_STUDENTS, docId);
  },

  async getStudentsByJournalId(journalId: string): Promise<string[]> {
    const journalStudents = await getDocuments<JournalStudent>(
      COLLECTIONS.JOURNAL_STUDENTS,
      where('journalId', '==', journalId)
    );

    return journalStudents.map(js => js.studentId);
  },

  async getJournalsByStudentId(studentId: string): Promise<string[]> {
    const journalStudents = await getDocuments<JournalStudent>(
      COLLECTIONS.JOURNAL_STUDENTS,
      where('studentId', '==', studentId)
    );

    return journalStudents.map(js => js.journalId);
  },
};
