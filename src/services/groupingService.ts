import type { Student } from '../types/student.types';
import type { StudentConflict } from '../types/conflict.types';
import { conflictService } from './conflictService';

export interface GroupResult {
  id: number;
  name: string;
  studentIds: string[];
}

/**
 * Fisher-Yates shuffle
 */
const shuffle = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Улучшенный алгоритм деления на группы с учетом конфликтов
 * Использует balanced greedy подход для равномерного распределения
 */
const divideIntoGroups = (
  studentsList: Student[],
  numGroups: number,
  conflictsList: StudentConflict[]
): GroupResult[] => {
  // Создаем пустые группы
  const resultGroups: GroupResult[] = Array.from({ length: numGroups }, (_, i) => ({
    id: i + 1,
    name: `Группа ${i + 1}`,
    studentIds: [],
  }));

  // Перемешиваем студентов для случайности
  const shuffledStudents = shuffle(studentsList);

  // Вспомогательная функция: проверка конфликта между студентом и группой
  const hasConflictWithGroup = (studentId: string, group: GroupResult): boolean => {
    return group.studentIds.some(existingStudentId =>
      conflictService.hasConflict(conflictsList, studentId, existingStudentId)
    );
  };

  // Вспомогательная функция: найти лучшую группу для студента
  const findBestGroup = (studentId: string): number => {
    // Фаза 1: Найти все группы без конфликтов
    const groupsWithoutConflicts: number[] = [];
    for (let i = 0; i < numGroups; i++) {
      if (!hasConflictWithGroup(studentId, resultGroups[i])) {
        groupsWithoutConflicts.push(i);
      }
    }

    // Если есть группы без конфликтов, выбрать самую маленькую
    if (groupsWithoutConflicts.length > 0) {
      return groupsWithoutConflicts.reduce((minIdx, idx) => {
        return resultGroups[idx].studentIds.length < resultGroups[minIdx].studentIds.length
          ? idx
          : minIdx;
      });
    }

    // Фаза 2: Все группы имеют конфликты - выбрать наименьшую группу
    // (это крайний случай, который должен быть редким)
    return resultGroups.reduce((minIdx, group, idx, arr) => {
      return group.studentIds.length < arr[minIdx].studentIds.length ? idx : minIdx;
    }, 0);
  };

  // Распределяем студентов по группам
  for (const student of shuffledStudents) {
    const bestGroupIndex = findBestGroup(student.id);
    resultGroups[bestGroupIndex].studentIds.push(student.id);
  }

  return resultGroups;
};

/**
 * Проверка на наличие неизбежных конфликтов в группах
 */
const hasUnavoidableConflicts = (
  groups: GroupResult[],
  conflicts: StudentConflict[]
): boolean => {
  for (const group of groups) {
    for (let i = 0; i < group.studentIds.length; i++) {
      for (let j = i + 1; j < group.studentIds.length; j++) {
        if (conflictService.hasConflict(conflicts, group.studentIds[i], group.studentIds[j])) {
          return true;
        }
      }
    }
  }
  return false;
};

export const groupingService = {
  /**
   * Деление на группы по количеству групп
   */
  divideByGroupCount(
    students: Student[],
    groupCount: number,
    conflicts: StudentConflict[] = []
  ): { groups: GroupResult[]; hasUnavoidableConflicts: boolean } {
    const numGroups = Math.min(groupCount, students.length);
    const groups = divideIntoGroups(students, numGroups, conflicts);
    return {
      groups,
      hasUnavoidableConflicts: hasUnavoidableConflicts(groups, conflicts),
    };
  },

  /**
   * Деление на группы по размеру группы
   */
  divideByGroupSize(
    students: Student[],
    groupSize: number,
    conflicts: StudentConflict[] = []
  ): { groups: GroupResult[]; hasUnavoidableConflicts: boolean } {
    const numGroups = Math.max(1, Math.ceil(students.length / groupSize));
    const groups = divideIntoGroups(students, numGroups, conflicts);
    return {
      groups,
      hasUnavoidableConflicts: hasUnavoidableConflicts(groups, conflicts),
    };
  },

  /**
   * Деление на пары (для рассадки)
   * Возвращает массив пар (каждая пара - массив из 1-2 studentId)
   */
  divideIntoPairs(
    students: Student[],
    conflicts: StudentConflict[] = []
  ): { pairs: string[][]; hasUnavoidableConflicts: boolean } {
    // Количество групп = количество пар = ceil(students / 2)
    const numPairs = Math.ceil(students.length / 2);
    const groups = divideIntoGroups(students, numPairs, conflicts);

    const pairs = groups.map(g => g.studentIds);
    return {
      pairs,
      hasUnavoidableConflicts: hasUnavoidableConflicts(groups, conflicts),
    };
  },

  /**
   * Перемешивание массива (экспортируется для внешнего использования)
   */
  shuffle,
};
