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
  const [formData, setFormData] = useState({ label: '', order: 0 });

  const resetForm = () => {
    setFormData({ label: '', order: tags.length });
    setEditingId(null);
    setIsAdding(false);
  };

  const startEdit = (tag: Tag) => {
    setFormData({
      label: tag.label,
      order: tag.order,
    });
    setEditingId(tag.id);
    setIsAdding(false);
  };

  const startAdd = () => {
    setFormData({ label: '', order: tags.length });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.label.trim()) {
      toast.error('Тегтің атауын енгізіңіз');
      return;
    }

    try {
      if (isAdding) {
        await tagService.create({
          label: formData.label.trim(),
          order: formData.order,
        });
        toast.success('Тег қосылды');
      } else if (editingId) {
        await tagService.update(editingId, {
          label: formData.label.trim(),
          order: formData.order,
        });
        toast.success('Тег жаңарды');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving tag:', error);
      toast.error('Сақтау кезінде қате кетті');
    }
  };

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`"${tag.label}" тегін жою керек пе? Бұл тег барлық артефакттерден жойылады.`)) return;

    setDeletingId(tag.id);
    try {
      const updatedCount = await tagService.deleteWithCascade(tag.id);
      if (updatedCount > 0) {
        toast.success(`Тег ${updatedCount} артефакттен жойылды`);
      } else {
        toast.success('Тег жойылды');
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Жою кезінде қате кетті');
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
          <h1 className="text-2xl font-bold text-gray-900">Тегтер</h1>
          {!isAdding && !editingId && (
            <button
              onClick={startAdd}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Тег қосу
            </button>
          )}
        </div>

        {(isAdding || editingId) && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {isAdding ? 'Жаңа тег' : 'Өңдеу'}
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Атауы
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, label: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ойын, Тест, Таймер..."
                  />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Реті
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
                  Сақтау
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Кері қайту
                </button>
              </div>
            </div>
          </div>
        )}

        {tags.length === 0 && !isAdding ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 mb-4">Әзірге тегтер жоқ</p>
            <button
              onClick={startAdd}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Тег қосу
            </button>
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
                  <span className="text-xs text-gray-400">
                    (реті: {tag.order})
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(tag)}
                    className="px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    Өңдеу
                  </button>
                  <button
                    onClick={() => handleDelete(tag)}
                    disabled={deletingId === tag.id}
                    className="px-3 py-1.5 text-sm text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    {deletingId === tag.id ? 'Жойылуда...' : 'Жою'}
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
