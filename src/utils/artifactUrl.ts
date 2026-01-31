/**
 * Утилиты для работы с URL Claude артефактов
 *
 * Форматы URL:
 * - https://claude.ai/public/artifacts/{id}
 * - https://claude.site/public/artifacts/{id}
 * - https://claude.site/public/artifacts/{id}/embed
 */

/**
 * Извлекает ID артефакта из любого формата URL
 */
export const extractArtifactId = (url: string): string | null => {
  // Паттерн для извлечения ID из URL
  // Поддерживает: claude.ai, claude.site, с /embed и без
  const patterns = [
    /claude\.(?:ai|site)\/public\/artifacts\/([a-f0-9-]+)/i,
    /claude\.(?:ai|site)\/artifacts\/([a-f0-9-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Генерирует URL для iframe (embed)
 */
export const getEmbedUrl = (artifactIdOrUrl: string): string => {
  const id = extractArtifactId(artifactIdOrUrl) || artifactIdOrUrl;
  return `https://claude.site/public/artifacts/${id}/embed`;
};

/**
 * Генерирует URL для открытия в браузере
 */
export const getViewUrl = (artifactIdOrUrl: string): string => {
  const id = extractArtifactId(artifactIdOrUrl) || artifactIdOrUrl;
  return `https://claude.ai/public/artifacts/${id}`;
};

/**
 * Нормализует URL для хранения (извлекает только ID)
 */
export const normalizeArtifactUrl = (url: string): string => {
  const id = extractArtifactId(url);
  if (id) {
    return id;
  }
  // Если не удалось извлечь ID, возвращаем как есть
  return url;
};

/**
 * Проверяет, является ли строка валидным URL артефакта
 */
export const isValidArtifactUrl = (url: string): boolean => {
  return extractArtifactId(url) !== null;
};
