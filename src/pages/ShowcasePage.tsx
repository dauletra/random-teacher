import { useState, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useArtifactGroups } from '../hooks/useArtifactGroups';
import { useArtifacts } from '../hooks/useArtifacts';
import { useModes } from '../hooks/useModes';
import { useTopics } from '../hooks/useTopics';
import { ArtifactCard } from '../components/showcase/ArtifactCard';
import { ArtifactModal } from '../components/showcase/ArtifactModal';
import { HeroCarousel } from '../components/showcase/HeroCarousel';
import { GradeFilter } from '../components/showcase/GradeFilter';
import { CategoryRow } from '../components/showcase/CategoryRow';
import { ModeFilter } from '../components/showcase/ModeFilter';
import { TopicFilterNew } from '../components/showcase/TopicFilterNew';
import { NEW_ARTIFACT_THRESHOLD_MS } from '../config/physicsConstants';
import { Search } from 'lucide-react';
import type { Artifact, ArtifactGroup } from '../types/artifact.types';
import { useTags } from '../hooks/useTags';

interface ModalState {
  group: ArtifactGroup;
  artifacts: Artifact[];
  variantIndex: number;
}

export const ShowcasePage = () => {
  const { user } = useAuth();
  const { groups, loading: groupsLoading } = useArtifactGroups({ publicOnly: true });
  const { artifacts, loading: artifactsLoading } = useArtifacts();
  const { modes, loading: modesLoading } = useModes();
  const { topics, loading: topicsLoading } = useTopics();
  const { tags } = useTags();

  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedModeId, setSelectedModeId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalState, setModalState] = useState<ModalState | null>(null);

  const catalogRef = useRef<HTMLDivElement>(null);

  // Join groups with their artifacts
  const artifactsByGroup = useMemo(() => {
    const map = new Map<string, Artifact[]>();
    for (const a of artifacts) {
      if (!a.groupId) continue;
      const list = map.get(a.groupId) || [];
      list.push(a);
      map.set(a.groupId, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    return map;
  }, [artifacts]);

  // Groups that have artifacts
  const groupsWithArtifacts = useMemo(
    () => groups.filter((g) => artifactsByGroup.has(g.id)),
    [groups, artifactsByGroup]
  );

  // Grade-filtered groups (applies to everything)
  const gradeFiltered = useMemo(() => {
    if (!selectedGrade) return groupsWithArtifacts;
    return groupsWithArtifacts.filter(
      (g) => g.grade && g.grade.includes(selectedGrade)
    );
  }, [groupsWithArtifacts, selectedGrade]);

  // Mode map for quick lookup
  const modeMap = useMemo(() => {
    const map = new Map<string, (typeof modes)[0]>();
    for (const m of modes) map.set(m.id, m);
    return map;
  }, [modes]);

  // Netflix-style category rows (dynamic from modes)
  const categoryRows = useMemo(() => {
    const rows: { key: string; title: string; groups: ArtifactGroup[] }[] = [];

    // Popular (always first)
    const popular = [...gradeFiltered]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 20);
    if (popular.length > 0) {
      rows.push({ key: 'popular', title: '🔥 Танымал', groups: popular });
    }

    // Per mode
    for (const mode of modes) {
      const modeGroups = gradeFiltered.filter((g) => g.modeId === mode.id);
      if (modeGroups.length > 0) {
        rows.push({
          key: `mode-${mode.id}`,
          title: `${mode.icon} ${mode.label}`,
          groups: modeGroups,
        });
      }
    }

    return rows;
  }, [gradeFiltered, modes]);

  // Full catalog filtering (grade + mode + topic + search)
  const catalogGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return gradeFiltered.filter((group) => {
      if (selectedModeId && group.modeId !== selectedModeId) return false;
      if (selectedTopicId && group.topicId !== selectedTopicId) return false;
      if (q) {
        const matches =
          group.title.toLowerCase().includes(q) ||
          group.description.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [gradeFiltered, selectedModeId, selectedTopicId, searchQuery]);

  // NEW badge helper
  const isNew = useCallback((group: ArtifactGroup) => {
    if (!group.createdAt) return false;
    return Date.now() - group.createdAt.toMillis() < NEW_ARTIFACT_THRESHOLD_MS;
  }, []);

  const openModal = useCallback(
    (group: ArtifactGroup, variantIndex: number) => {
      const groupArtifacts = artifactsByGroup.get(group.id) || [];
      if (groupArtifacts.length === 0) return;
      setModalState({ group, artifacts: groupArtifacts, variantIndex });
    },
    [artifactsByGroup]
  );

  const handleHeroModeFilter = useCallback((modeId: string) => {
    setSelectedModeId(modeId);
    catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loading = groupsLoading || artifactsLoading || modesLoading || topicsLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
                Физика
              </span>
            </Link>
            <Link
              to={user ? '/dashboard' : '/login'}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Мұғалімдер үшін
            </Link>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Hero Carousel */}
          <HeroCarousel
            modes={modes}
            groups={gradeFiltered}
            onArtifactClick={(group) => openModal(group, 0)}
            onModeFilter={handleHeroModeFilter}
          />

          {/* Grade Filter (sticky) */}
          <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200/50 py-3">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <GradeFilter
                selectedGrade={selectedGrade}
                onChange={setSelectedGrade}
              />
            </div>
          </div>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            {gradeFiltered.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500 mb-2">
                  {groupsWithArtifacts.length === 0
                    ? 'Әзірге артефакттар жоқ'
                    : 'Таңдалған сынып бойынша артефакттар жоқ'}
                </p>
                {selectedGrade && (
                  <button
                    onClick={() => setSelectedGrade(null)}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    Сүзгіні жою
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Netflix-style Category Rows */}
                <div className="space-y-8 md:space-y-10">
                  {categoryRows.map((cat) => (
                    <CategoryRow
                      key={cat.key}
                      title={cat.title}
                      itemCount={cat.groups.length}
                    >
                      {cat.groups.map((group) => (
                        <div key={group.id} className="w-72 md:w-80 flex-shrink-0">
                          <ArtifactCard
                            group={group}
                            artifacts={artifactsByGroup.get(group.id) || []}
                            mode={group.modeId ? modeMap.get(group.modeId) : undefined}
                            onVariantClick={(index) => openModal(group, index)}
                            showNewBadge={isNew(group)}
                          />
                        </div>
                      ))}
                    </CategoryRow>
                  ))}
                </div>

                {/* Full Catalog Section */}
                <div ref={catalogRef} className="mt-12 border-t border-gray-200 pt-8">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
                    Барлық артефакттар
                  </h2>

                  {/* Filters */}
                  <div className="space-y-4 mb-6">
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Артефакт іздеу..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none text-sm text-gray-900 placeholder-gray-400"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <ModeFilter
                        modes={modes}
                        selectedModeId={selectedModeId}
                        onChange={setSelectedModeId}
                      />
                    </div>

                    <TopicFilterNew
                      topics={topics}
                      selectedTopicId={selectedTopicId}
                      onChange={setSelectedTopicId}
                    />
                  </div>

                  {/* Results count */}
                  <p className="text-sm text-gray-500 mb-4">
                    Табылды: {catalogGroups.length} артефакт
                  </p>

                  {catalogGroups.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                      <p className="text-gray-500 mb-2">
                        Сүзгіден өткен артефакттар жоқ
                      </p>
                      <button
                        onClick={() => {
                          setSelectedModeId(null);
                          setSelectedTopicId(null);
                          setSearchQuery('');
                        }}
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        Сүзгіні жою
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
                      {catalogGroups.map((group) => (
                        <ArtifactCard
                          key={group.id}
                          group={group}
                          artifacts={artifactsByGroup.get(group.id) || []}
                          mode={group.modeId ? modeMap.get(group.modeId) : undefined}
                          onVariantClick={(index) => openModal(group, index)}
                          showNewBadge={isNew(group)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </main>

          {/* Footer */}
          <footer className="mt-8 py-8 border-t border-gray-200 text-center">
            <Link
              to={user ? '/dashboard' : '/login'}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Мұғалімдер үшін →
            </Link>
          </footer>
        </>
      )}

      {/* Modal */}
      {modalState && (
        <ArtifactModal
          group={modalState.group}
          artifacts={modalState.artifacts}
          initialVariantIndex={modalState.variantIndex}
          tags={tags}
          onClose={() => setModalState(null)}
        />
      )}
    </div>
  );
};
