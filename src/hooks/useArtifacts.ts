import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Artifact } from '../types/artifact.types';
import { COLLECTIONS } from '../utils/firestore';

interface UseArtifactsOptions {
  groupId?: string;
}

export const useArtifacts = (options: UseArtifactsOptions = {}) => {
  const { groupId } = options;
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const constraints = [];

    if (groupId) {
      constraints.push(where('groupId', '==', groupId));
    }

    const artifactsQuery = query(
      collection(db, COLLECTIONS.ARTIFACTS),
      ...constraints
    );

    const unsubscribe = onSnapshot(
      artifactsQuery,
      (snapshot) => {
        const artifactsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Artifact[];

        artifactsData.sort((a, b) => (a.order || 0) - (b.order || 0));

        setArtifacts(artifactsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching artifacts:', err);
        setError('Ошибка загрузки артефактов');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  return { artifacts, loading, error };
};
