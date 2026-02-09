import type { SeatingDesk, Classroom } from '../types/classroom.types';
import type { Student } from '../types/student.types';
import type { StudentConflict } from '../types/conflict.types';
import { groupingService } from './groupingService';

export type SeatingMode = 'single' | 'pairs';

export const seatingService = {
  /**
   * Генерация случайной рассадки
   * @param mode - 'single' (по одному) или 'pairs' (по двое)
   * @param conflicts - список конфликтов (для режима pairs)
   */
  generateRandomSeating(
    classroom: Classroom,
    students: Student[],
    attendance: Map<string, boolean>,
    mode: SeatingMode = 'pairs',
    conflicts: StudentConflict[] = []
  ): { desks: SeatingDesk[]; hasUnavoidableConflicts: boolean } {
    // 1. Фильтр присутствующих
    const presentStudents = students.filter(s => attendance.get(s.id) ?? true);

    // 2. Создать список всех парт (изначально пустых)
    const allDesks: SeatingDesk[] = [];
    classroom.desksPerColumn.forEach((count, columnIndex) => {
      for (let pos = 0; pos < count; pos++) {
        allDesks.push({ column: columnIndex, position: pos, studentIds: [] });
      }
    });

    const maxDesksPerRow = Math.max(...classroom.desksPerColumn);
    let hasUnavoidableConflicts = false;

    if (mode === 'single') {
      // Режим "по одному": по одному ученику на парту, при нехватке мест — первые парты по двое
      const shuffled = groupingService.shuffle(presentStudents);
      const totalDesks = allDesks.length;
      const overflow = Math.max(0, shuffled.length - totalDesks);

      // Упорядоченный список парт: ряд за рядом (передние первые)
      const orderedDesks: SeatingDesk[] = [];
      for (let pos = 0; pos < maxDesksPerRow; pos++) {
        for (let columnIndex = 0; columnIndex < classroom.columns; columnIndex++) {
          if (pos < classroom.desksPerColumn[columnIndex]) {
            const desk = allDesks.find(d => d.column === columnIndex && d.position === pos);
            if (desk) orderedDesks.push(desk);
          }
        }
      }

      let studentIndex = 0;
      for (let deskIdx = 0; deskIdx < orderedDesks.length && studentIndex < shuffled.length; deskIdx++) {
        orderedDesks[deskIdx].studentIds.push(shuffled[studentIndex].id);
        studentIndex++;
        // Если парта в зоне overflow — подсаживаем второго
        if (deskIdx < overflow && studentIndex < shuffled.length) {
          orderedDesks[deskIdx].studentIds.push(shuffled[studentIndex].id);
          studentIndex++;
        }
      }
    } else {
      // Режим "по двое": используем groupingService для формирования пар с учетом конфликтов
      const pairsResult = groupingService.divideIntoPairs(presentStudents, conflicts);
      hasUnavoidableConflicts = pairsResult.hasUnavoidableConflicts;

      // Перемешиваем пары для случайной рассадки по партам
      const shuffledPairs = groupingService.shuffle(pairsResult.pairs);

      // Рассаживаем пары по партам
      let pairIndex = 0;
      for (let pos = 0; pos < maxDesksPerRow && pairIndex < shuffledPairs.length; pos++) {
        for (let columnIndex = 0; columnIndex < classroom.columns && pairIndex < shuffledPairs.length; columnIndex++) {
          if (pos < classroom.desksPerColumn[columnIndex]) {
            const desk = allDesks.find(d => d.column === columnIndex && d.position === pos);
            if (desk) {
              desk.studentIds = [...shuffledPairs[pairIndex]];
              pairIndex++;
            }
          }
        }
      }
    }

    return { desks: allDesks, hasUnavoidableConflicts };
  },
};
