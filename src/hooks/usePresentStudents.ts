import { useMemo } from 'react';
import type { Student } from '../types/student.types';

/**
 * Хук для фильтрации присутствующих учеников
 */
export const usePresentStudents = (
  students: Student[],
  attendance: Map<string, boolean>
): Student[] => {
  return useMemo(() => {
    return students.filter(student => attendance.get(student.id) ?? true);
  }, [students, attendance]);
};
