import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { artifactGroupService } from '../services/artifactGroupService';
import { artifactService } from '../services/artifactService';
import { getEmbedUrl } from '../utils/artifactUrl';
import type { Artifact } from '../types/artifact.types';

export const ArtifactEmbedPage = () => {
  const { id } = useParams<{ id: string }>();
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(true);
  const viewCountedRef = useRef(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const groupArtifacts = await artifactService.getByGroupId(id);
        groupArtifacts.sort((a, b) => (a.order || 0) - (b.order || 0));
        setArtifacts(groupArtifacts);

        if (!viewCountedRef.current) {
          viewCountedRef.current = true;
          artifactGroupService.incrementViewCount(id).catch(() => {});
        }
      } catch (error) {
        console.error('Error loading artifact:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const currentArtifact = artifacts[activeIndex];
  const embedUrl = currentArtifact ? getEmbedUrl(currentArtifact.embedUrl) : '';
  const hasMultipleVariants = artifacts.length > 1;

  const switchVariant = (index: number) => {
    if (index === activeIndex) return;
    setActiveIndex(index);
    setIframeLoading(true);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (artifacts.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Артефакт табылмады
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {hasMultipleVariants && (
        <div className="flex border-b border-gray-200 bg-white flex-shrink-0 overflow-x-auto scrollbar-hide">
          {artifacts.map((artifact, index) => (
            <button
              key={artifact.id}
              onClick={() => switchVariant(index)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                index === activeIndex
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {artifact.variantLabel}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 relative">
        {iframeLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {currentArtifact && (
          <iframe
            key={currentArtifact.id}
            src={embedUrl}
            title={currentArtifact.variantLabel}
            className="w-full h-full border-0"
            allow="clipboard-write"
            allowFullScreen
            onLoad={() => setIframeLoading(false)}
          />
        )}
      </div>
    </div>
  );
};
