import type { Class } from '../../types/class.types';
import type { Journal } from '../../types/journal.types';
import { ClassCard } from './ClassCard';

interface ClassListProps {
  classes: Class[];
  journalsByClass: Record<string, Journal[]>;
  onCreateClick?: () => void;
}

export const ClassList = ({ classes, journalsByClass, onCreateClick }: ClassListProps) => {
  if (classes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Жоқ классов
        </h3>
        <p className="text-gray-600">
          Создайте свой первый класс, чтобы начать работу с учениками
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {classes.map((classData) => (
        <ClassCard
          key={classData.id}
          class={classData}
          journals={journalsByClass[classData.id] || []}
        />
      ))}

      {/* Create Class Card */}
      {onCreateClick && (
        <button
          onClick={onCreateClick}
          className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-400 hover:bg-indigo-50 transition-colors flex flex-col items-center justify-center min-h-[200px] group"
        >
          <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center mb-3 transition-colors">
            <svg
              className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-600 group-hover:text-indigo-600 transition-colors">
            Жасау класс
          </span>
        </button>
      )}
    </div>
  );
};
