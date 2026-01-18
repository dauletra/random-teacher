import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Journal } from '../types/journal.types';
import { COLLECTIONS } from '../utils/firestore';

export const useAllJournals = (classIds: string[]) => {
  const [journalsByClass, setJournalsByClass] = useState<Record<string, Journal[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (classIds.length === 0) {
      setJournalsByClass({});
      setLoading(false);
      return;
    }

    // Firestore 'in' queries are limited to 10 items, so we need to batch
    const batches: string[][] = [];
    for (let i = 0; i < classIds.length; i += 10) {
      batches.push(classIds.slice(i, i + 10));
    }

    const unsubscribes: (() => void)[] = [];

    batches.forEach(batch => {
      const journalsQuery = query(
        collection(db, COLLECTIONS.JOURNALS),
        where('classId', 'in', batch)
      );

      const unsubscribe = onSnapshot(
        journalsQuery,
        (snapshot) => {
          const newJournals = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Journal[];

          setJournalsByClass(prev => {
            const updated = { ...prev };

            // Group journals by classId
            newJournals.forEach(journal => {
              if (!updated[journal.classId]) {
                updated[journal.classId] = [];
              }

              // Remove old version if exists
              updated[journal.classId] = updated[journal.classId].filter(j => j.id !== journal.id);
              // Add new version
              updated[journal.classId].push(journal);
            });

            return updated;
          });

          setLoading(false);
        },
        (err) => {
          console.error('Error fetching journals:', err);
          setLoading(false);
        }
      );

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [classIds.join(',')]);

  return { journalsByClass, loading };
};
