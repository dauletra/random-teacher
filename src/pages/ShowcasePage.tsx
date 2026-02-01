import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useArtifacts } from '../hooks/useArtifacts';
import { useSubjects } from '../hooks/useSubjects';
import { useTags } from '../hooks/useTags';
import { isAdmin } from '../config/adminEmails';
import { ArtifactCard } from '../components/showcase/ArtifactCard';
import { ArtifactModal } from '../components/showcase/ArtifactModal';
import { SubjectFilter } from '../components/showcase/SubjectFilter';
import { TagFilter } from '../components/showcase/TagFilter';
import type { Artifact } from '../types/artifact.types';

export const ShowcasePage = () => {
  const { user, loading: authLoading } = useAuth();
  const { artifacts, loading: artifactsLoading } = useArtifacts({ publicOnly: true });
  const { subjects, loading: subjectsLoading } = useSubjects();
  const { tags, loading: tagsLoading } = useTags();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  const filteredArtifacts = useMemo(() => {
    return artifacts.filter((artifact) => {
      if (selectedSubjectId && artifact.subjectId !== selectedSubjectId) {
        return false;
      }

      if (selectedTagIds.length > 0) {
        const hasAllTags = selectedTagIds.every((tagId) => artifact.tags.includes(tagId));
        if (!hasAllTags) return false;
      }

      return true;
    });
  }, [artifacts, selectedSubjectId, selectedTagIds]);

  const getSubject = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId);
  };

  // Группировка артефактов по предметам
  const artifactsBySubject = useMemo(() => {
    const grouped = new Map<string, Artifact[]>();

    filteredArtifacts.forEach((artifact) => {
      const subjectId = artifact.subjectId;
      if (!grouped.has(subjectId)) {
        grouped.set(subjectId, []);
      }
      grouped.get(subjectId)!.push(artifact);
    });

    // Сортируем предметы по order
    const sortedSubjects = subjects
      .filter((s) => grouped.has(s.id))
      .sort((a, b) => a.order - b.order);

    return sortedSubjects.map((subject) => ({
      subject,
      artifacts: grouped.get(subject.id) || [],
    }));
  }, [filteredArtifacts, subjects]);

  const loading = authLoading || artifactsLoading || subjectsLoading || tagsLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <svg
                className="w-10 h-10"
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
              <span className="text-xl font-bold text-gray-900">
                Random Teacher
              </span>
            </Link>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {isAdmin(user.email) && (
                    <Link
                      to="/admin"
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Админ
                    </Link>
                  )}
                  <Link
                    to="/dashboard"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Мои классы
                  </Link>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  Войти
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Интерактивные инструменты для учителей
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
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

            {filteredArtifacts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500 mb-2">
                  {artifacts.length === 0
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
                {artifactsBySubject.map(({ subject, artifacts: subjectArtifacts }) => (
                  <section key={subject.id}>
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-200">
                      <span className="text-2xl">{subject.icon}</span>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {subject.name}
                      </h2>
                      <span className="text-sm text-gray-500">
                        ({subjectArtifacts.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {subjectArtifacts.map((artifact) => (
                        <ArtifactCard
                          key={artifact.id}
                          artifact={artifact}
                          subject={subject}
                          tags={tags}
                          onClick={() => setSelectedArtifact(artifact)}
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

      {selectedArtifact && (
        <ArtifactModal
          artifact={selectedArtifact}
          subject={getSubject(selectedArtifact.subjectId)}
          tags={tags}
          onClose={() => setSelectedArtifact(null)}
        />
      )}
    </div>
  );
};
