import React, { useState, useEffect } from 'react';
import type { Classroom } from '../../types/classroom.types';

interface ClassroomFormProps {
  classroom?: Classroom;  // Для редактирования существующего кабинета
  onSubmit: (name: string, columns: number, desksPerColumn: number[]) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const ClassroomForm: React.FC<ClassroomFormProps> = ({
  classroom,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [name, setName] = useState(classroom?.name || '');
  const [columns, setColumns] = useState(classroom?.columns || 3);
  const [desksPerColumn, setDesksPerColumn] = useState<number[]>(
    classroom?.desksPerColumn || [5, 5, 5]
  );

  // Update desksPerColumn array when columns count changes
  useEffect(() => {
    if (desksPerColumn.length !== columns) {
      const newDesksPerColumn = Array.from({ length: columns }, (_, i) =>
        desksPerColumn[i] || 5
      );
      setDesksPerColumn(newDesksPerColumn);
    }
  }, [columns]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(name.trim(), columns, desksPerColumn);
  };

  const handleDeskCountChange = (columnIndex: number, value: string) => {
    const count = parseInt(value, 10);
    if (!isNaN(count) && count >= 1 && count <= 10) {
      const newDesksPerColumn = [...desksPerColumn];
      newDesksPerColumn[columnIndex] = count;
      setDesksPerColumn(newDesksPerColumn);
    }
  };

  const totalDesks = desksPerColumn.reduce((sum, count) => sum + count, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {classroom ? 'Өңдеу кабинет' : 'Жасау новый кабинет'}
        </h3>

        {/* Атауы */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Атауы кабинета
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Кабинет 101, Физика"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
            required
          />
        </div>

        {/* Количество колонок */}
        <div className="mb-4">
          <label htmlFor="columns" className="block text-sm font-medium text-gray-700 mb-1">
            Количество колонок
          </label>
          <input
            id="columns"
            type="number"
            min="1"
            max="10"
            value={columns}
            onChange={(e) => setColumns(parseInt(e.target.value, 10) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
            required
          />
        </div>

        {/* Парты в каждой колонке */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Количество парт в каждой колонке (сверху вниз)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {desksPerColumn.map((count, index) => (
              <div key={index}>
                <label htmlFor={`column-${index}`} className="block text-xs text-gray-600 mb-1">
                  Колонка {index + 1}
                </label>
                <input
                  id={`column-${index}`}
                  type="number"
                  min="1"
                  max="10"
                  value={count}
                  onChange={(e) => handleDeskCountChange(index, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                  required
                />
              </div>
            ))}
          </div>
        </div>

        {/* Предпросмотр */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Предпросмотр</h4>
          <div className="flex gap-4">
            {desksPerColumn.map((count, columnIndex) => (
              <div key={columnIndex} className="flex flex-col items-center gap-2">
                <span className="text-xs text-gray-600">Колонка {columnIndex + 1}</span>
                <div className="flex flex-col gap-1">
                  {Array.from({ length: count }).map((_, deskIndex) => (
                    <div
                      key={deskIndex}
                      className="w-8 h-8 border-2 border-indigo-300 bg-indigo-50 rounded"
                      title={`Парта ${deskIndex + 1}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">({count} парт)</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Барлығыго: <span className="font-medium">{totalDesks} парт</span>, {totalDesks * 2} мест
          </p>
        </div>
      </div>

      {/* Кнопки */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Сохранение...' : classroom ? 'Сақтау' : 'Жасау кабинет'}
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
