import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubjects } from '../../hooks/useSubjects';
import { useTags } from '../../hooks/useTags';
import { artifactGroupService } from '../../services/artifactGroupService';
import { artifactService } from '../../services/artifactService';
import { ImageUploader } from './ImageUploader';
import { normalizeArtifactGroup } from '../../utils/artifactHelpers';
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

interface ArtifactEditFormProps {
  mode: 'admin' | 'user';
  initialGroupId?: string;
  onSaveRedirect: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
}

const MAX_VARIANTS = 5;

export const ArtifactEditForm = ({
  mode,
  initialGroupId,
  onSaveRedirect,
  authorId,
  authorName,
  authorPhotoURL,
}: ArtifactEditFormProps) => {
  const navigate = useNavigate();
  const { subjects, loading: subjectsLoading } = useSubjects();
  const { tags, loading: tagsLoading } = useTags();
  const isNew = !initialGroupId || initialGroupId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    tags: [] as string[],
    thumbnail: '',
    thumbnailPublicId: '',
    order: 0,
    isPublic: true,
    isFeatured: false,
  });
  const [variants, setVariants] = useState<VariantFormData[]>([
    { variantLabel: '', artifactUrl: '', description: '', order: 0 },
  ]);
  const [loadedArtifactIds, setLoadedArtifactIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isNew && initialGroupId) {
      loadGroup(initialGroupId);
    }
  }, [initialGroupId, isNew]);

  const loadGroup = async (groupId: string) => {
    try {
      const rawGroup = await artifactGroupService.getById(groupId);
      if (rawGroup) {
        const group = normalizeArtifactGroup(rawGroup as Record<string, any>);

        if (mode === 'user' && group.authorId !== authorId) {
          toast.error('Бұл артефактты өңдеуге рұқсат жоқ');
          navigate(onSaveRedirect);
          return;
        }

        setFormData({
          title: group.title,
          description: group.description,
          subjectId: group.subjectId,
          tags: group.tags,
          thumbnail: group.thumbnail || '',
          thumbnailPublicId: '',
          order: group.order,
          isPublic: group.isPublic,
          isFeatured: group.isFeatured ?? false,
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
        toast.error('Топ табылмады');
        navigate(onSaveRedirect);
      }
    } catch (error) {
      console.error('Error loading group:', error);
      toast.error('Жүктеу кезінде қате кетті');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Атауын енгізіңіз');
      return;
    }

    if (!formData.subjectId) {
      toast.error('Пәнді таңдаңыз');
      return;
    }

    const validVariants = variants.filter((v) => v.artifactUrl.trim());
    if (validVariants.length === 0) {
      toast.error('Ең болмағанда нұсқа егізіңіз');
      return;
    }

    for (const v of validVariants) {
      if (!isValidArtifactUrl(v.artifactUrl.trim())) {
        toast.error(`URL қате: ${v.artifactUrl}`);
        return;
      }
      if (!v.variantLabel.trim()) {
        toast.error('Әр нұсқа үшін атауын енгізіңіз');
        return;
      }
    }

    setSaving(true);
    try {
      const groupData: Record<string, any> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        subjectId: formData.subjectId,
        tags: formData.tags,
        thumbnail: formData.thumbnail.trim() || undefined,
        order: mode === 'admin' ? formData.order : 0,
        isPublic: mode === 'admin' ? formData.isPublic : true,
      };

      if (isNew) {
        groupData.authorId = authorId;
        groupData.authorName = authorName;
        if (authorPhotoURL) groupData.authorPhotoURL = authorPhotoURL;
        groupData.isFeatured = mode === 'admin' ? formData.isFeatured : false;
        groupData.viewCount = 0;
      } else if (mode === 'admin') {
        groupData.isFeatured = formData.isFeatured;
      }

      let groupId: string;

      if (isNew) {
        groupId = await artifactGroupService.create(
          groupData as Omit<ArtifactGroup, 'id' | 'createdAt' | 'updatedAt'>
        );
      } else {
        groupId = initialGroupId!;
        await artifactGroupService.update(groupId, groupData);
      }

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

      for (const oldId of loadedArtifactIds) {
        if (!currentIds.has(oldId)) {
          await artifactService.delete(oldId);
        }
      }

      toast.success(isNew ? 'Артефакт жасалды' : 'Артефакт жаңартылды');
      navigate(onSaveRedirect);
    } catch (error) {
      console.error('Error saving group:', error);
      toast.error('Сақтау кезінде қате кетті');
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
      toast.error(`Максимум ${MAX_VARIANTS} нұсқа`);
      return;
    }
    setVariants((prev) => [
      ...prev,
      { variantLabel: '', artifactUrl: '', description: '', order: prev.length },
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 1) {
      toast.error('Ең болмағанда бір нұсқа керек');
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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isNew ? 'Артефакт қосу' : 'Артефактті өңдеу'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Атауы *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Мысалы: ХБЖ келтіру"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Сипаттама
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Қысқаша сипаттамасы"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Пән *
          </label>
          <select
            value={formData.subjectId}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, subjectId: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Таңдаңыз предмет</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.icon} {subject.name}
              </option>
            ))}
          </select>
          {subjects.length === 0 && (
            <p className="mt-1 text-sm text-amber-600">
              Алдымен "Пәндер" бөлімінде пән қосыңыз
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Тегтер
          </label>
          {tags.length === 0 ? (
            <p className="text-sm text-amber-600">
              Алдымен "Тегтер" бөліміне тегтер қосыңыз
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Көрініс суреті (міндетті емес)
          </label>
          <ImageUploader
            currentImageUrl={formData.thumbnail}
            onUpload={(url, publicId) => {
              setFormData((prev) => ({
                ...prev,
                thumbnail: url,
                thumbnailPublicId: publicId,
              }));
            }}
            onRemove={() => {
              setFormData((prev) => ({
                ...prev,
                thumbnail: '',
                thumbnailPublicId: '',
              }));
            }}
          />
          <p className="mt-2 text-xs text-gray-500">
            Суретті сүйреңіз, файлды таңдаңыз немесе скриншотты қойыңыз (Ctrl+V)
          </p>
        </div>

        {mode === 'admin' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Реті
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
            <div className="flex flex-col justify-end gap-2 pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))
                  }
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Басты бетте көрсету</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isFeatured: e.target.checked }))
                  }
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Ұсынылған (Featured)</span>
              </label>
            </div>
          </div>
        )}

        {/* Варианты */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Нұсқалар ({variants.length}/{MAX_VARIANTS})
            </h2>
            <button
              type="button"
              onClick={addVariant}
              disabled={variants.length >= MAX_VARIANTS}
              className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              + Нұсқа қосу
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
                    Нұсқа {index + 1}
                  </span>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Жою
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Нұсқаның атауы *
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
                      Артефакт URL *
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
                      Нұсқаның сипаттамасы (міндетті емес)
                    </label>
                    <input
                      type="text"
                      value={variant.description}
                      onChange={(e) =>
                        updateVariant(index, 'description', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      placeholder="Осы нұсқа үшін қосымша сипаттама"
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
            {saving ? 'Сақтау...' : isNew ? 'Жариялау' : 'Сақтау'}
          </button>
          <button
            type="button"
            onClick={() => navigate(onSaveRedirect)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Кері қайту
          </button>
        </div>
      </form>
    </div>
  );
};
