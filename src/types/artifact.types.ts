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
