import { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { useModes } from '../../hooks/useModes';
import { modeService } from '../../services/modeService';
import type { Mode } from '../../types/artifact.types';
import toast from 'react-hot-toast';

const COLOR_PRESETS = [
  { value: 'bg-green-100 text-green-700', label: 'Жасыл' },
  { value: 'bg-blue-100 text-blue-700', label: 'Көк' },
  { value: 'bg-purple-100 text-purple-700', label: 'Күлгін' },
  { value: 'bg-amber-100 text-amber-700', label: 'Сары' },
  { value: 'bg-red-100 text-red-700', label: 'Қызыл' },
  { value: 'bg-cyan-100 text-cyan-700', label: 'Көгілдір' },
  { value: 'bg-pink-100 text-pink-700', label: 'Қызғылт' },
  { value: 'bg-orange-100 text-orange-700', label: 'Қызғылт сары' },
];

export const ModesPage = () => {
  const { modes, loading } = useModes();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ label: '', icon: '', color: COLOR_PRESETS[0].value, order: 0 });

  const resetForm = () => {
    setFormData({ label: '', icon: '', color: COLOR_PRESETS[0].value, order: modes.length });
    setEditingId(null);
    setIsAdding(false);
  };

  const startEdit = (mode: Mode) => {
    setFormData({ label: mode.label, icon: mode.icon, color: mode.color, order: mode.order });
    setEditingId(mode.id);
    setIsAdding(false);
  };

  const startAdd = () => {
    setFormData({ label: '', icon: '', color: COLOR_PRESETS[0].value, order: modes.length });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.label.trim()) {
      toast.error('Атауын енгізіңіз');
      return;
    }
    if (!formData.icon.trim()) {
      toast.error('Иконканы енгізіңіз (emoji)');
      return;
    }

    try {
      if (isAdding) {
        await modeService.create({
          label: formData.label.trim(),
          icon: formData.icon.trim(),
          color: formData.color,
          order: formData.order,
        });
        toast.success('Режим қосылды');
      } else if (editingId) {
        await modeService.update(editingId, {
          label: formData.label.trim(),
          icon: formData.icon.trim(),
          color: formData.color,
          order: formData.order,
        });
        toast.success('Режим жаңарды');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving mode:', error);
      toast.error('Сақтау кезінде қате кетті');
    }
  };

  const handleDelete = async (mode: Mode) => {
    if (!confirm(`"${mode.icon} ${mode.label}" режимін жою керек пе?`)) return;
    try {
      await modeService.delete(mode.id);
      toast.success('Режим жойылды');
    } catch (error) {
      console.error('Error deleting mode:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">Режимдер (Modes)</h1>
          {!isAdding && !editingId && (
            <button
              onClick={startAdd}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Режим қосу
            </button>
          )}
        </div>

        {(isAdding || editingId) && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {isAdding ? 'Жаңа режим' : 'Өңдеу'}
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-20">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Иконка</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-xl"
                    placeholder="🎮"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Атауы</label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData((prev) => ({ ...prev, label: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ойын, Тест, Симулятор..."
                  />
                </div>
                <div className="w-20">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Реті</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Түс</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, color: preset.value }))}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${preset.value} ${
                        formData.color === preset.value ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
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

        {modes.length === 0 && !isAdding ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 mb-4">Әзірге режимдер жоқ</p>
            <button
              onClick={startAdd}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Режим қосу
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
            {modes.map((mode) => (
              <div key={mode.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{mode.icon}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${mode.color}`}>
                    {mode.label}
                  </span>
                  <span className="text-xs text-gray-400">(реті: {mode.order})</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(mode)}
                    className="px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    Өңдеу
                  </button>
                  <button
                    onClick={() => handleDelete(mode)}
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
