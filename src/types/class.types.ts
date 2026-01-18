import type { Timestamp } from 'firebase/firestore';

export interface Class {
  id: string;
  teacherId: string;
  name: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
