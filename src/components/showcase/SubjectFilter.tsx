import type { Subject } from '../../types/artifact.types';

interface SubjectFilterProps {
  subjects: Subject[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
}

export const SubjectFilter = ({ subjects, selectedId, onChange }: SubjectFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          selectedId === null
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        }`}
      >
        Барлығы предметы
      </button>

      {subjects.map((subject) => (
        <button
          key={subject.id}
          onClick={() => onChange(subject.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
            selectedId === subject.id
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <span>{subject.icon}</span>
          <span>{subject.name}</span>
        </button>
      ))}
    </div>
  );
};
