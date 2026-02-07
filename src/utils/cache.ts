interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.timestamp) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() > entry.timestamp) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Invalidate all keys matching a pattern
  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

export const cache = new SimpleCache();

// Cache key generators
export const cacheKeys = {
  student: (id: string) => `student:${id}`,
  students: (classId: string) => `students:class:${classId}`,
  studentsByIds: (ids: string[]) => `students:ids:${ids.sort().join(',')}`,
  journal: (id: string) => `journal:${id}`,
  journals: (classId: string) => `journals:class:${classId}`,
  class: (id: string) => `class:${id}`,
  attendance: (lessonId: string) => `attendance:${lessonId}`,
  grades: (lessonId: string) => `grades:${lessonId}`,
};
