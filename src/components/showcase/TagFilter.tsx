import { TAG_LABELS } from '../../types/artifact.types';
import type { ArtifactTag } from '../../types/artifact.types';

interface TagFilterProps {
  selectedTags: ArtifactTag[];
  onChange: (tags: ArtifactTag[]) => void;
}

const ALL_TAGS: ArtifactTag[] = [
  'learning',
  'game',
  'test',
  'theory',
  'timer',
  'solo',
  'multiplayer',
  'rating',
];

export const TagFilter = ({ selectedTags, onChange }: TagFilterProps) => {
  const toggleTag = (tag: ArtifactTag) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_TAGS.map((tag) => (
        <button
          key={tag}
          onClick={() => toggleTag(tag)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedTags.includes(tag)
              ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {TAG_LABELS[tag]}
        </button>
      ))}

      {selectedTags.length > 0 && (
        <button
          onClick={() => onChange([])}
          className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          Сбросить
        </button>
      )}
    </div>
  );
};
