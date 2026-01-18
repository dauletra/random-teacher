/**
 * Утилиты для работы с sessionStorage
 * Обеспечивают типобезопасное хранение и валидацию данных
 */

const SESSION_STORAGE_PREFIX = 'random-teacher-app';

/**
 * Создает ключ для sessionStorage с namespace
 */
export const createStorageKey = (journalId: string, lessonId: string, tabName: string): string => {
  return `${SESSION_STORAGE_PREFIX}:journal_${journalId}:lesson_${lessonId}:${tabName}`;
};

/**
 * Сохраняет данные в sessionStorage с валидацией
 */
export const saveToSession = <T>(key: string, value: T): void => {
  try {
    const serialized = JSON.stringify(value);
    sessionStorage.setItem(key, serialized);
  } catch (error) {
    console.error(`Error saving to sessionStorage (key: ${key}):`, error);
  }
};

/**
 * Загружает данные из sessionStorage с валидацией
 */
export const loadFromSession = <T>(key: string, defaultValue: T): T => {
  try {
    const item = sessionStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error loading from sessionStorage (key: ${key}):`, error);
    return defaultValue;
  }
};

/**
 * Удаляет данные из sessionStorage
 */
export const removeFromSession = (key: string): void => {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from sessionStorage (key: ${key}):`, error);
  }
};

/**
 * Очищает все данные для конкретного урока
 */
export const clearLessonData = (journalId: string, lessonId: string): void => {
  try {
    const prefix = `${SESSION_STORAGE_PREFIX}:journal_${journalId}:lesson_${lessonId}:`;
    const keys = Object.keys(sessionStorage);

    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing lesson data:', error);
  }
};

/**
 * Очищает все данные для конкретного журнала
 */
export const clearJournalData = (journalId: string): void => {
  try {
    const prefix = `${SESSION_STORAGE_PREFIX}:journal_${journalId}:`;
    const keys = Object.keys(sessionStorage);

    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing journal data:', error);
  }
};

/**
 * Очищает все данные приложения из sessionStorage
 */
export const clearAllAppData = (): void => {
  try {
    const keys = Object.keys(sessionStorage);

    keys.forEach(key => {
      if (key.startsWith(SESSION_STORAGE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing all app data:', error);
  }
};
