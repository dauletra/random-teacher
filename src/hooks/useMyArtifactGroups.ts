import { useAuth } from './useAuth';
import { useArtifactGroups } from './useArtifactGroups';

export const useMyArtifactGroups = () => {
  const { user } = useAuth();
  return useArtifactGroups({ authorId: user?.uid });
};
