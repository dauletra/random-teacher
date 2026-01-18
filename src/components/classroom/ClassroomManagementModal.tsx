import React, { useState } from 'react';
import type { Classroom } from '../../types/classroom.types';
import { ClassroomForm } from './ClassroomForm';

interface ClassroomManagementModalProps {
  classrooms: Classroom[];
  onClose: () => void;
  onCreateClassroom: (name: string, columns: number, desksPerColumn: number[]) => Promise<void>;
  onUpdateClassroom: (id: string, name: string, columns: number, desksPerColumn: number[]) => Promise<void>;
  onDeleteClassroom: (id: string) => Promise<void>;
}

export const ClassroomManagementModal: React.FC<ClassroomManagementModalProps> = ({
  classrooms,
  onClose,
  onCreateClassroom,
  onUpdateClassroom,
  onDeleteClassroom,
}) => {
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);

  const handleCreate = async (name: string, columns: number, desksPerColumn: number[]) => {
    await onCreateClassroom(name, columns, desksPerColumn);
    setMode('list');
  };

  const handleUpdate = async (name: string, columns: number, desksPerColumn: number[]) => {
    if (!editingClassroom) return;
    await onUpdateClassroom(editingClassroom.id, name, columns, desksPerColumn);
    setEditingClassroom(null);
    setMode('list');
  };

  const handleEdit = (classroom: Classroom) => {
    setEditingClassroom(classroom);
    setMode('edit');
  };

  const handleDelete = async (id: string) => {
    await onDeleteClassroom(id);
  };

  const handleCancel = () => {
    setEditingClassroom(null);
    setMode('list');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Заголовок */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'list' ? 'Управление кабинетами' : mode === 'create' ? 'Создать кабинет' : 'Редактировать кабинет'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'list' ? (
            <div className="space-y-4">
              {/* Список кабинетов */}
              {classrooms.length > 0 ? (
                <div className="space-y-3">
                  {classrooms.map((classroom) => (
                    <div
                      key={classroom.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div>
                        <h3 className="font-semibold text-gray-900">{classroom.name}</h3>
                        <p className="text-sm text-gray-600">
                          {classroom.columns} {classroom.columns === 1 ? 'колонка' : classroom.columns < 5 ? 'колонки' : 'колонок'}, {' '}
                          {classroom.desksPerColumn.reduce((a, b) => a + b, 0)} {classroom.desksPerColumn.reduce((a, b) => a + b, 0) === 1 ? 'парта' : 'парт'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(classroom)}
                          className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          ✏️ Редактировать
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Удалить кабинет "${classroom.name}"?`)) {
                              handleDelete(classroom.id);
                            }
                          }}
                          className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                        >
                          🗑️ Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">Нет созданных кабинетов</p>
                </div>
              )}

              {/* Кнопка создания */}
              <button
                onClick={() => setMode('create')}
                className="w-full px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Создать новый кабинет
              </button>
            </div>
          ) : (
            <ClassroomForm
              classroom={editingClassroom || undefined}
              onSubmit={mode === 'create' ? handleCreate : handleUpdate}
              onCancel={handleCancel}
            />
          )}
        </div>

        {/* Футер (только для режима списка) */}
        {mode === 'list' && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Закрыть
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
