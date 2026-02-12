import { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { useSubjects } from '../../hooks/useSubjects';
import { subjectService } from '../../services/subjectService';
import type { Subject } from '../../types/artifact.types';
import toast from 'react-hot-toast';

const SUBJECT_EMOJIS = [
  '📚', '📐', '🔬', '⚛️', '🧪', '🧬', '🌍', '🗺️',
  '📜', '🏛️', '🎨', '🎵', '🎭', '⚽', '🏃', '💻',
  '🤖', '📊', '📝', '🇬🇧', '🇰🇿', '🧮', '🔢', '📖',
  '✏️', '🎯', '💡', '🌱', '🔧', '🎓',
];

const DEFAULT_EMOJI = '📚';

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
    setFormData({ name: '', icon: DEFAULT_EMOJI, order: subjects.length });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Пән атауын енгізіңіз');
      return;
    }

    if (!formData.icon.trim()) {
      toast.error('Эмодзи таңдаңыз');
      return;
    }

    try {
      if (isAdding) {
        await subjectService.create({
          name: formData.name.trim(),
          icon: formData.icon.trim(),
          order: formData.order,
        });
        toast.success('Пән қосылды');
      } else if (editingId) {
        await subjectService.update(editingId, {
          name: formData.name.trim(),
          icon: formData.icon.trim(),
          order: formData.order,
        });
        toast.success('Пән жаңартылды');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving subject:', error);
      toast.error('Сақтау кезінде қате кетті');
    }
  };

  const handleDelete = async (subject: Subject) => {
    if (!confirm(`"${subject.name}" пәнін жою керек пе?`)) return;

    setDeletingId(subject.id);
    try {
      await subjectService.delete(subject.id);
      toast.success('Пән жойылды');
    } catch (error) {
      console.error('Error deleting subject:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">Пәндер</h1>
          {!isAdding && !editingId && (
            <button
              onClick={startAdd}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Пән қосылды
            </button>
          )}
        </div>

        {(isAdding || editingId) && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {isAdding ? 'Жаңа пән' : 'Өңдеу'}
            </h2>
            <div className="space-y-4">
              {/* Emoji picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Эмодзи
                </label>
                <div className="flex gap-3 items-start mb-2">
                  <div className="w-14 h-14 border-2 border-indigo-200 rounded-xl flex items-center justify-center text-3xl bg-indigo-50 flex-shrink-0">
                    {formData.icon || DEFAULT_EMOJI}
                  </div>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, icon: e.target.value }))
                    }
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center text-xl"
                    placeholder="📚"
                    maxLength={4}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SUBJECT_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, icon: emoji }))
                      }
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center hover:bg-indigo-50 transition-colors ${
                        formData.icon === emoji
                          ? 'bg-indigo-100 ring-2 ring-indigo-500'
                          : 'bg-gray-50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name + Order */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Атауы
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Механика"
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

        {subjects.length === 0 && !isAdding ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 mb-4">Әзірге пәндер жоқ</p>
            <button
              onClick={startAdd}
              className="text-indigo-600 hover:text-indigo-700"
            >
              Алғашқы пәнді енгізу
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
                    Өңдеу
                  </button>
                  <button
                    onClick={() => handleDelete(subject)}
                    disabled={deletingId === subject.id}
                    className="px-3 py-1.5 text-sm text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    {deletingId === subject.id ? 'Жойылуда...' : 'Жою'}
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
