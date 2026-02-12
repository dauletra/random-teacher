import type { ArtifactGroup } from '../types/artifact.types';

export function normalizeArtifactGroup(raw: Record<string, any>): ArtifactGroup {
  return {
    ...raw,
    authorId: raw.authorId ?? 'admin',
    authorName: raw.authorName ?? 'Admin',
    authorPhotoURL: raw.authorPhotoURL ?? undefined,
    isFeatured: raw.isFeatured ?? true,
    viewCount: raw.viewCount ?? 0,
  } as ArtifactGroup;
}
