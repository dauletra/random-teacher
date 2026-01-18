export interface StudentConflict {
  studentId1: string;
  studentId2: string;
}

export interface ClassConflicts {
  id: string;
  classId: string;
  conflicts: StudentConflict[];
}
