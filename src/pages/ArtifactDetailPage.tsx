import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { artifactGroupService } from '../services/artifactGroupService';
import { artifactService } from '../services/artifactService';
import { normalizeArtifactGroup } from '../utils/artifactHelpers';
import { getEmbedUrl, getViewUrl } from '../utils/artifactUrl';
import { useSubjects } from '../hooks/useSubjects';
import { useTags } from '../hooks/useTags';
import type { Artifact, ArtifactGroup } from '../types/artifact.types';
import { ArrowLeft, Copy, ExternalLink, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export const ArtifactDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { subjects } = useSubjects();
  const { tags } = useTags();

  const [group, setGroup] = useState<ArtifactGroup | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const viewCountedRef = useRef(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const [rawGroup, groupArtifacts] = await Promise.all([
          artifactGroupService.getById(id),
          artifactService.getByGroupId(id),
        ]);

        if (!rawGroup) {
          setNotFound(true);
          return;
        }

        const normalized = normalizeArtifactGroup(rawGroup as Record<string, any>);
        setGroup(normalized);
        groupArtifacts.sort((a, b) => (a.order || 0) - (b.order || 0));
        setArtifacts(groupArtifacts);

        if (!viewCountedRef.current) {
          viewCountedRef.current = true;
          artifactGroupService.incrementViewCount(id).catch(() => {});
        }
      } catch (error) {
        console.error('Error loading artifact:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const currentArtifact = artifacts[activeIndex];
  const embedUrl = currentArtifact ? getEmbedUrl(currentArtifact.embedUrl) : '';
  const viewUrl = currentArtifact ? getViewUrl(currentArtifact.embedUrl) : '';
  const hasMultipleVariants = artifacts.length > 1;
  const subject = group ? subjects.find((s) => s.id === group.subjectId) : undefined;

  const getTagLabel = (tagId: string) =>
    tags.find((t) => t.id === tagId)?.label || tagId;

  const switchVariant = (index: number) => {
    if (index === activeIndex) return;
    setActiveIndex(index);
    setIframeLoading(true);
    setIframeError(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Сілтеме көшірілді');
    } catch {
      toast.error('Көшіру сәтсіз аяқталды');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (notFound || !group) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Артефакт табылмады</h1>
        <p className="text-gray-500 mb-6">Бұл артефакт жоқ немесе жойылған</p>
        <Link
          to="/"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Маркетплейске оралу
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16 gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Link
                to="/"
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              {subject && (
                <span className="text-xl md:text-2xl flex-shrink-0">{subject.icon}</span>
              )}
              <div className="min-w-0">
                <h1 className="text-sm md:text-lg font-bold text-gray-900 truncate">
                  {group.title}
                </h1>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {group.authorName && (
                    <span>{group.authorName}</span>
                  )}
                  <span className="flex items-center gap-0.5">
                    <Eye className="w-3 h-3" />
                    {group.viewCount || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              <div className="hidden sm:flex flex-wrap gap-1">
                {group.tags.slice(0, 3).map((tagId) => (
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
                <Copy className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              <a
                href={viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Жаңа қойындыда ашу"
              >
                <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Variant tabs */}
      {hasMultipleVariants && (
        <div className="bg-white border-b border-gray-200 flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto scrollbar-hide">
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
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 relative">
        {iframeLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {iframeError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-8 text-center">
            <div className="text-4xl mb-4">😕</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Артефактты жүктеу мүмкін болмады
            </h3>
            <p className="text-gray-500 mb-4 max-w-md">
              Артефакт ендіруді блоктауы немесе URL қате болуы мүмкін.
            </p>
            <a
              href={viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Жаңа қойындыда ашу
            </a>
          </div>
        ) : (
          currentArtifact && (
            <iframe
              key={currentArtifact.id}
              src={embedUrl}
              title={`${group.title} - ${currentArtifact.variantLabel}`}
              className="w-full h-full border-0 absolute inset-0"
              allow="clipboard-write"
              allowFullScreen
              onLoad={() => setIframeLoading(false)}
              onError={() => {
                setIframeLoading(false);
                setIframeError(true);
              }}
            />
          )
        )}
      </div>
    </div>
  );
};
