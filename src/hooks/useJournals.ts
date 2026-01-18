import { useState, useEffect } from 'react';
import { journalService } from '../services/journalService';
import type { Journal } from '../types/journal.types';

export const useJournals = (classId: string | null) => {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) {
      setJournals([]);
      setLoading(false);
      return;
    }

    const fetchJournals = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await journalService.getByClassId(classId);
        setJournals(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch journals');
      } finally {
        setLoading(false);
      }
    };

    fetchJournals();
  }, [classId]);

  const createJournal = async (name: string, isDefault: boolean = false) => {
    if (!classId) return;

    try {
      const id = await journalService.create(classId, name, isDefault);
      const newJournal: Journal = { id, classId, name, isDefault };
      setJournals([...journals, newJournal]);
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create journal');
      throw err;
    }
  };

  const updateJournal = async (journalId: string, name: string) => {
    try {
      await journalService.update(journalId, { name });
      setJournals(journals.map(j => j.id === journalId ? { ...j, name } : j));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update journal');
      throw err;
    }
  };

  const deleteJournal = async (journalId: string) => {
    try {
      await journalService.delete(journalId);
      setJournals(journals.filter(j => j.id !== journalId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete journal');
      throw err;
    }
  };

  return {
    journals,
    loading,
    error,
    createJournal,
    updateJournal,
    deleteJournal,
  };
};
