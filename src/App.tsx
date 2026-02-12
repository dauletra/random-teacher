import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/admin/AdminRoute';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { ShowcasePage } from './pages/ShowcasePage';
import { DashboardPage } from './pages/DashboardPage';
import { ClassesPage } from './pages/ClassesPage';
import { ClassSettingsPage } from './pages/ClassSettingsPage';
import { JournalPage } from './pages/JournalPage';
import { ArtifactsListPage } from './pages/admin/ArtifactsListPage';
import { ArtifactEditPage } from './pages/admin/ArtifactEditPage';
import { SubjectsPage } from './pages/admin/SubjectsPage';
import { TagsPage } from './pages/admin/TagsPage';
import { MyArtifactsPage } from './pages/MyArtifactsPage';
import { MyArtifactEditPage } from './pages/MyArtifactEditPage';
import { ArtifactDetailPage } from './pages/ArtifactDetailPage';
import { ArtifactEmbedPage } from './pages/ArtifactEmbedPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#363636',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<ShowcasePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/artifacts/:id" element={<ArtifactDetailPage />} />
          <Route path="/artifacts/:id/embed" element={<ArtifactEmbedPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClassesPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes/:classId/settings"
            element={
              <ProtectedRoute>
                <Layout headerVariant="back" mobileTitle="Настройки">
                  <ClassSettingsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/journals/:journalId"
            element={
              <ProtectedRoute>
                <Layout fullWidth headerVariant="hidden-mobile">
                  <JournalPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* My Artifacts routes */}
          <Route
            path="/my-artifacts"
            element={
              <ProtectedRoute>
                <Layout>
                  <MyArtifactsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-artifacts/new"
            element={
              <ProtectedRoute>
                <Layout headerVariant="back" mobileTitle="Жаңа артефакт">
                  <MyArtifactEditPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-artifacts/:id"
            element={
              <ProtectedRoute>
                <Layout headerVariant="back" mobileTitle="Артефакт">
                  <MyArtifactEditPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <ArtifactsListPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/artifacts/:id"
            element={
              <AdminRoute>
                <ArtifactEditPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/subjects"
            element={
              <AdminRoute>
                <SubjectsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/tags"
            element={
              <AdminRoute>
                <TagsPage />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
