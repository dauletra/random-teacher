import { useState, useEffect } from 'react';
import type { StudentConflict } from '../types/conflict.types';
import { conflictService } from '../services/conflictService';

/**
 * Хук для подписки на конфликты класса
 */
export const useConflicts = (classId: string): StudentConflict[] => {
  const [conflicts, setConflicts] = useState<StudentConflict[]>([]);

  useEffect(() => {
    if (!classId) return;

    const unsubscribe = conflictService.subscribe(classId, setConflicts);
    return () => unsubscribe();
  }, [classId]);

  return conflicts;
};
