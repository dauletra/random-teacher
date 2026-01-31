import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { useArtifacts } from '../../hooks/useArtifacts';
import { useSubjects } from '../../hooks/useSubjects';
import { artifactService } from '../../services/artifactService';
import { TAG_LABELS } from '../../types/artifact.types';
import type { Artifact } from '../../types/artifact.types';
import toast from 'react-hot-toast';

export const ArtifactsListPage = () => {
  const { artifacts, loading } = useArtifacts();
  const { subjects } = useSubjects();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'Без предмета';
  };

  const handleDelete = async (artifact: Artifact) => {
    if (!confirm(`Удалить артефакт "${artifact.title}"?`)) return;

    setDeletingId(artifact.id);
    try {
      await artifactService.delete(artifact.id);
      toast.success('Артефакт удален');
    } catch (error) {
      console.error('Error deleting artifact:', error);
      toast.error('Ошибка при удалении');
    } finally {
      setDeletingId(null);
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
        <h1 className="text-2xl font-bold text-gray-900">Артефакты</h1>
        <Link
          to="/admin/artifacts/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Добавить артефакт
        </Link>
      </div>

      {artifacts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">Артефактов пока нет</p>
          <Link
            to="/admin/artifacts/new"
            className="text-indigo-600 hover:text-indigo-700"
          >
            Добавить первый артефакт
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Предмет
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Теги
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {artifacts.map((artifact) => (
                <tr key={artifact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {artifact.title}
                    </div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {artifact.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {getSubjectName(artifact.subjectId)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {artifact.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {TAG_LABELS[tag]}
                        </span>
                      ))}
                      {artifact.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{artifact.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        artifact.isPublic
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {artifact.isPublic ? 'Публичный' : 'Скрытый'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/admin/artifacts/${artifact.id}`}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Редактировать
                    </Link>
                    <button
                      onClick={() => handleDelete(artifact)}
                      disabled={deletingId === artifact.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {deletingId === artifact.id ? 'Удаление...' : 'Удалить'}
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
