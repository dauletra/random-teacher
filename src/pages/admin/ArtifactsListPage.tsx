import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { useArtifactGroups } from '../../hooks/useArtifactGroups';
import { useArtifacts } from '../../hooks/useArtifacts';
import { useSubjects } from '../../hooks/useSubjects';
import { useTags } from '../../hooks/useTags';
import { artifactGroupService } from '../../services/artifactGroupService';
import { migrateArtifactsToGroups } from '../../utils/migrateArtifacts';
import { normalizeArtifactGroup } from '../../utils/artifactHelpers';
import type { ArtifactGroup } from '../../types/artifact.types';
import toast from 'react-hot-toast';

export const ArtifactsListPage = () => {
  const { groups, loading: groupsLoading } = useArtifactGroups();
  const { artifacts, loading: artifactsLoading } = useArtifacts();
  const { subjects } = useSubjects();
  const { tags } = useTags();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);

  const loading = groupsLoading || artifactsLoading;

  // Normalize groups for backward compatibility
  const normalizedGroups = useMemo(
    () => groups.map((g) => normalizeArtifactGroup(g as Record<string, any>)),
    [groups]
  );

  // Подсчёт вариантов для каждой группы
  const variantCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of artifacts) {
      if (a.groupId) {
        counts.set(a.groupId, (counts.get(a.groupId) || 0) + 1);
      }
    }
    return counts;
  }, [artifacts]);

  // Проверяем, есть ли немигрированные артефакты (без groupId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasLegacyArtifacts = artifacts.some((a: any) => !a.groupId);

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject?.name || 'Пәнсіз';
  };

  const getTagLabel = (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    return tag?.label || tagId;
  };

  const handleDelete = async (group: ArtifactGroup) => {
    const count = variantCounts.get(group.id) || 0;
    if (!confirm(`Жою "${group.title}" және барлық ${count} нұсқаны?`)) return;

    setDeletingId(group.id);
    try {
      await artifactGroupService.delete(group.id);
      toast.success('Топ жойылды');
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Жою кезінде қате кетті');
    } finally {
      setDeletingId(null);
    }
  };

  const handleMigrate = async () => {
    if (!confirm('Ескі артефакттарды жаңа форматқа ауыстыру')) return;

    setMigrating(true);
    try {
      const count = await migrateArtifactsToGroups();
      if (count > 0) {
        toast.success(`${count} артефакт ауысты`);
      } else {
        toast.success('Ауыстыратан ешнәрсе жоқ');
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Ауыстыру кезінде қате кетті');
    } finally {
      setMigrating(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Артефакттар</h1>
        <div className="flex gap-2">
          {hasLegacyArtifacts && (
            <button
              onClick={handleMigrate}
              disabled={migrating}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors text-sm"
            >
              {migrating ? 'Ауысу...' : 'Ауыстыру'}
            </button>
          )}
          <Link
            to="/admin/artifacts/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Артефакт қосу
          </Link>
        </div>
      </div>

      {normalizedGroups.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">Әзірге артефакттар жоқ</p>
          <Link
            to="/admin/artifacts/new"
            className="text-indigo-600 hover:text-indigo-700"
          >
            Алғашқы артефактті қосу
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Атауы
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Пәні
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Тегтер
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Нұсқалар
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Автор
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Күйі
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Әрекет
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {normalizedGroups.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {group.title}
                    </div>
                    {group.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {group.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {getSubjectName(group.subjectId)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {group.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {getTagLabel(tag)}
                        </span>
                      ))}
                      {group.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{group.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700">
                      {variantCounts.get(group.id) || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700">
                      {group.authorName || 'Admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          group.isPublic
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {group.isPublic ? 'Қолжетімді' : 'Жасырын'}
                      </span>
                      <button
                        onClick={async () => {
                          try {
                            await artifactGroupService.setFeatured(group.id, !group.isFeatured);
                            toast.success(group.isFeatured ? 'Ұсынылғаннан алынды' : 'Ұсынылған ретінде белгіленді');
                          } catch {
                            toast.error('Қате кетті');
                          }
                        }}
                        className={`text-lg transition-colors ${
                          group.isFeatured ? 'text-amber-500 hover:text-amber-600' : 'text-gray-300 hover:text-amber-400'
                        }`}
                        title={group.isFeatured ? 'Ұсынылғаннан алу' : 'Ұсынылған ету'}
                      >
                        ⭐
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/admin/artifacts/${group.id}`}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Өңдеу
                    </Link>
                    <button
                      onClick={() => handleDelete(group)}
                      disabled={deletingId === group.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {deletingId === group.id ? 'Жою...' : 'Жою'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};
