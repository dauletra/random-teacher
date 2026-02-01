import type { Tag, Artifact } from '../types/artifact.types';
import {
  COLLECTIONS,
  createDocument,
  getDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  orderBy,
} from '../utils/firestore';

// Начальные теги
const DEFAULT_TAGS: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'multiplayer', label: 'Мультиплеер', order: 0 },
  { name: 'solo', label: 'Одиночный', order: 1 },
  { name: 'game', label: 'Игра', order: 2 },
  { name: 'test', label: 'Тест', order: 3 },
  { name: 'rating', label: 'Рейтинг', order: 4 },
  { name: 'timer', label: 'Таймер', order: 5 },
  { name: 'learning', label: 'Обучение', order: 6 },
  { name: 'theory', label: 'Теория', order: 7 },
];

export const tagService = {
  async create(data: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return await createDocument<Tag>(COLLECTIONS.TAGS, data);
  },

  async getById(tagId: string): Promise<Tag | null> {
    return await getDocument<Tag>(COLLECTIONS.TAGS, tagId);
  },

  async getAll(): Promise<Tag[]> {
    return await getDocuments<Tag>(
      COLLECTIONS.TAGS,
      orderBy('order', 'asc')
    );
  },

  async update(tagId: string, data: Partial<Omit<Tag, 'id' | 'createdAt'>>): Promise<void> {
    await updateDocument<Tag>(COLLECTIONS.TAGS, tagId, data);
  },

  async delete(tagId: string): Promise<void> {
    await deleteDocument(COLLECTIONS.TAGS, tagId);
  },

  // Удаление тега с каскадным удалением из всех артефактов
  async deleteWithCascade(tagId: string): Promise<number> {
    // Получаем все артефакты
    const artifacts = await getDocuments<Artifact>(COLLECTIONS.ARTIFACTS);

    // Обновляем артефакты, удаляя тег из массива tags
    let updatedCount = 0;
    for (const artifact of artifacts) {
      if (artifact.tags.includes(tagId)) {
        const newTags = artifact.tags.filter(t => t !== tagId);
        await updateDocument<Artifact>(COLLECTIONS.ARTIFACTS, artifact.id, { tags: newTags });
        updatedCount++;
      }
    }

    // Удаляем сам тег
    await deleteDocument(COLLECTIONS.TAGS, tagId);

    return updatedCount;
  },

  // Инициализация начальных тегов
  async seedDefaultTags(): Promise<number> {
    const existingTags = await this.getAll();

    let addedCount = 0;
    for (const defaultTag of DEFAULT_TAGS) {
      // Проверяем, есть ли уже тег с таким name
      const exists = existingTags.some(t => t.name === defaultTag.name);
      if (!exists) {
        await this.create(defaultTag);
        addedCount++;
      }
    }

    return addedCount;
  },
};
