import type { SeatingDesk, Classroom } from '../types/classroom.types';
import type { Student } from '../types/student.types';

export const seatingService = {
  /**
   * Генерация случайной рассадки
   */
  generateRandomSeating(
    classroom: Classroom,
    students: Student[],
    attendance: Map<string, boolean>
  ): SeatingDesk[] {
    // 1. Фильтр присутствующих
    const presentStudents = students.filter(s => attendance.get(s.id) ?? true);

    // 2. Создать список всех парт (изначально пустых)
    const allDesks: SeatingDesk[] = [];
    classroom.desksPerColumn.forEach((count, columnIndex) => {
      for (let pos = 0; pos < count; pos++) {
        allDesks.push({ column: columnIndex, position: pos, studentIds: [] });
      }
    });

    // 3. Перемешать учеников (Fisher-Yates shuffle)
    const shuffled = [...presentStudents];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // 4. Распределить учеников по партам
    // Стратегия: сначала заполнить все парты по одному ученику (с первой парты),
    // затем, если ученики остались, рассадить вдвоем (снова с первой парты)

    let studentIndex = 0;
    const maxDesksPerRow = Math.max(...classroom.desksPerColumn);

    // Проход 1: Посадить по одному ученику на каждую парту (с первого ряда)
    for (let pos = 0; pos < maxDesksPerRow && studentIndex < shuffled.length; pos++) {
      for (let columnIndex = 0; columnIndex < classroom.columns && studentIndex < shuffled.length; columnIndex++) {
        if (pos < classroom.desksPerColumn[columnIndex]) {
          const desk = allDesks.find(d => d.column === columnIndex && d.position === pos);
          if (desk) {
            desk.studentIds.push(shuffled[studentIndex].id);
            studentIndex++;
          }
        }
      }
    }

    // Проход 2: Если остались ученики, посадить второго на парту (снова с первого ряда)
    if (studentIndex < shuffled.length) {
      for (let pos = 0; pos < maxDesksPerRow && studentIndex < shuffled.length; pos++) {
        for (let columnIndex = 0; columnIndex < classroom.columns && studentIndex < shuffled.length; columnIndex++) {
          if (pos < classroom.desksPerColumn[columnIndex]) {
            const desk = allDesks.find(d => d.column === columnIndex && d.position === pos);
            if (desk && desk.studentIds.length === 1) {
              desk.studentIds.push(shuffled[studentIndex].id);
              studentIndex++;
            }
          }
        }
      }
    }

    return allDesks;
  },
};
