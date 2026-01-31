import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useArtifacts } from '../hooks/useArtifacts';
import { useSubjects } from '../hooks/useSubjects';
import { isAdmin } from '../config/adminEmails';
import { ArtifactCard } from '../components/showcase/ArtifactCard';
import { ArtifactModal } from '../components/showcase/ArtifactModal';
import { SubjectFilter } from '../components/showcase/SubjectFilter';
import { TagFilter } from '../components/showcase/TagFilter';
import type { Artifact, ArtifactTag } from '../types/artifact.types';

export const ShowcasePage = () => {
  const { user, loading: authLoading } = useAuth();
  const { artifacts, loading: artifactsLoading } = useArtifacts({ publicOnly: true });
  const { subjects, loading: subjectsLoading } = useSubjects();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<ArtifactTag[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  const filteredArtifacts = useMemo(() => {
    return artifacts.filter((artifact) => {
      if (selectedSubjectId && artifact.subjectId !== selectedSubjectId) {
        return false;
      }

      if (selectedTags.length > 0) {
        const hasAllTags = selectedTags.every((tag) => artifact.tags.includes(tag));
        if (!hasAllTags) return false;
      }

      return true;
    });
  }, [artifacts, selectedSubjectId, selectedTags]);

  const getSubject = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId);
  };

  const loading = authLoading || artifactsLoading || subjectsLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              <span className="text-xl font-bold text-gray-900">
                Random Teacher
              </span>
            </div>

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
                selectedTags={selectedTags}
                onChange={setSelectedTags}
              />
            </div>

            {filteredArtifacts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500 mb-2">
                  {artifacts.length === 0
                    ? 'Артефактов пока нет'
                    : 'Нет артефактов с выбранными фильтрами'}
                </p>
                {(selectedSubjectId || selectedTags.length > 0) && (
                  <button
                    onClick={() => {
                      setSelectedSubjectId(null);
                      setSelectedTags([]);
                    }}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    Сбросить фильтры
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredArtifacts.map((artifact) => (
                  <ArtifactCard
                    key={artifact.id}
                    artifact={artifact}
                    subject={getSubject(artifact.subjectId)}
                    onClick={() => setSelectedArtifact(artifact)}
                  />
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
          onClose={() => setSelectedArtifact(null)}
        />
      )}
    </div>
  );
};
