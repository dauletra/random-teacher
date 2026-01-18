import type { Timestamp } from 'firebase/firestore';

export interface Team {
  id: string;
  name: string;
  students: string[]; // student IDs
  color: string;
}

export interface Pair {
  student1Id: string;
  student2Id: string | null; // null if odd number of students
}

export interface SeatingArrangement {
  rows: number;
  desksPerRow: number;
  desks: Desk[];
}

export interface Desk {
  row: number;
  position: number;
  studentId: string | null;
}

export interface RandomizerSettings {
  id: string;
  teacherId: string;
  classId: string;
  desksCount?: number;
  rows?: number;
  desksPerRow?: number;
  lastTeamsDivision?: Team[];
  lastPairs?: Pair[];
  lastSeatingArrangement?: SeatingArrangement;
  updatedAt: Timestamp;
}
