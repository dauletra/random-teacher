import { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { useTopics } from '../../hooks/useTopics';
import { topicService } from '../../services/topicService';
import type { Topic } from '../../types/artifact.types';
import toast from 'react-hot-toast';

export const TopicsPage = () => {
  const { topics, loading } = useTopics();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ label: '', order: 0 });

  const resetForm = () => {
    setFormData({ label: '', order: topics.length });
    setEditingId(null);
    setIsAdding(false);
  };

  const startEdit = (topic: Topic) => {
    setFormData({ label: topic.label, order: topic.order });
    setEditingId(topic.id);
    setIsAdding(false);
  };

  const startAdd = () => {
    setFormData({ label: '', order: topics.length });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.label.trim()) {
      toast.error('Тақырыптың атауын енгізіңіз');
      return;
    }

    try {
      if (isAdding) {
        await topicService.create({
          label: formData.label.trim(),
          order: formData.order,
        });
        toast.success('Тақырып қосылды');
      } else if (editingId) {
        await topicService.update(editingId, {
          label: formData.label.trim(),
          order: formData.order,
        });
        toast.success('Тақырып жаңарды');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving topic:', error);
      toast.error('Сақтау кезінде қате кетті');
    }
  };

  const handleDelete = async (topic: Topic) => {
    if (!confirm(`"${topic.label}" тақырыбын жою керек пе?`)) return;
    try {
      await topicService.delete(topic.id);
      toast.success('Тақырып жойылды');
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast.error('Жою кезінде қате кетті');
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
          <h1 className="text-2xl font-bold text-gray-900">Тақырыптар (Topics)</h1>
          {!isAdding && !editingId && (
            <button
              onClick={startAdd}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Тақырып қосу
            </button>
          )}
        </div>

        {(isAdding || editingId) && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {isAdding ? 'Жаңа тақырып' : 'Өңдеу'}
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Атауы</label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData((prev) => ({ ...prev, label: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Механика, Оптика, Электр..."
                  />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Реті</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
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

        {topics.length === 0 && !isAdding ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 mb-4">Әзірге тақырыптар жоқ</p>
            <button
              onClick={startAdd}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Тақырып қосу
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
            {topics.map((topic) => (
              <div key={topic.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                    {topic.label}
                  </span>
                  <span className="text-xs text-gray-400">(реті: {topic.order})</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(topic)}
                    className="px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    Өңдеу
                  </button>
                  <button
                    onClick={() => handleDelete(topic)}
                    className="px-3 py-1.5 text-sm text-red-600 hover:text-red-900"
                  >
                    Жою
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
