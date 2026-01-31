import type { Timestamp } from 'firebase/firestore';

export type ArtifactTag =
  | 'multiplayer'
  | 'solo'
  | 'game'
  | 'test'
  | 'rating'
  | 'timer'
  | 'learning'
  | 'theory';

export interface Artifact {
  id: string;
  title: string;
  description: string;
  embedUrl: string;
  subjectId: string;
  tags: ArtifactTag[];
  thumbnail?: string;
  order: number;
  isPublic: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  order: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const TAG_LABELS: Record<ArtifactTag, string> = {
  multiplayer: 'Мультиплеер',
  solo: 'Одиночный',
  game: 'Игра',
  test: 'Тест',
  rating: 'Рейтинг',
  timer: 'Таймер',
  learning: 'Обучение',
  theory: 'Теория',
};
