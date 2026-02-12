import { useState } from 'react';
import type { Class } from '../../types/class.types';

interface ClassFormProps {
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
  initialData?: Class;
  submitLabel?: string;
}

export const ClassForm = ({
  onSubmit,
  onCancel,
  initialData,
  submitLabel = 'Жасау',
}: ClassFormProps) => {
  const [name, setName] = useState(initialData?.name || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    setLoading(true);
    try {
      await onSubmit(name.trim());
      setName('');
    } catch (error) {
      console.error('Error submitting class:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="class-name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Атауы класса
        </label>
        <input
          id="class-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например: 9А, 10Б"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
          disabled={loading}
        />
        <p className="mt-1 text-xs text-gray-500">
          Енгізіңіз номер и букву класса
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Сохранение...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Болдырмау
        </button>
      </div>
    </form>
  );
};
