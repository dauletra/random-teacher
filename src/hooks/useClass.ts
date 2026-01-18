import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Class } from '../types/class.types';
import { COLLECTIONS } from '../utils/firestore';

export const useClass = (classId: string) => {
  const [classData, setClassData] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) {
      setLoading(false);
      return;
    }

    const classDoc = doc(db, COLLECTIONS.CLASSES, classId);

    const unsubscribe = onSnapshot(
      classDoc,
      (snapshot) => {
        if (snapshot.exists()) {
          setClassData({
            id: snapshot.id,
            ...snapshot.data()
          } as Class);
        } else {
          setError('Класс не найден');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching class:', err);
        setError('Ошибка загрузки класса');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [classId]);

  return { classData, loading, error };
};
