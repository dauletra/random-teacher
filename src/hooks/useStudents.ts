import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS } from '../utils/firestore';
import type { Student } from '../types/student.types';

export const useStudents = (classId: string) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
  }, []);

  useEffect(() => {
    if (!classId) {
      return;
    }

    const studentsQuery = query(
      collection(db, COLLECTIONS.STUDENTS),
      where('classId', '==', classId)
    );

    const unsubscribe = onSnapshot(
      studentsQuery,
      (snapshot) => {
        const studentsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Student[];

        // Sort on client-side: by lastName, then firstName
        studentsData.sort((a, b) => {
          const lastNameCompare = a.lastName.localeCompare(b.lastName, 'ru');
          if (lastNameCompare !== 0) return lastNameCompare;
          return a.firstName.localeCompare(b.firstName, 'ru');
        });

        setStudents(studentsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching students:', err);
        setError('Ошибка загрузки учеников');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [classId]);

  return { students, loading, error, refetch };
};
