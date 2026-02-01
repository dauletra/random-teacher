import type { Tag } from '../../types/artifact.types';

interface TagFilterProps {
  tags: Tag[];
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export const TagFilter = ({ tags, selectedTagIds, onChange }: TagFilterProps) => {
  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <button
          key={tag.id}
          onClick={() => toggleTag(tag.id)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedTagIds.includes(tag.id)
              ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {tag.label}
        </button>
      ))}

      {selectedTagIds.length > 0 && (
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
