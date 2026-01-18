import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { conflictService } from '../../services/conflictService';
import type { Student } from '../../types/student.types';
import type { StudentConflict } from '../../types/conflict.types';

interface ConflictsTabProps {
  classId: string;
  students: Student[];
}

export const ConflictsTab: React.FC<ConflictsTabProps> = ({ classId, students }) => {
  const [conflicts, setConflicts] = useState<StudentConflict[]>([]);
  const [selectedStudent1, setSelectedStudent1] = useState<string>('');
  const [selectedStudent2, setSelectedStudent2] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = conflictService.subscribe(classId, (newConflicts) => {
      setConflicts(newConflicts);
    });

    return () => unsubscribe();
  }, [classId]);

  const handleAddConflict = async () => {
    if (!selectedStudent1 || !selectedStudent2) {
      toast.error('Выберите двух учеников');
      return;
    }

    if (selectedStudent1 === selectedStudent2) {
      toast.error('Нельзя добавить конфликт ученика с самим собой');
      return;
    }

    setLoading(true);
    try {
      await conflictService.addConflict(classId, selectedStudent1, selectedStudent2);
      setSelectedStudent1('');
      setSelectedStudent2('');
      toast.success('Конфликт добавлен');
    } catch (error) {
      console.error('Error adding conflict:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Ошибка добавления конфликта');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveConflict = async (studentId1: string, studentId2: string) => {
    try {
      await conflictService.removeConflict(classId, studentId1, studentId2);
      toast.success('Конфликт удален');
    } catch (error) {
      console.error('Error removing conflict:', error);
      toast.error('Ошибка удаления конфликта');
    }
  };

  const getStudentName = (studentId: string): string => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.lastName} ${student.firstName}` : 'Неизвестный';
  };

  // Фильтр для второго селектора: исключить выбранного в первом
  const availableStudentsForSecond = students.filter(s => s.id !== selectedStudent1);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Конфликты в классе</h2>
        <p className="text-sm text-gray-600">
          Ученики из конфликтной пары никогда не окажутся в одной группе при автоматическом делении
        </p>
      </div>

      {/* Форма добавления конфликта */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Добавить конфликт</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={selectedStudent1}
            onChange={(e) => setSelectedStudent1(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          >
            <option value="">Выберите ученика</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.lastName} {student.firstName}
              </option>
            ))}
          </select>

          <select
            value={selectedStudent2}
            onChange={(e) => setSelectedStudent2(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading || !selectedStudent1}
          >
            <option value="">Выберите ученика</option>
            {availableStudentsForSecond.map(student => (
              <option key={student.id} value={student.id}>
                {student.lastName} {student.firstName}
              </option>
            ))}
          </select>

          <button
            onClick={handleAddConflict}
            disabled={loading || !selectedStudent1 || !selectedStudent2}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Добавить
          </button>
        </div>
      </div>

      {/* Список конфликтов */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Список конфликтов ({conflicts.length})
        </h3>

        {conflicts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="mt-2 text-gray-500">Нет конфликтов</p>
            <p className="text-sm text-gray-400 mt-1">
              Добавьте пары учеников, которые не могут работать вместе
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conflicts.map((conflict, index) => (
              <div
                key={`${conflict.studentId1}-${conflict.studentId2}-${index}`}
                className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="font-medium text-gray-900">
                    {getStudentName(conflict.studentId1)}
                  </span>
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span className="font-medium text-gray-900">
                    {getStudentName(conflict.studentId2)}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveConflict(conflict.studentId1, conflict.studentId2)}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-200 rounded transition-colors"
                  title="Удалить конфликт"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Информационное сообщение */}
      {conflicts.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-800">
              При делении на группы алгоритм автоматически учтет эти конфликты и разместит учеников в разные группы.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
