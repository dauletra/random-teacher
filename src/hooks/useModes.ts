import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Mode } from '../types/artifact.types';
import { COLLECTIONS } from '../utils/firestore';

export const useModes = () => {
  const [modes, setModes] = useState<Mode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const modesQuery = query(
      collection(db, COLLECTIONS.MODES),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(
      modesQuery,
      (snapshot) => {
        const modesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Mode[];

        setModes(modesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching modes:', err);
        setError('Режимдерді жүктеу кезінде қате');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { modes, loading, error };
};
