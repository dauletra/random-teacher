import { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { useTags } from '../../hooks/useTags';
import { tagService } from '../../services/tagService';
import type { Tag } from '../../types/artifact.types';
import toast from 'react-hot-toast';

export const TagsPage = () => {
  const { tags, loading } = useTags();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [formData, setFormData] = useState({ name: '', label: '', order: 0 });

  const resetForm = () => {
    setFormData({ name: '', label: '', order: tags.length });
    setEditingId(null);
    setIsAdding(false);
  };

  const startEdit = (tag: Tag) => {
    setFormData({
      name: tag.name,
      label: tag.label,
      order: tag.order,
    });
    setEditingId(tag.id);
    setIsAdding(false);
  };

  const startAdd = () => {
    setFormData({ name: '', label: '', order: tags.length });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Введите идентификатор тега (англ.)');
      return;
    }

    if (!formData.label.trim()) {
      toast.error('Введите название тега');
      return;
    }

    // Validate name format (lowercase, no spaces)
    const name = formData.name.trim().toLowerCase().replace(/\s+/g, '-');

    try {
      if (isAdding) {
        await tagService.create({
          name,
          label: formData.label.trim(),
          order: formData.order,
        });
        toast.success('Тег добавлен');
      } else if (editingId) {
        await tagService.update(editingId, {
          name,
          label: formData.label.trim(),
          order: formData.order,
        });
        toast.success('Тег обновлен');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving tag:', error);
      toast.error('Ошибка сохранения');
    }
  };

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`Удалить тег "${tag.label}"? Тег будет удален из всех артефактов.`)) return;

    setDeletingId(tag.id);
    try {
      const updatedCount = await tagService.deleteWithCascade(tag.id);
      if (updatedCount > 0) {
        toast.success(`Тег удален из ${updatedCount} артефактов`);
      } else {
        toast.success('Тег удален');
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Ошибка при удалении');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSeedDefaults = async () => {
    setIsSeeding(true);
    try {
      const addedCount = await tagService.seedDefaultTags();
      if (addedCount > 0) {
        toast.success(`Добавлено ${addedCount} тегов`);
      } else {
        toast.success('Все теги уже существуют');
      }
    } catch (error) {
      console.error('Error seeding tags:', error);
      toast.error('Ошибка при добавлении тегов');
    } finally {
      setIsSeeding(false);
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
          <h1 className="text-2xl font-bold text-gray-900">Теги</h1>
          {!isAdding && !editingId && (
            <div className="flex gap-2">
              <button
                onClick={handleSeedDefaults}
                disabled={isSeeding}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {isSeeding ? 'Добавление...' : 'Добавить стандартные'}
              </button>
              <button
                onClick={startAdd}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Добавить тег
              </button>
            </div>
          )}
        </div>

        {(isAdding || editingId) && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {isAdding ? 'Новый тег' : 'Редактирование'}
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Идентификатор (англ.)
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="game, test, timer..."
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, label: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Игра, Тест, Таймер..."
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

        {tags.length === 0 && !isAdding ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 mb-4">Тегов пока нет</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleSeedDefaults}
                disabled={isSeeding}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isSeeding ? 'Добавление...' : 'Добавить стандартные теги'}
              </button>
              <button
                onClick={startAdd}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Добавить свой тег
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                    {tag.label}
                  </span>
                  <span className="text-sm text-gray-500">
                    {tag.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    (порядок: {tag.order})
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(tag)}
                    className="px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(tag)}
                    disabled={deletingId === tag.id}
                    className="px-3 py-1.5 text-sm text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    {deletingId === tag.id ? 'Удаление...' : 'Удалить'}
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
