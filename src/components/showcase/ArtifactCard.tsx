import type { Artifact, Subject } from '../../types/artifact.types';
import { TAG_LABELS } from '../../types/artifact.types';

interface ArtifactCardProps {
  artifact: Artifact;
  subject?: Subject;
  onClick: () => void;
}

export const ArtifactCard = ({ artifact, subject, onClick }: ArtifactCardProps) => {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-indigo-300 transition-all duration-200 text-left w-full group"
    >
      <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center relative overflow-hidden">
        {artifact.thumbnail ? (
          <img
            src={artifact.thumbnail}
            alt={artifact.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-6xl opacity-50 group-hover:scale-110 transition-transform">
            {subject?.icon || '🎯'}
          </span>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
      </div>

      <div className="p-4">
        <div className="flex items-start gap-2 mb-2">
          {subject && (
            <span className="text-lg flex-shrink-0">{subject.icon}</span>
          )}
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {artifact.title}
          </h3>
        </div>

        {artifact.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">
            {artifact.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1">
          {artifact.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
            >
              {TAG_LABELS[tag]}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
};
