import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { useSubjects } from '../../hooks/useSubjects';
import { useTags } from '../../hooks/useTags';
import { artifactService } from '../../services/artifactService';
import type { Artifact } from '../../types/artifact.types';
import { normalizeArtifactUrl, isValidArtifactUrl, getViewUrl } from '../../utils/artifactUrl';
import toast from 'react-hot-toast';

export const ArtifactEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { subjects, loading: subjectsLoading } = useSubjects();
  const { tags, loading: tagsLoading } = useTags();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    artifactUrl: '',
    subjectId: '',
    tags: [] as string[],
    thumbnail: '',
    order: 0,
    isPublic: true,
  });

  useEffect(() => {
    if (!isNew && id) {
      loadArtifact(id);
    }
  }, [id, isNew]);

  const loadArtifact = async (artifactId: string) => {
    try {
      const artifact = await artifactService.getById(artifactId);
      if (artifact) {
        setFormData({
          title: artifact.title,
          description: artifact.description,
          artifactUrl: getViewUrl(artifact.embedUrl),
          subjectId: artifact.subjectId,
          tags: artifact.tags,
          thumbnail: artifact.thumbnail || '',
          order: artifact.order,
          isPublic: artifact.isPublic,
        });
      } else {
        toast.error('Артефакт не найден');
        navigate('/admin');
      }
    } catch (error) {
      console.error('Error loading artifact:', error);
      toast.error('Ошибка загрузки артефакта');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Введите название');
      return;
    }

    if (!formData.artifactUrl.trim()) {
      toast.error('Введите URL артефакта');
      return;
    }

    if (!isValidArtifactUrl(formData.artifactUrl.trim())) {
      toast.error('Некорректный URL артефакта. Используйте ссылку с claude.ai или claude.site');
      return;
    }

    if (!formData.subjectId) {
      toast.error('Выберите предмет');
      return;
    }

    setSaving(true);
    try {
      const normalizedUrl = normalizeArtifactUrl(formData.artifactUrl.trim());

      const data = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        embedUrl: normalizedUrl,
        subjectId: formData.subjectId,
        tags: formData.tags,
        thumbnail: formData.thumbnail.trim() || undefined,
        order: formData.order,
        isPublic: formData.isPublic,
      };

      if (isNew) {
        await artifactService.create(data as Omit<Artifact, 'id' | 'createdAt' | 'updatedAt'>);
        toast.success('Артефакт создан');
      } else if (id) {
        await artifactService.update(id, data);
        toast.success('Артефакт обновлен');
      }

      navigate('/admin');
    } catch (error) {
      console.error('Error saving artifact:', error);
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((t) => t !== tagId)
        : [...prev.tags, tagId],
    }));
  };

  if (loading || subjectsLoading || tagsLoading) {
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
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isNew ? 'Добавить артефакт' : 'Редактировать артефакт'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Например: Симулятор маятника"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Краткое описание артефакта"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL артефакта *
            </label>
            <input
              type="url"
              value={formData.artifactUrl}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, artifactUrl: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://claude.ai/public/artifacts/..."
            />
            <p className="mt-1 text-sm text-gray-500">
              Скопируй ссылку на артефакт из Claude (любой формат)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Предмет *
            </label>
            <select
              value={formData.subjectId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, subjectId: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Выберите предмет</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.icon} {subject.name}
                </option>
              ))}
            </select>
            {subjects.length === 0 && (
              <p className="mt-1 text-sm text-amber-600">
                Сначала добавьте предметы в разделе "Предметы"
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Теги
            </label>
            {tags.length === 0 ? (
              <p className="text-sm text-amber-600">
                Сначала добавьте теги в разделе "Теги"
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      formData.tags.includes(tag.id)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL превью (необязательно)
            </label>
            <input
              type="url"
              value={formData.thumbnail}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, thumbnail: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://example.com/image.png"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Порядок сортировки
            </label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  order: parseInt(e.target.value) || 0,
                }))
              }
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))
              }
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-700">
              Показывать на витрине (публичный)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Сохранение...' : isNew ? 'Создать' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};
