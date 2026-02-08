import {
  COLLECTIONS,
  createDocument,
  getDocuments,
  updateDocument,
  orderBy,
} from './firestore';
import type { ArtifactGroup } from '../types/artifact.types';

// Интерфейс старого артефакта (до миграции)
interface LegacyArtifact {
  id: string;
  title: string;
  description: string;
  embedUrl: string;
  subjectId: string;
  tags: string[];
  thumbnail?: string;
  order: number;
  isPublic: boolean;
}

/**
 * Одноразовая миграция: каждый старый артефакт → ArtifactGroup + обновлённый Artifact
 * Вызвать один раз из админки после деплоя.
 */
export async function migrateArtifactsToGroups(): Promise<number> {
  const oldArtifacts = await getDocuments<LegacyArtifact>(
    COLLECTIONS.ARTIFACTS,
    orderBy('order', 'asc')
  );

  // Пропускаем уже мигрированные (у которых есть groupId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toMigrate = oldArtifacts.filter((a: any) => !a.groupId);

  if (toMigrate.length === 0) {
    return 0;
  }

  for (const artifact of toMigrate) {
    // 1. Создаём группу из метаданных артефакта
    const groupId = await createDocument<ArtifactGroup>(COLLECTIONS.ARTIFACT_GROUPS, {
      title: artifact.title,
      description: artifact.description || '',
      subjectId: artifact.subjectId,
      tags: artifact.tags || [],
      thumbnail: artifact.thumbnail,
      order: artifact.order || 0,
      isPublic: artifact.isPublic ?? true,
    });

    // 2. Обновляем артефакт: добавляем groupId и variantLabel
    await updateDocument(COLLECTIONS.ARTIFACTS, artifact.id, {
      groupId,
      variantLabel: 'Основной',
      order: 0,
    });
  }

  return toMigrate.length;
}
