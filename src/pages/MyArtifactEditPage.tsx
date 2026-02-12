import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArtifactEditForm } from '../components/showcase/ArtifactEditForm';

export const MyArtifactEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  return (
    <ArtifactEditForm
      mode="user"
      initialGroupId={id}
      onSaveRedirect="/my-artifacts"
      authorId={user!.uid}
      authorName={user!.displayName || 'User'}
      authorPhotoURL={user!.photoURL || undefined}
    />
  );
};
