import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ArtifactGroup } from '../types/artifact.types';
import { COLLECTIONS } from '../utils/firestore';

interface UseArtifactGroupsOptions {
  publicOnly?: boolean;
  subjectId?: string;
}

export const useArtifactGroups = (options: UseArtifactGroupsOptions = {}) => {
  const { publicOnly = false, subjectId } = options;
  const [groups, setGroups] = useState<ArtifactGroup[]>([]);
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

    const groupsQuery = query(
      collection(db, COLLECTIONS.ARTIFACT_GROUPS),
      ...constraints
    );

    const unsubscribe = onSnapshot(
      groupsQuery,
      (snapshot) => {
        const groupsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ArtifactGroup[];

        groupsData.sort((a, b) => (a.order || 0) - (b.order || 0));

        setGroups(groupsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching artifact groups:', err);
        setError('Ошибка загрузки групп артефактов');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [publicOnly, subjectId]);

  return { groups, loading, error };
};
