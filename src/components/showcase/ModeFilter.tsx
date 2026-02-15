import type { Mode } from '../../types/artifact.types';

interface ModeFilterProps {
  modes: Mode[];
  selectedModeId: string | null;
  onChange: (modeId: string | null) => void;
}

export const ModeFilter = ({ modes, selectedModeId, onChange }: ModeFilterProps) => {
  if (modes.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          selectedModeId === null
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Барлығы
      </button>
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onChange(selectedModeId === mode.id ? null : mode.id)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
            selectedModeId === mode.id
              ? mode.color + ' ring-2 ring-indigo-400 ring-offset-1'
              : mode.color + ' opacity-80 hover:opacity-100'
          }`}
        >
          <span>{mode.icon}</span>
          <span>{mode.label}</span>
        </button>
      ))}
    </div>
  );
};
