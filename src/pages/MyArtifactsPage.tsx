import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMyArtifactGroups } from '../hooks/useMyArtifactGroups';
import { useArtifacts } from '../hooks/useArtifacts';
import { useSubjects } from '../hooks/useSubjects';
import { artifactGroupService } from '../services/artifactGroupService';
import { Eye, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const MyArtifactsPage = () => {
  const { groups, loading: groupsLoading } = useMyArtifactGroups();
  const { artifacts, loading: artifactsLoading } = useArtifacts();
  const { subjects } = useSubjects();

  const artifactsByGroup = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of artifacts) {
      if (!a.groupId) continue;
      map.set(a.groupId, (map.get(a.groupId) || 0) + 1);
    }
    return map;
  }, [artifacts]);

  const getSubject = (subjectId: string) =>
    subjects.find((s) => s.id === subjectId);

  const handleDelete = async (groupId: string, title: string) => {
    if (!window.confirm(`"${title}" артефактын жою керек пе?`)) return;
    try {
      await artifactGroupService.delete(groupId);
      toast.success('Артефакт жойылды');
    } catch {
      toast.error('Жою кезінде қате кетті');
    }
  };

  const loading = groupsLoading || artifactsLoading;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
          Менің артефакттарым
        </h1>
        <Link
          to="/my-artifacts/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Жаңа артефакт</span>
          <span className="sm:hidden">Қосу</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-5xl mb-4">🎨</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Әзірше артефакттар жоқ
          </h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Claude-артефакттарыңызды жариялап, оқушыларыңызбен бөлісіңіз
          </p>
          <Link
            to="/my-artifacts/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Бірінші артефактты жариялау
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const subject = getSubject(group.subjectId);
            const variantCount = artifactsByGroup.get(group.id) || 0;

            return (
              <div
                key={group.id}
                className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors"
              >
                {subject && (
                  <span className="text-2xl flex-shrink-0">{subject.icon}</span>
                )}

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {group.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                    {subject && <span>{subject.name}</span>}
                    {variantCount > 0 && (
                      <span>{variantCount} нұсқа</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {group.viewCount || 0}
                    </span>
                    {group.isFeatured && (
                      <span className="text-amber-600 font-medium">Ұсынылған</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to={`/my-artifacts/${group.id}`}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Өңдеу"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(group.id, group.title)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Жою"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
