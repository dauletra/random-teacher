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

export const DashboardPage = () => {
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
      toast.success('Класс создан!');
      setShowForm(false);
    } catch (error) {
      console.error('Error creating class:', error);
      toast.error('Ошибка создания класса');
    }
  };

  const handleUpdate = async (name: string) => {
    if (!editingClass) return;

    try {
      await classService.update(editingClass.id, { name });
      toast.success('Класс обновлен!');
      setEditingClass(null);
    } catch (error) {
      console.error('Error updating class:', error);
      toast.error('Ошибка обновления класса');
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
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Добро пожаловать, {user?.displayName || 'Учитель'}!
      </h1>

      {/* Create/Edit Form Modal */}
      <Modal
        isOpen={showForm || !!editingClass}
        onClose={handleCancel}
        title={editingClass ? 'Редактировать класс' : 'Создать класс'}
      >
        <ClassForm
          onSubmit={editingClass ? handleUpdate : handleCreate}
          onCancel={handleCancel}
          initialData={editingClass || undefined}
          submitLabel={editingClass ? 'Сохранить' : 'Создать'}
        />
      </Modal>

      {/* Classes List */}
      <div className="flex-1">
        <ClassList
          classes={classes}
          journalsByClass={journalsByClass}
          onCreateClick={() => setShowForm(true)}
        />
      </div>
    </div>
  );
};
