import { useSessionState } from './useSessionState';
import { createStorageKey } from '../utils/sessionStorage';

/**
 * Специализированный хук для хранения состояния вкладок журнала
 * Автоматически создает уникальный ключ на основе journalId, lessonId и названия вкладки
 *
 * @param journalId - ID журнала
 * @param lessonId - ID урока
 * @param tabName - название вкладки ('randomizer', 'seating', 'groups')
 * @param defaultValue - значение по умолчанию
 * @param debounceMs - задержка перед сохранением (опционально)
 * @returns [state, setState] - кортеж состояния и функции для его изменения
 */
export const useTabState = <T>(
  journalId: string,
  lessonId: string,
  tabName: string,
  defaultValue: T,
  debounceMs?: number
): [T, (value: T | ((prev: T) => T)) => void] => {
  const key = createStorageKey(journalId, lessonId, tabName);
  return useSessionState(key, defaultValue, debounceMs);
};

/**
 * Типы для состояния вкладки Randomizer
 */
export interface RandomizerTabState {
  mode: 'one' | 'two';
  removeAfterPick: boolean;
  excludedStudents: string[]; // Массив ID исключенных студентов
  pickedStudents: string[];   // Массив ID уже выбранных студентов
  selectedStudents: string[]; // Массив ID текущих выбранных студентов
}

/**
 * Типы для состояния вкладки Seating
 */
export interface SeatingTabState {
  selectedClassroomId: string;
  seatingMode: 'single' | 'pairs'; // по одному или по двое
  desksMap: Record<string, Array<{
    column: number;
    position: number;
    studentIds: string[];
  }>>;
}

/**
 * Типы для состояния вкладки Groups
 */
export interface GroupsTabState {
  divisionMode: 'byGroups' | 'bySize';
  groupCount: number;
  groupSize: number;
  groups: Array<{
    id: number;
    name: string;
    studentIds: string[];
    points: number;
  }>;
  selectedInGroup: Record<number, string>; // Объект вместо Map для сериализации
}
