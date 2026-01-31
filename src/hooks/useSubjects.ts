import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Subject } from '../types/artifact.types';
import { COLLECTIONS } from '../utils/firestore';

export const useSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const subjectsQuery = query(
      collection(db, COLLECTIONS.SUBJECTS),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(
      subjectsQuery,
      (snapshot) => {
        const subjectsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Subject[];

        setSubjects(subjectsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching subjects:', err);
        setError('Ошибка загрузки предметов');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { subjects, loading, error };
};
