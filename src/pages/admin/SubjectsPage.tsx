import { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { useSubjects } from '../../hooks/useSubjects';
import { subjectService } from '../../services/subjectService';
import type { Subject } from '../../types/artifact.types';
import toast from 'react-hot-toast';

export const SubjectsPage = () => {
  const { subjects, loading } = useSubjects();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', icon: '', order: 0 });

  const resetForm = () => {
    setFormData({ name: '', icon: '', order: subjects.length });
    setEditingId(null);
    setIsAdding(false);
  };

  const startEdit = (subject: Subject) => {
    setFormData({
      name: subject.name,
      icon: subject.icon,
      order: subject.order,
    });
    setEditingId(subject.id);
    setIsAdding(false);
  };

  const startAdd = () => {
    setFormData({ name: '', icon: '', order: subjects.length });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Введите название предмета');
      return;
    }

    if (!formData.icon.trim()) {
      toast.error('Введите иконку (эмодзи)');
      return;
    }

    try {
      if (isAdding) {
        await subjectService.create({
          name: formData.name.trim(),
          icon: formData.icon.trim(),
          order: formData.order,
        });
        toast.success('Предмет добавлен');
      } else if (editingId) {
        await subjectService.update(editingId, {
          name: formData.name.trim(),
          icon: formData.icon.trim(),
          order: formData.order,
        });
        toast.success('Предмет обновлен');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving subject:', error);
      toast.error('Ошибка сохранения');
    }
  };

  const handleDelete = async (subject: Subject) => {
    if (!confirm(`Удалить предмет "${subject.name}"?`)) return;

    setDeletingId(subject.id);
    try {
      await subjectService.delete(subject.id);
      toast.success('Предмет удален');
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast.error('Ошибка при удалении');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Предметы</h1>
          {!isAdding && !editingId && (
            <button
              onClick={startAdd}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Добавить предмет
            </button>
          )}
        </div>

        {(isAdding || editingId) && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {isAdding ? 'Новый предмет' : 'Редактирование'}
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Иконка
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, icon: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-2xl"
                    placeholder="📚"
                    maxLength={4}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Математика"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Порядок
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        order: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Сохранить
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {subjects.length === 0 && !isAdding ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 mb-4">Предметов пока нет</p>
            <button
              onClick={startAdd}
              className="text-indigo-600 hover:text-indigo-700"
            >
              Добавить первый предмет
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{subject.icon}</span>
                  <span className="font-medium text-gray-900">
                    {subject.name}
                  </span>
                  <span className="text-sm text-gray-500">
                    (порядок: {subject.order})
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(subject)}
                    className="px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(subject)}
                    disabled={deletingId === subject.id}
                    className="px-3 py-1.5 text-sm text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    {deletingId === subject.id ? 'Удаление...' : 'Удалить'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
