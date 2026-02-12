import { useState, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useArtifactGroups } from '../hooks/useArtifactGroups';
import { useArtifacts } from '../hooks/useArtifacts';
import { useSubjects } from '../hooks/useSubjects';
import { useTags } from '../hooks/useTags';
import { isAdmin } from '../config/adminEmails';
import { ArtifactCard } from '../components/showcase/ArtifactCard';
import { ArtifactModal } from '../components/showcase/ArtifactModal';
import { SubjectFilter } from '../components/showcase/SubjectFilter';
import { TagFilter } from '../components/showcase/TagFilter';
import { Search, Plus, ChevronLeft, ChevronRight, Star, Users } from 'lucide-react';
import type { Artifact, ArtifactGroup } from '../types/artifact.types';

interface ModalState {
  group: ArtifactGroup;
  artifacts: Artifact[];
  variantIndex: number;
}

export const ShowcasePage = () => {
  const { user, loading: authLoading } = useAuth();
  const { groups, loading: groupsLoading } = useArtifactGroups({ publicOnly: true });
  const { artifacts, loading: artifactsLoading } = useArtifacts();
  const { subjects, loading: subjectsLoading } = useSubjects();
  const { tags, loading: tagsLoading } = useTags();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [modalState, setModalState] = useState<ModalState | null>(null);

  // Join groups with their artifacts
  const groupsWithArtifacts = useMemo(() => {
    const artifactsByGroup = new Map<string, Artifact[]>();
    for (const a of artifacts) {
      if (!a.groupId) continue;
      const list = artifactsByGroup.get(a.groupId) || [];
      list.push(a);
      artifactsByGroup.set(a.groupId, list);
    }
    for (const [, list] of artifactsByGroup) {
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    return { artifactsByGroup };
  }, [artifacts]);

  // Base filter (subject + tags + has artifacts + search)
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return groups.filter((group) => {
      if (!groupsWithArtifacts.artifactsByGroup.has(group.id)) return false;
      if (selectedSubjectId && group.subjectId !== selectedSubjectId) return false;
      if (selectedTagIds.length > 0) {
        const hasAllTags = selectedTagIds.every((tagId) => group.tags.includes(tagId));
        if (!hasAllTags) return false;
      }
      if (q) {
        const matchesSearch =
          group.title.toLowerCase().includes(q) ||
          group.description.toLowerCase().includes(q) ||
          (group.authorName || '').toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [groups, groupsWithArtifacts, selectedSubjectId, selectedTagIds, searchQuery]);

  // Split into featured and community
  const featuredGroups = useMemo(
    () => filteredGroups.filter((g) => g.isFeatured).sort((a, b) => (a.order || 0) - (b.order || 0)),
    [filteredGroups]
  );

  const communityGroups = useMemo(() => {
    const result = filteredGroups.filter((g) => !g.isFeatured);

    if (sortBy === 'newest') {
      result.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
    } else {
      result.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }

    return result;
  }, [filteredGroups, sortBy]);

  const getSubject = (subjectId: string) =>
    subjects.find((s) => s.id === subjectId);

  // Group featured by subject for display
  const featuredBySubject = useMemo(() => {
    const grouped = new Map<string, ArtifactGroup[]>();
    featuredGroups.forEach((group) => {
      const subjectId = group.subjectId;
      if (!grouped.has(subjectId)) grouped.set(subjectId, []);
      grouped.get(subjectId)!.push(group);
    });

    return subjects
      .filter((s) => grouped.has(s.id))
      .sort((a, b) => a.order - b.order)
      .map((subject) => ({
        subject,
        groups: grouped.get(subject.id) || [],
      }));
  }, [featuredGroups, subjects]);

  const openModal = (group: ArtifactGroup, variantIndex: number) => {
    const groupArtifacts = groupsWithArtifacts.artifactsByGroup.get(group.id) || [];
    if (groupArtifacts.length === 0) return;
    setModalState({ group, artifacts: groupArtifacts, variantIndex });
  };

  // Horizontal scroll refs for featured carousels
  const scrollRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const setScrollRef = useCallback((subjectId: string) => (el: HTMLDivElement | null) => {
    if (el) scrollRefs.current.set(subjectId, el);
    else scrollRefs.current.delete(subjectId);
  }, []);

  const scrollCarousel = useCallback((subjectId: string, direction: 'left' | 'right') => {
    const el = scrollRefs.current.get(subjectId);
    if (el) el.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
  }, []);

  const loading = authLoading || groupsLoading || artifactsLoading || subjectsLoading || tagsLoading;
  const hasAnyResults = featuredGroups.length > 0 || communityGroups.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <svg
                className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0"
                viewBox="0 0 64 64"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="64" height="64" rx="12" fill="#4f46e5" />
                <polygon points="32,14 48,24 32,34 16,24" fill="#a5b4fc" />
                <polygon points="16,24 32,34 32,50 16,40" fill="#818cf8" />
                <polygon points="32,34 48,24 48,40 32,50" fill="#6366f1" />
                <polygon
                  points="50,12 52,16 56,16 53,19 54,23 50,20 46,23 47,19 44,16 48,16"
                  fill="white"
                />
              </svg>
              <span className="text-base md:text-xl font-bold text-gray-900">
                Random Teacher
              </span>
            </Link>

            <div className="flex items-center gap-2 md:gap-3">
              {user ? (
                <>
                  {isAdmin(user.email) && (
                    <Link
                      to="/admin"
                      className="text-xs md:text-sm text-gray-600 hover:text-gray-900"
                    >
                      Әкімші
                    </Link>
                  )}
                  <Link
                    to="/my-artifacts"
                    className="text-xs md:text-sm text-gray-600 hover:text-gray-900"
                  >
                    Артефакттарым
                  </Link>
                  <Link
                    to="/dashboard"
                    className="px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs md:text-sm font-medium"
                  >
                    Сыныптар
                  </Link>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs md:text-sm font-medium"
                >
                  Кіру
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
          <div className="text-center">
            <h1 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">
              Интерактивті артефакттар
            </h1>
            <p className="text-sm md:text-base text-indigo-100 max-w-2xl mx-auto">
              Сабақта қолдануға арналған Claude-артефакттар.
              Симуляторлар, ойындар, тесттер және басқалар.
            </p>
            {!loading && (
              <p className="text-xs md:text-sm text-indigo-200 mt-1">
                {filteredGroups.length} артефакт
              </p>
            )}

            {/* Search inside hero */}
            <div className="relative max-w-xl mx-auto mt-4 md:mt-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Артефакт іздеу..."
                className="w-full pl-12 pr-4 py-2.5 md:py-3 bg-white rounded-xl shadow-lg focus:ring-2 focus:ring-white/50 focus:outline-none text-sm md:text-base text-gray-900 placeholder-gray-400"
              />
            </div>

            {user && (
              <Link
                to="/my-artifacts/new"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-white/20 backdrop-blur text-white border border-white/30 rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Артефакт жариялау
              </Link>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {subjects.length > 0 && (
              <div className="mb-4">
                <SubjectFilter
                  subjects={subjects}
                  selectedId={selectedSubjectId}
                  onChange={setSelectedSubjectId}
                />
              </div>
            )}

            <div className="mb-4">
              <TagFilter
                tags={tags}
                selectedTagIds={selectedTagIds}
                onChange={setSelectedTagIds}
              />
            </div>

            {/* Sticky sort bar + result count */}
            <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-gray-50/80 backdrop-blur-sm border-b border-gray-200/50 mb-6 flex items-center justify-between">
              <span className="text-xs md:text-sm text-gray-500">
                Табылды: {filteredGroups.length} артефакт
              </span>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSortBy('newest')}
                  className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-md text-xs md:text-sm font-medium transition-colors ${
                    sortBy === 'newest'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Жаңалар
                </button>
                <button
                  onClick={() => setSortBy('popular')}
                  className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-md text-xs md:text-sm font-medium transition-colors ${
                    sortBy === 'popular'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Танымал
                </button>
              </div>
            </div>

            {!hasAnyResults ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500 mb-2">
                  {groups.length === 0
                    ? 'Әзірге интерактивті артефакттар жоқ'
                    : 'Таңдалған сүзгіден өткен артефакттар жоқ'}
                </p>
                {(selectedSubjectId || selectedTagIds.length > 0 || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedSubjectId(null);
                      setSelectedTagIds([]);
                      setSearchQuery('');
                    }}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    Сүзгіні жою
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-10">
                {/* Featured section */}
                {featuredBySubject.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-amber-200">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <h2 className="text-lg font-semibold text-gray-900">
                        Ұсынылған
                      </h2>
                    </div>
                    <div className="space-y-8">
                      {featuredBySubject.map(({ subject, groups: subjectGroups }) => (
                        <div key={subject.id}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">{subject.icon}</span>
                            <h3 className="text-base font-medium text-gray-800">
                              {subject.name}
                            </h3>
                            <span className="text-sm text-gray-500">
                              ({subjectGroups.length})
                            </span>
                          </div>
                          {/* Horizontal carousel */}
                          <div className="relative group/scroll">
                            <div
                              ref={setScrollRef(subject.id)}
                              className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-2"
                            >
                              {subjectGroups.map((group) => (
                                <div key={group.id} className="w-64 md:w-72 flex-shrink-0">
                                  <ArtifactCard
                                    group={group}
                                    artifacts={groupsWithArtifacts.artifactsByGroup.get(group.id) || []}
                                    subject={subject}
                                    tags={tags}
                                    onVariantClick={(index) => openModal(group, index)}
                                  />
                                </div>
                              ))}
                            </div>
                            {/* Scroll arrows (desktop only) */}
                            {subjectGroups.length > 3 && (
                              <>
                                <button
                                  onClick={() => scrollCarousel(subject.id, 'left')}
                                  className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg border border-gray-200 text-gray-600 hover:text-gray-900 opacity-0 group-hover/scroll:opacity-100 transition-opacity"
                                >
                                  <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => scrollCarousel(subject.id, 'right')}
                                  className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg border border-gray-200 text-gray-600 hover:text-gray-900 opacity-0 group-hover/scroll:opacity-100 transition-opacity"
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Community section */}
                {communityGroups.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                      <Users className="w-5 h-5 text-gray-600" />
                      <h2 className="text-lg font-semibold text-gray-900">
                        Мұғалімдерден
                      </h2>
                      <span className="text-sm text-gray-500">
                        ({communityGroups.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {communityGroups.map((group) => (
                        <ArtifactCard
                          key={group.id}
                          group={group}
                          artifacts={groupsWithArtifacts.artifactsByGroup.get(group.id) || []}
                          subject={getSubject(group.subjectId)}
                          tags={tags}
                          onVariantClick={(index) => openModal(group, index)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {modalState && (
        <ArtifactModal
          group={modalState.group}
          artifacts={modalState.artifacts}
          initialVariantIndex={modalState.variantIndex}
          subject={getSubject(modalState.group.subjectId)}
          tags={tags}
          onClose={() => setModalState(null)}
        />
      )}
    </div>
  );
};
