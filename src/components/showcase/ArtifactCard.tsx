import type { Artifact, ArtifactGroup, Mode } from '../../types/artifact.types';
import { getOptimizedThumbnail } from '../../utils/thumbnailOptimizer';
import { Eye, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface ArtifactCardProps {
  group: ArtifactGroup;
  artifacts: Artifact[];
  mode?: Mode;
  onVariantClick: (variantIndex: number) => void;
  showNewBadge?: boolean;
}

export const ArtifactCard = ({ group, artifacts, mode, onVariantClick, showNewBadge }: ArtifactCardProps) => {
  const hasMultipleVariants = artifacts.length > 1;
  const thumbnailUrl = group.thumbnail ? getOptimizedThumbnail(group.thumbnail) : null;

  const formatViewCount = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const copyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/artifacts/${group.id}`);
      toast.success('Сілтеме көшірілді');
    } catch {
      toast.error('Көшіру сәтсіз аяқталды');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-indigo-300 hover:-translate-y-1 transition-all duration-200 text-left w-full group">
      <button
        onClick={() => onVariantClick(0)}
        className="w-full text-left"
      >
        <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center relative overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={group.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-6xl opacity-50 group-hover:scale-110 transition-transform">
              {mode?.icon || '🎯'}
            </span>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />

          {/* NEW badge */}
          {showNewBadge && (
            <span className="absolute top-2 left-2 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
              NEW
            </span>
          )}

          {/* Variant count */}
          {hasMultipleVariants && (
            <span className="absolute top-2 right-2 bg-indigo-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
              {artifacts.length}
            </span>
          )}

          {/* Copy link button */}
          <button
            onClick={copyLink}
            className="absolute bottom-2 left-2 p-1.5 bg-white/80 backdrop-blur-sm text-gray-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            title="Сілтемені көшіру"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors mb-1">
            {group.title}
          </h3>
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

      {/* Mode badge + Grade badges + View count */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {mode && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${mode.color}`}>
              {mode.icon} {mode.label}
            </span>
          )}
          {group.grade?.map((g) => (
            <span
              key={g}
              className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
            >
              {g}-сынып
            </span>
          ))}
          {(group.viewCount || 0) > 0 && (
            <span className="text-xs text-gray-400 ml-auto flex items-center gap-0.5 flex-shrink-0">
              <Eye className="w-3 h-3" />
              {formatViewCount(group.viewCount!)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
