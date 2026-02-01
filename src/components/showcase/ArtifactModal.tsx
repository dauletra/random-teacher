import { useEffect, useState } from 'react';
import type { Artifact, Subject, Tag } from '../../types/artifact.types';
import { getEmbedUrl, getViewUrl } from '../../utils/artifactUrl';

interface ArtifactModalProps {
  artifact: Artifact;
  subject?: Subject;
  tags: Tag[];
  onClose: () => void;
}

export const ArtifactModal = ({ artifact, subject, tags, onClose }: ArtifactModalProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const embedUrl = getEmbedUrl(artifact.embedUrl);
  const viewUrl = getViewUrl(artifact.embedUrl);

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

  const openInNewTab = () => {
    window.open(viewUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            {subject && (
              <span className="text-2xl">{subject.icon}</span>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {artifact.title}
              </h2>
              {artifact.description && (
                <p className="text-sm text-gray-500">{artifact.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-wrap gap-1">
              {artifact.tags.map((tagId) => (
                <span
                  key={tagId}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
                >
                  {getTagLabel(tagId)}
                </span>
              ))}
            </div>

            <button
              onClick={openInNewTab}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Открыть в новой вкладке"
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
                Открыть в новой вкладке
              </button>
            </div>
          ) : (
            <iframe
              src={embedUrl}
              title={artifact.title}
              className="w-full h-full border-0"
              allow="clipboard-write"
              allowFullScreen
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          )}
        </div>
      </div>
    </div>
  );
};
