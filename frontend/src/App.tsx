import { useEffect, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useAuthStore } from './stores/authStore';

// Lazy-loaded pages (code splitting)
const HomePage = lazy(() => import('./pages/home/HomePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/profile/SettingsPage'));
const NotificationsPage = lazy(() => import('./pages/profile/NotificationsPage'));
const CategoriesPage = lazy(() => import('./pages/categories/CategoriesPage'));
const CategoryFormPage = lazy(() => import('./pages/categories/CategoryFormPage'));
const CategoryDetailPage = lazy(() => import('./pages/categories/CategoryDetailPage'));
const ItemsPage = lazy(() => import('./pages/items/ItemsPage'));
const ItemFormPage = lazy(() => import('./pages/items/ItemFormPage'));
const ItemDetailPage = lazy(() => import('./pages/items/ItemDetailPage'));
const SearchResultsPage = lazy(() => import('./pages/search/SearchResultsPage'));
const StatusesPage = lazy(() => import('./pages/manage/StatusesPage'));
const GradesPage = lazy(() => import('./pages/manage/GradesPage'));
const StorageLocationsPage = lazy(() => import('./pages/manage/StorageLocationsPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminFieldsPage = lazy(() => import('./pages/admin/AdminFieldsPage'));
const AdminPlatformsPage = lazy(() => import('./pages/admin/AdminPlatformsPage'));
const AdminTypesDomainsPage = lazy(() => import('./pages/admin/AdminTypesDomainsPage'));
const AdminTakoConfigPage = lazy(() => import('./pages/admin/AdminTakoConfigPage'));
const ExplorePage = lazy(() => import('./pages/explore/ExplorePage'));
const PublicProfilePage = lazy(() => import('./pages/explore/PublicProfilePage'));
const PublicItemDetailPage = lazy(() => import('./pages/explore/PublicItemDetailPage'));
const FriendsPage = lazy(() => import('./pages/friends/FriendsPage'));
const DownloadPage = lazy(() => import('./pages/download/DownloadPage'));

function App() {
  const { isInitializing, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  // Tant que l'auth n'est pas initialisée, afficher un écran de chargement
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-background)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Pages publiques */}
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="verify-email" element={<VerifyEmailPage />} />
            <Route path="download" element={<DownloadPage />} />

            {/* Pages protégées */}
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="categories"
              element={
                <ProtectedRoute>
                  <CategoriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="categories/new"
              element={
                <ProtectedRoute>
                  <CategoryFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="categories/:id"
              element={
                <ProtectedRoute>
                  <CategoryDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="categories/:id/edit"
              element={
                <ProtectedRoute>
                  <CategoryFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="items"
              element={
                <ProtectedRoute>
                  <ItemsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="search"
              element={
                <ProtectedRoute>
                  <SearchResultsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="explore"
              element={
                <ProtectedRoute>
                  <ExplorePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="u/:username"
              element={
                <ProtectedRoute>
                  <PublicProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="u/:username/items/:itemId"
              element={
                <ProtectedRoute>
                  <PublicItemDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="friends"
              element={
                <ProtectedRoute>
                  <FriendsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="items/new"
              element={
                <ProtectedRoute>
                  <ItemFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="items/:id"
              element={
                <ProtectedRoute>
                  <ItemDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="items/:id/edit"
              element={
                <ProtectedRoute>
                  <ItemFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="manage/statuses"
              element={
                <ProtectedRoute>
                  <StatusesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="manage/grades"
              element={
                <ProtectedRoute>
                  <GradesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="manage/storage-locations"
              element={
                <ProtectedRoute>
                  <StorageLocationsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin pages */}
            <Route
              path="admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/users"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/fields"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminFieldsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/platforms"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminPlatformsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/types-domains"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminTypesDomainsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/tako-config"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminTakoConfigPage />
                </ProtectedRoute>
              }
            />

            {/* Redirection par défaut */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
