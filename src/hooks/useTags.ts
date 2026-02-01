import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Tag } from '../types/artifact.types';
import { COLLECTIONS } from '../utils/firestore';

export const useTags = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tagsQuery = query(
      collection(db, COLLECTIONS.TAGS),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(
      tagsQuery,
      (snapshot) => {
        const tagsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Tag[];

        setTags(tagsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching tags:', err);
        setError('Ошибка загрузки тегов');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { tags, loading, error };
};
