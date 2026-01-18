import { db } from '../config/firebase';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import type { ClassConflicts, StudentConflict } from '../types/conflict.types';

const COLLECTION = 'conflicts';

class ConflictService {
  async getByClassId(classId: string): Promise<StudentConflict[]> {
    const docRef = doc(db, COLLECTION, classId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as ClassConflicts;
      return data.conflicts || [];
    }

    return [];
  }

  async addConflict(classId: string, studentId1: string, studentId2: string): Promise<void> {
    const conflicts = await this.getByClassId(classId);

    // Проверка на дубликаты (A-B и B-A считаются одинаковыми)
    const isDuplicate = conflicts.some(c =>
      (c.studentId1 === studentId1 && c.studentId2 === studentId2) ||
      (c.studentId1 === studentId2 && c.studentId2 === studentId1)
    );

    if (isDuplicate) {
      throw new Error('Этот конфликт уже существует');
    }

    // Проверка, что это разные ученики
    if (studentId1 === studentId2) {
      throw new Error('Нельзя добавить конфликт ученика с самим собой');
    }

    const newConflict: StudentConflict = { studentId1, studentId2 };
    const updatedConflicts = [...conflicts, newConflict];

    const docRef = doc(db, COLLECTION, classId);
    await setDoc(docRef, {
      id: classId,
      classId,
      conflicts: updatedConflicts
    });
  }

  async removeConflict(classId: string, studentId1: string, studentId2: string): Promise<void> {
    const conflicts = await this.getByClassId(classId);

    const updatedConflicts = conflicts.filter(c =>
      !((c.studentId1 === studentId1 && c.studentId2 === studentId2) ||
        (c.studentId1 === studentId2 && c.studentId2 === studentId1))
    );

    const docRef = doc(db, COLLECTION, classId);
    await setDoc(docRef, {
      id: classId,
      classId,
      conflicts: updatedConflicts
    });
  }

  subscribe(classId: string, callback: (conflicts: StudentConflict[]) => void): () => void {
    const docRef = doc(db, COLLECTION, classId);

    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as ClassConflicts;
        callback(data.conflicts || []);
      } else {
        callback([]);
      }
    });
  }

  hasConflict(conflicts: StudentConflict[], studentId1: string, studentId2: string): boolean {
    return conflicts.some(c =>
      (c.studentId1 === studentId1 && c.studentId2 === studentId2) ||
      (c.studentId1 === studentId2 && c.studentId2 === studentId1)
    );
  }
}

export const conflictService = new ConflictService();
