import React from 'react';
import type { Classroom, SeatingDesk } from '../../types/classroom.types';
import type { Student } from '../../types/student.types';

interface SeatingGridProps {
  classroom: Classroom;
  desks: SeatingDesk[];
  students: Student[];
}

export const SeatingGrid: React.FC<SeatingGridProps> = ({ classroom, desks, students }) => {
  // Создать Map для быстрого поиска студентов по ID
  const studentsMap = new Map(students.map(s => [s.id, s]));

  // Группировка парт по колонкам
  const desksByColumn: SeatingDesk[][] = [];
  for (let columnIndex = 0; columnIndex < classroom.columns; columnIndex++) {
    const columnDesks = desks.filter(d => d.column === columnIndex);
    // Сортировка по позиции (сверху вниз)
    columnDesks.sort((a, b) => a.position - b.position);
    desksByColumn.push(columnDesks);
  }

  const getStudentName = (studentId: string): string => {
    const student = studentsMap.get(studentId);
    if (!student) return 'Неизв.';
    return `${student.firstName} ${student.lastName[0]}.`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Заголовки колонок */}
      <div className="flex gap-4 mb-4 justify-center">
        {desksByColumn.map((_, columnIndex) => (
          <div key={columnIndex} className="flex flex-col items-center">
            <span className="text-sm font-medium text-gray-700">Колонка {columnIndex + 1}</span>
          </div>
        ))}
      </div>

      {/* Парты по вертикали (сверху вниз) */}
      <div className="flex gap-4 justify-center">
        {desksByColumn.map((columnDesks, columnIndex) => (
          <div key={columnIndex} className="flex flex-col gap-2">
            {columnDesks.map((desk) => {
              const studentCount = desk.studentIds.length;
              const isEmpty = studentCount === 0;
              const isDouble = studentCount === 2;

              return (
                <div
                  key={desk.position}
                  className={`
                    w-36 px-3 py-3 rounded-lg border-2 transition-all
                    ${isEmpty
                      ? 'border-gray-200 bg-white'
                      : isDouble
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-indigo-300 bg-indigo-50'
                    }
                  `}
                >
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Парта {desk.position + 1}</p>
                    {isEmpty ? (
                      <p className="text-sm text-gray-400">(пусто)</p>
                    ) : (
                      <div className="space-y-1">
                        {desk.studentIds.map((studentId, index) => (
                          <p
                            key={studentId}
                            className={`text-sm font-medium truncate ${
                              isDouble ? 'text-amber-900' : 'text-indigo-900'
                            }`}
                            title={getStudentName(studentId)}
                          >
                            {index === 0 && isDouble && '1. '}
                            {index === 1 && '2. '}
                            {getStudentName(studentId)}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
