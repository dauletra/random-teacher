import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { useSubjects } from '../../hooks/useSubjects';
import { useTags } from '../../hooks/useTags';
import { artifactGroupService } from '../../services/artifactGroupService';
import { artifactService } from '../../services/artifactService';
import type { ArtifactGroup } from '../../types/artifact.types';
import { normalizeArtifactUrl, isValidArtifactUrl, getViewUrl } from '../../utils/artifactUrl';
import toast from 'react-hot-toast';

interface VariantFormData {
  id?: string;
  variantLabel: string;
  artifactUrl: string;
  description: string;
  order: number;
}

const MAX_VARIANTS = 5;

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
    subjectId: '',
    tags: [] as string[],
    thumbnail: '',
    order: 0,
    isPublic: true,
  });
  const [variants, setVariants] = useState<VariantFormData[]>([
    { variantLabel: '', artifactUrl: '', description: '', order: 0 },
  ]);
  const [loadedArtifactIds, setLoadedArtifactIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isNew && id) {
      loadGroup(id);
    }
  }, [id, isNew]);

  const loadGroup = async (groupId: string) => {
    try {
      const group = await artifactGroupService.getById(groupId);
      if (group) {
        setFormData({
          title: group.title,
          description: group.description,
          subjectId: group.subjectId,
          tags: group.tags,
          thumbnail: group.thumbnail || '',
          order: group.order,
          isPublic: group.isPublic,
        });

        const artifacts = await artifactService.getByGroupId(groupId);
        if (artifacts.length > 0) {
          setVariants(
            artifacts.map((a, i) => ({
              id: a.id,
              variantLabel: a.variantLabel,
              artifactUrl: getViewUrl(a.embedUrl),
              description: a.description || '',
              order: a.order ?? i,
            }))
          );
          setLoadedArtifactIds(artifacts.map((a) => a.id));
        }
      } else {
        toast.error('Группа не найдена');
        navigate('/admin');
      }
    } catch (error) {
      console.error('Error loading group:', error);
      toast.error('Ошибка загрузки');
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

    if (!formData.subjectId) {
      toast.error('Выберите предмет');
      return;
    }

    // Validate variants
    const validVariants = variants.filter((v) => v.artifactUrl.trim());
    if (validVariants.length === 0) {
      toast.error('Добавьте хотя бы один вариант с URL');
      return;
    }

    for (const v of validVariants) {
      if (!isValidArtifactUrl(v.artifactUrl.trim())) {
        toast.error(`Некорректный URL: ${v.artifactUrl}`);
        return;
      }
      if (!v.variantLabel.trim()) {
        toast.error('Укажите название для каждого варианта');
        return;
      }
    }

    setSaving(true);
    try {
      const groupData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        subjectId: formData.subjectId,
        tags: formData.tags,
        thumbnail: formData.thumbnail.trim() || undefined,
        order: formData.order,
        isPublic: formData.isPublic,
      };

      let groupId: string;

      if (isNew) {
        groupId = await artifactGroupService.create(
          groupData as Omit<ArtifactGroup, 'id' | 'createdAt' | 'updatedAt'>
        );
      } else {
        groupId = id!;
        await artifactGroupService.update(groupId, groupData);
      }

      // Save variants
      const currentIds = new Set<string>();

      for (let i = 0; i < validVariants.length; i++) {
        const v = validVariants[i];
        const normalizedUrl = normalizeArtifactUrl(v.artifactUrl.trim());
        const artifactData = {
          groupId,
          variantLabel: v.variantLabel.trim(),
          embedUrl: normalizedUrl,
          description: v.description.trim() || undefined,
          order: i,
        };

        if (v.id) {
          await artifactService.update(v.id, artifactData);
          currentIds.add(v.id);
        } else {
          const newId = await artifactService.create(artifactData);
          currentIds.add(newId);
        }
      }

      // Delete removed variants
      for (const oldId of loadedArtifactIds) {
        if (!currentIds.has(oldId)) {
          await artifactService.delete(oldId);
        }
      }

      toast.success(isNew ? 'Группа создана' : 'Группа обновлена');
      navigate('/admin');
    } catch (error) {
      console.error('Error saving group:', error);
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

  const addVariant = () => {
    if (variants.length >= MAX_VARIANTS) {
      toast.error(`Максимум ${MAX_VARIANTS} вариантов`);
      return;
    }
    setVariants((prev) => [
      ...prev,
      { variantLabel: '', artifactUrl: '', description: '', order: prev.length },
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 1) {
      toast.error('Нужен хотя бы один вариант');
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof VariantFormData, value: string | number) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
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
          {/* Метаданные группы */}
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
              placeholder="Например: Перевод в СИ"
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
              placeholder="Краткое описание"
            />
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

          <div className="grid grid-cols-2 gap-4">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))
                  }
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Показывать на витрине</span>
              </label>
            </div>
          </div>

          {/* Варианты */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Варианты ({variants.length}/{MAX_VARIANTS})
              </h2>
              <button
                type="button"
                onClick={addVariant}
                disabled={variants.length >= MAX_VARIANTS}
                className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                + Добавить вариант
              </button>
            </div>

            <div className="space-y-4">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-500">
                      Вариант {index + 1}
                    </span>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Удалить
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Название варианта *
                      </label>
                      <input
                        type="text"
                        value={variant.variantLabel}
                        onChange={(e) =>
                          updateVariant(index, 'variantLabel', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        placeholder="Например: Тест, Рейтинг, Қазақша"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        URL артефакта *
                      </label>
                      <input
                        type="url"
                        value={variant.artifactUrl}
                        onChange={(e) =>
                          updateVariant(index, 'artifactUrl', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        placeholder="https://claude.ai/public/artifacts/..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Описание варианта (необязательно)
                      </label>
                      <input
                        type="text"
                        value={variant.description}
                        onChange={(e) =>
                          updateVariant(index, 'description', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        placeholder="Доп. описание для этого варианта"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
