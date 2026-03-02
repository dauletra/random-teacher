import { Link } from 'react-router-dom';
import type { Artifact, ArtifactGroup, Mode } from '../../types/artifact.types';
import { getOptimizedThumbnail } from '../../utils/thumbnailOptimizer';
import { ExternalLink, Eye, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const GRADIENTS = [
  'from-indigo-100 to-purple-100',
  'from-emerald-100 to-teal-100',
  'from-amber-100 to-orange-100',
  'from-rose-100 to-pink-100',
  'from-sky-100 to-blue-100',
  'from-violet-100 to-fuchsia-100',
];

interface ArtifactCardProps {
  group: ArtifactGroup;
  artifacts: Artifact[];
  mode?: Mode;
  showNewBadge?: boolean;
}

export const ArtifactCard = ({ group, artifacts, mode, showNewBadge }: ArtifactCardProps) => {
  const hasMultipleVariants = artifacts.length > 1;
  const thumbnailUrl = group.thumbnail ? getOptimizedThumbnail(group.thumbnail) : null;
  const gradient = GRADIENTS[group.id.charCodeAt(0) % GRADIENTS.length];

  const formatViewCount = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const copyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
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
      <Link
        to={`/artifacts/${group.id}`}
        className="block"
      >
        <div className={`aspect-video bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
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
      </Link>

      {/* Variant links */}
      {hasMultipleVariants && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-1 flex-wrap mb-2">
            <span className="text-xs text-gray-400">Нұсқалар:</span>
            {artifacts.map((artifact, index) => (
              <span key={artifact.id} className="inline-flex items-center">
                {index > 0 && <span className="text-gray-300 mx-1">·</span>}
                <Link
                  to={`/artifacts/${group.id}?v=${index}`}
                  className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-0.5"
                >
                  {artifact.variantLabel}
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </span>
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
              className="px-2 py-0.5 rounded-full text-xs font-medium border border-gray-300 text-gray-500"
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
