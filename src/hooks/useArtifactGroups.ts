import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, type QueryConstraint } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ArtifactGroup } from '../types/artifact.types';
import { COLLECTIONS } from '../utils/firestore';
import { normalizeArtifactGroup } from '../utils/artifactHelpers';

interface UseArtifactGroupsOptions {
  publicOnly?: boolean;
  subjectId?: string;
  authorId?: string;
}

export const useArtifactGroups = (options: UseArtifactGroupsOptions = {}) => {
  const { publicOnly = false, subjectId, authorId } = options;
  const [groups, setGroups] = useState<ArtifactGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const constraints: QueryConstraint[] = [];

    if (publicOnly) {
      constraints.push(where('isPublic', '==', true));
    }

    if (subjectId) {
      constraints.push(where('subjectId', '==', subjectId));
    }

    if (authorId) {
      constraints.push(where('authorId', '==', authorId));
    }

    const groupsQuery = query(
      collection(db, COLLECTIONS.ARTIFACT_GROUPS),
      ...constraints
    );

    const unsubscribe = onSnapshot(
      groupsQuery,
      (snapshot) => {
        const groupsData = snapshot.docs.map(doc =>
          normalizeArtifactGroup({ id: doc.id, ...doc.data() })
        );

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
  }, [publicOnly, subjectId, authorId]);

  return { groups, loading, error };
};
