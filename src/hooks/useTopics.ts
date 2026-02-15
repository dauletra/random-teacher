import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Topic } from '../types/artifact.types';
import { COLLECTIONS } from '../utils/firestore';

export const useTopics = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const topicsQuery = query(
      collection(db, COLLECTIONS.TOPICS),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(
      topicsQuery,
      (snapshot) => {
        const topicsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Topic[];

        setTopics(topicsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching topics:', err);
        setError('Тақырыптарды жүктеу кезінде қате');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { topics, loading, error };
};
