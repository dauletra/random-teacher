import { useState, useMemo } from 'react';
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
    // Sort each group's artifacts by order
    for (const [, list] of artifactsByGroup) {
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    return { artifactsByGroup };
  }, [artifacts]);

  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      // Only show groups that have at least one artifact
      if (!groupsWithArtifacts.artifactsByGroup.has(group.id)) return false;

      if (selectedSubjectId && group.subjectId !== selectedSubjectId) {
        return false;
      }

      if (selectedTagIds.length > 0) {
        const hasAllTags = selectedTagIds.every((tagId) => group.tags.includes(tagId));
        if (!hasAllTags) return false;
      }

      return true;
    });
  }, [groups, groupsWithArtifacts, selectedSubjectId, selectedTagIds]);

  const getSubject = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId);
  };

  // Group by subject for display
  const groupsBySubject = useMemo(() => {
    const grouped = new Map<string, ArtifactGroup[]>();

    filteredGroups.forEach((group) => {
      const subjectId = group.subjectId;
      if (!grouped.has(subjectId)) {
        grouped.set(subjectId, []);
      }
      grouped.get(subjectId)!.push(group);
    });

    const sortedSubjects = subjects
      .filter((s) => grouped.has(s.id))
      .sort((a, b) => a.order - b.order);

    return sortedSubjects.map((subject) => ({
      subject,
      groups: grouped.get(subject.id) || [],
    }));
  }, [filteredGroups, subjects]);

  const openModal = (group: ArtifactGroup, variantIndex: number) => {
    const groupArtifacts = groupsWithArtifacts.artifactsByGroup.get(group.id) || [];
    if (groupArtifacts.length === 0) return;
    setModalState({ group, artifacts: groupArtifacts, variantIndex });
  };

  const loading = authLoading || groupsLoading || artifactsLoading || subjectsLoading || tagsLoading;

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
                      Админ
                    </Link>
                  )}
                  <Link
                    to="/dashboard"
                    className="px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs md:text-sm font-medium"
                  >
                    Мои классы
                  </Link>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs md:text-sm font-medium"
                >
                  Войти
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="text-center mb-4 md:mb-8">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
            Интерактивные инструменты для учителей
          </h1>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
            Коллекция Claude-артефактов для использования на уроках.
            Симуляторы, игры, тесты и многое другое.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {subjects.length > 0 && (
              <div className="mb-6">
                <SubjectFilter
                  subjects={subjects}
                  selectedId={selectedSubjectId}
                  onChange={setSelectedSubjectId}
                />
              </div>
            )}

            <div className="mb-8">
              <TagFilter
                tags={tags}
                selectedTagIds={selectedTagIds}
                onChange={setSelectedTagIds}
              />
            </div>

            {filteredGroups.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500 mb-2">
                  {groups.length === 0
                    ? 'Артефактов пока нет'
                    : 'Нет артефактов с выбранными фильтрами'}
                </p>
                {(selectedSubjectId || selectedTagIds.length > 0) && (
                  <button
                    onClick={() => {
                      setSelectedSubjectId(null);
                      setSelectedTagIds([]);
                    }}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    Сбросить фильтры
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-10">
                {groupsBySubject.map(({ subject, groups: subjectGroups }) => (
                  <section key={subject.id}>
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-200">
                      <span className="text-2xl">{subject.icon}</span>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {subject.name}
                      </h2>
                      <span className="text-sm text-gray-500">
                        ({subjectGroups.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {subjectGroups.map((group) => (
                        <ArtifactCard
                          key={group.id}
                          group={group}
                          artifacts={groupsWithArtifacts.artifactsByGroup.get(group.id) || []}
                          subject={subject}
                          tags={tags}
                          onVariantClick={(index) => openModal(group, index)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
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
