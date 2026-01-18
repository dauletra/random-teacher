import type { Timestamp } from 'firebase/firestore';

export interface Journal {
  id: string;
  classId: string;
  name: string;
  isDefault: boolean;
  defaultClassroomId?: string;  // ID кабинета по умолчанию (опционально)
  createdAt?: Timestamp;
}

export interface JournalStudent {
  id: string;
  journalId: string;
  studentId: string;
  addedAt?: Timestamp;
}
