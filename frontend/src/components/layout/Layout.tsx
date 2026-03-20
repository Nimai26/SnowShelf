import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import BottomNav from './BottomNav';
import OfflineBanner from '../common/OfflineBanner';
import InstallPrompt from '../common/InstallPrompt';
import PWAUpdatePrompt from '../common/PWAUpdatePrompt';
import { LoadingPage } from '../ui';
import { PageTransition } from '../ui/PageTransition';
import OnboardingTutorial from '../common/OnboardingTutorial';
import { useAuthStore } from '../../stores/authStore';

export default function Layout() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)] text-[var(--color-text)]">
      <a href="#main-content" className="skip-to-content">
        Aller au contenu principal
      </a>
      <OfflineBanner />
      <Header />
      {/* pb-16 on mobile to account for BottomNav height */}
      <main id="main-content" role="main" className="flex-1 container mx-auto px-4 py-6 pb-20 sm:pb-6">
        <Suspense fallback={<LoadingPage />}>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </Suspense>
      </main>
      <Footer />
      <BottomNav />
      <InstallPrompt />
      <PWAUpdatePrompt />
      {isAuthenticated && <OnboardingTutorial />}
    </div>
  );
}
