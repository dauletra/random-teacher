import type { Timestamp } from 'firebase/firestore';

export interface Tag {
  id: string;
  label: string;
  order: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ArtifactGroup {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  tags: string[]; // tag IDs
  thumbnail?: string;
  order: number;
  isPublic: boolean;
  // Marketplace fields (optional — normalizeArtifactGroup fills defaults for old docs)
  authorId?: string;
  authorName?: string;
  authorPhotoURL?: string;
  isFeatured?: boolean;
  viewCount?: number;
  // Physics showcase fields
  grade?: number[];    // e.g. [7, 8, 9]
  modeId?: string;     // ID from modes collection
  topicId?: string;    // ID from topics collection
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Mode {
  id: string;
  label: string;
  icon: string;
  color: string;    // Tailwind class e.g. "bg-green-100 text-green-700"
  order: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Topic {
  id: string;
  label: string;
  order: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Artifact {
  id: string;
  groupId: string;
  variantLabel: string;
  embedUrl: string;
  description?: string;
  order: number;
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
