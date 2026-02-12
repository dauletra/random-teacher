import { useEffect, useRef, useState } from 'react';
import type { Artifact, ArtifactGroup, Subject, Tag } from '../../types/artifact.types';
import { getEmbedUrl, getViewUrl } from '../../utils/artifactUrl';
import { artifactGroupService } from '../../services/artifactGroupService';
import toast from 'react-hot-toast';

interface ArtifactModalProps {
  group: ArtifactGroup;
  artifacts: Artifact[];
  initialVariantIndex?: number;
  subject?: Subject;
  tags: Tag[];
  onClose: () => void;
}

export const ArtifactModal = ({
  group,
  artifacts,
  initialVariantIndex = 0,
  subject,
  tags,
  onClose,
}: ArtifactModalProps) => {
  const [activeIndex, setActiveIndex] = useState(initialVariantIndex);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const viewCountedRef = useRef(false);

  useEffect(() => {
    if (!viewCountedRef.current) {
      viewCountedRef.current = true;
      artifactGroupService.incrementViewCount(group.id).catch(() => {});
    }
  }, [group.id]);

  const currentArtifact = artifacts[activeIndex];
  const embedUrl = currentArtifact ? getEmbedUrl(currentArtifact.embedUrl) : '';
  const viewUrl = currentArtifact ? getViewUrl(currentArtifact.embedUrl) : '';
  const hasMultipleVariants = artifacts.length > 1;

  const getTagLabel = (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    return tag?.label || tagId;
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError(true);
  };

  const switchVariant = (index: number) => {
    if (index === activeIndex) return;
    setActiveIndex(index);
    setLoading(true);
    setError(false);
  };

  const openInNewTab = () => {
    window.open(viewUrl, '_blank');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/artifacts/${group.id}`);
      toast.success('Сілтеме көшірілді');
    } catch {
      toast.error('Көшіру сәтсіз аяқталды');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {subject && (
              <span className="text-2xl flex-shrink-0">{subject.icon}</span>
            )}
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 truncate">
                {group.title}
              </h2>
              {(currentArtifact?.description || group.description) && (
                <p className="text-sm text-gray-500 truncate">
                  {currentArtifact?.description || group.description}
                </p>
              )}
              {group.authorName && (
                <p className="text-xs text-gray-400 truncate">
                  {group.authorName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <div className="hidden sm:flex flex-wrap gap-1">
              {group.tags.map((tagId) => (
                <span
                  key={tagId}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
                >
                  {getTagLabel(tagId)}
                </span>
              ))}
            </div>

            <button
              onClick={copyLink}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Сілтемені көшіру"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>

            <button
              onClick={openInNewTab}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Жаңа қойындыда ашу"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Variant tabs */}
        {hasMultipleVariants && (
          <div className="flex border-b border-gray-200 px-4 overflow-x-auto scrollbar-hide flex-shrink-0">
            {artifacts.map((artifact, index) => (
              <button
                key={artifact.id}
                onClick={() => switchVariant(index)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  index === activeIndex
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {artifact.variantLabel}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 bg-gray-50 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-8 text-center">
              <div className="text-4xl mb-4">😕</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Не удалось загрузить артефакт
              </h3>
              <p className="text-gray-500 mb-4 max-w-md">
                Возможно, артефакт заблокировал встраивание или URL некорректен.
              </p>
              <button
                onClick={openInNewTab}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Ашу в новой вкладке
              </button>
            </div>
          ) : (
            currentArtifact && (
              <iframe
                key={currentArtifact.id}
                src={embedUrl}
                title={`${group.title} - ${currentArtifact.variantLabel}`}
                className="w-full h-full border-0"
                allow="clipboard-write"
                allowFullScreen
                onLoad={handleIframeLoad}
                onError={handleIframeError}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};
