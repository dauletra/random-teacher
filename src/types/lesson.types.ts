import type { Timestamp } from 'firebase/firestore';

export interface Lesson {
  id: string;
  journalId: string;
  date: Timestamp;
  createdAt?: Timestamp;
}

export interface Attendance {
  id: string;
  lessonId: string;
  studentId: string;
  isPresent: boolean;
  createdAt?: Timestamp;
}

export interface Grade {
  id: string;
  lessonId: string;
  studentId: string;
  grade: number;
  comment?: string;
  createdAt?: Timestamp;
}
