import type { Topic } from '../../types/artifact.types';

interface TopicFilterNewProps {
  topics: Topic[];
  selectedTopicId: string | null;
  onChange: (topicId: string | null) => void;
}

export const TopicFilterNew = ({ topics, selectedTopicId, onChange }: TopicFilterNewProps) => {
  if (topics.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          selectedTopicId === null
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Барлық тақырыптар
      </button>
      {topics.map((topic) => (
        <button
          key={topic.id}
          onClick={() => onChange(selectedTopicId === topic.id ? null : topic.id)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedTopicId === topic.id
              ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {topic.label}
        </button>
      ))}
    </div>
  );
};
