import type { Student } from '../../types/student.types';

interface StudentCardProps {
  student: Student;
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
}

export const StudentCard = ({ student, onEdit, onDelete }: StudentCardProps) => {
  const handleDelete = () => {
    if (window.confirm(`Жою ученика "${student.firstName} ${student.lastName}"?`)) {
      onDelete(student.id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {student.lastName} {student.firstName}
          </h3>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(student)}
          className="flex-1 px-3 py-1.5 text-sm text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
        >
          Өзгерту
        </button>
        <button
          onClick={handleDelete}
          className="px-3 py-1.5 text-sm text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
