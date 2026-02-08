import type { Artifact, ArtifactGroup, Subject, Tag } from '../../types/artifact.types';

interface ArtifactCardProps {
  group: ArtifactGroup;
  artifacts: Artifact[];
  subject?: Subject;
  tags: Tag[];
  onVariantClick: (variantIndex: number) => void;
}

export const ArtifactCard = ({ group, artifacts, subject, tags, onVariantClick }: ArtifactCardProps) => {
  const getTagLabel = (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    return tag?.label || tagId;
  };

  const hasMultipleVariants = artifacts.length > 1;

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-indigo-300 transition-all duration-200 text-left w-full group"
    >
      <button
        onClick={() => onVariantClick(0)}
        className="w-full text-left"
      >
        <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center relative overflow-hidden">
          {group.thumbnail ? (
            <img
              src={group.thumbnail}
              alt={group.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-6xl opacity-50 group-hover:scale-110 transition-transform">
              {subject?.icon || '🎯'}
            </span>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
          {hasMultipleVariants && (
            <span className="absolute top-2 right-2 bg-indigo-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
              {artifacts.length}
            </span>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start gap-2 mb-2">
            {subject && (
              <span className="text-lg flex-shrink-0">{subject.icon}</span>
            )}
            <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
              {group.title}
            </h3>
          </div>

          {group.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
              {group.description}
            </p>
          )}
        </div>
      </button>

      {/* Variant chips */}
      {hasMultipleVariants && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {artifacts.map((artifact, index) => (
              <button
                key={artifact.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onVariantClick(index);
                }}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                {artifact.variantLabel}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {group.tags.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-1">
            {group.tags.slice(0, 3).map((tagId) => (
              <span
                key={tagId}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
              >
                {getTagLabel(tagId)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
