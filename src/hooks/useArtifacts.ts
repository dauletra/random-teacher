import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Artifact } from '../types/artifact.types';
import { COLLECTIONS } from '../utils/firestore';

interface UseArtifactsOptions {
  publicOnly?: boolean;
  subjectId?: string;
}

export const useArtifacts = (options: UseArtifactsOptions = {}) => {
  const { publicOnly = false, subjectId } = options;
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const constraints = [];

    if (publicOnly) {
      constraints.push(where('isPublic', '==', true));
    }

    if (subjectId) {
      constraints.push(where('subjectId', '==', subjectId));
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

        // Sort by order on client side
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
  }, [publicOnly, subjectId]);

  return { artifacts, loading, error };
};
