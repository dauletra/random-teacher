import { useParams } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { ArtifactEditForm } from '../../components/showcase/ArtifactEditForm';
import { useAuth } from '../../hooks/useAuth';

export const ArtifactEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  return (
    <AdminLayout>
      <ArtifactEditForm
        mode="admin"
        initialGroupId={id}
        onSaveRedirect="/admin"
        authorId={user?.uid || 'admin'}
        authorName={user?.displayName || 'Admin'}
        authorPhotoURL={user?.photoURL || undefined}
      />
    </AdminLayout>
  );
};
