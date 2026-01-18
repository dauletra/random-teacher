import type { Timestamp } from 'firebase/firestore';

export interface Classroom {
  id: string;
  teacherId: string;        // ID учителя (владелец)
  name: string;             // "Кабинет 101", "Физика", "Математика" и т.д.
  columns: number;          // Количество колонок (например, 4)
  desksPerColumn: number[]; // Количество парт в каждой колонке [4, 4, 4, 4]
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface SeatingDesk {
  column: number;              // Номер колонки (0-based)
  position: number;            // Позиция в колонке (0-based, сверху вниз)
  studentIds: string[];        // Массив ID учеников (максимум 2 на парту)
}

export interface SeatingArrangement {
  id: string;
  journalId: string;        // Связь с журналом
  teacherId: string;        // ID учителя (владелец) - КРИТИЧНО для безопасности!
  classroomId: string;      // Связь с кабинетом
  desks: SeatingDesk[];     // Расстановка учеников
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
