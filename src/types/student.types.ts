import type { Timestamp } from 'firebase/firestore';

export interface Student {
  id: string;
  classId: string;
  firstName: string;
  lastName: string;
  createdAt?: Timestamp;
}
