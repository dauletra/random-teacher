import { GRADES } from '../../config/physicsConstants';

interface GradeFilterProps {
  selectedGrade: number | null;
  onChange: (grade: number | null) => void;
}

export const GradeFilter = ({ selectedGrade, onChange }: GradeFilterProps) => {
  return (
    <div className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide">
      <button
        onClick={() => onChange(null)}
        className={`min-h-[44px] px-5 md:px-6 rounded-xl text-sm md:text-base font-bold transition-colors flex-shrink-0 ${
          selectedGrade === null
            ? 'bg-indigo-600 text-white shadow-md'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        }`}
      >
        Барлығы
      </button>
      {GRADES.map((g) => (
        <button
          key={g}
          onClick={() => onChange(selectedGrade === g ? null : g)}
          className={`min-h-[44px] px-5 md:px-6 rounded-xl text-sm md:text-base font-bold transition-colors flex-shrink-0 ${
            selectedGrade === g
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {g}-сынып
        </button>
      ))}
    </div>
  );
};
