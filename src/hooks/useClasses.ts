import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Class } from '../types/class.types';
import { useAuth } from './useAuth';
import { COLLECTIONS } from '../utils/firestore';

export const useClasses = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const classesQuery = query(
      collection(db, COLLECTIONS.CLASSES),
      where('teacherId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      classesQuery,
      (snapshot) => {
        const classesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Class[];

        // Сортируем на клиенте по дате создания
        classesData.sort((a, b) => {
          const dateA = a.createdAt?.toMillis?.() || 0;
          const dateB = b.createdAt?.toMillis?.() || 0;
          return dateB - dateA;
        });

        setClasses(classesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching classes:', err);
        setError('Ошибка загрузки классов');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { classes, loading, error };
};
