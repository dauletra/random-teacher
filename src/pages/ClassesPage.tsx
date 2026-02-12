import { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useClasses } from '../hooks/useClasses';
import { useAllJournals } from '../hooks/useAllJournals';
import { classService } from '../services/classService';
import { ClassForm } from '../components/classes/ClassForm';
import { ClassList } from '../components/classes/ClassList';
import { Modal } from '../components/common/Modal';
import type { Class } from '../types/class.types';
import toast from 'react-hot-toast';

export const ClassesPage = () => {
  const { user } = useAuth();
  const { classes, loading, error } = useClasses();
  const classIds = useMemo(() => classes.map(c => c.id), [classes]);
  const { journalsByClass, loading: journalsLoading } = useAllJournals(classIds);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  const handleCreate = async (name: string) => {
    if (!user) return;

    try {
      await classService.create(user.uid, name);
      toast.success('Сынып жасалды!');
      setShowForm(false);
    } catch (error) {
      console.error('Error creating class:', error);
      toast.error('Сыныпты жасау кезінде қате кетті');
    }
  };

  const handleUpdate = async (name: string) => {
    if (!editingClass) return;

    try {
      await classService.update(editingClass.id, { name });
      toast.success('Сынып жаңарды!');
      setEditingClass(null);
    } catch (error) {
      console.error('Error updating class:', error);
      toast.error('Сыныпты жаңарту кезінде қате кетті');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingClass(null);
  };

  if (loading || journalsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Сыныптар</h1>
          <p className="text-gray-600 mt-1">
            Сыныпты және оқушыларды басқару
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Сыныпты жасау
        </button>
      </div>

      {/* Create/Edit Form Modal */}
      <Modal
        isOpen={showForm || !!editingClass}
        onClose={handleCancel}
        title={editingClass ? 'Сыныпты өңдеу' : 'Сыныпты жасау'}
      >
        <ClassForm
          onSubmit={editingClass ? handleUpdate : handleCreate}
          onCancel={handleCancel}
          initialData={editingClass || undefined}
          submitLabel={editingClass ? 'Сақтау' : 'Жасау'}
        />
      </Modal>

      {/* Classes List */}
      <ClassList classes={classes} journalsByClass={journalsByClass} />
    </div>
  );
};
