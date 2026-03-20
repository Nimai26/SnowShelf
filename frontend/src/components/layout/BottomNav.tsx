import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Package,
  FolderOpen,
  PlusCircle,
  User as UserIcon,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  /** Matcher function for active highlighting */
  isActive: (pathname: string) => boolean;
}

/**
 * Bottom tab navigation bar for mobile devices.
 * Hidden on sm+ (desktop shows Header nav instead).
 * Uses safe-area-inset-bottom for iPhone notch support.
 */
export default function BottomNav() {
  const { t } = useTranslation('common');
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  // Don't show on auth pages or when not authenticated
  if (!isAuthenticated) return null;

  const navItems: NavItem[] = [
    {
      path: '/',
      icon: <Home className="h-5 w-5" />,
      label: t('nav.home', 'Accueil'),
      isActive: (p) => p === '/',
    },
    {
      path: '/items',
      icon: <Package className="h-5 w-5" />,
      label: t('nav.collection', 'Collection'),
      isActive: (p) => p === '/items' || p.startsWith('/items/'),
    },
    {
      path: '/items/new',
      icon: <PlusCircle className="h-6 w-6" />,
      label: t('nav.add', 'Ajouter'),
      isActive: (p) => p === '/items/new',
    },
    {
      path: '/categories',
      icon: <FolderOpen className="h-5 w-5" />,
      label: t('nav.categories', 'Catégories'),
      isActive: (p) =>
        p === '/categories' || p.startsWith('/categories/'),
    },
    {
      path: '/profile',
      icon: <UserIcon className="h-5 w-5" />,
      label: t('nav.profile', 'Profil'),
      isActive: (p) =>
        p === '/profile' ||
        p === '/settings' ||
        p === '/notifications' ||
        p.startsWith('/manage/'),
    },
  ];

  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-surface)]/80 sm:hidden pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-around h-14" role="tablist">
        {navItems.map((item) => {
          const active = item.isActive(location.pathname);
          const isAddButton = item.path === '/items/new';

          return (
            <Link
              key={item.path}
              to={item.path}
              role="tab"
              aria-selected={active}
              aria-label={item.label}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[3.5rem] py-1 transition-colors ${
                isAddButton
                  ? 'text-[var(--color-primary)]'
                  : active
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-text-secondary)]'
              }`}
            >
              {isAddButton ? (
                <div className="flex items-center justify-center -mt-3 rounded-full bg-[var(--color-primary)] p-2 text-white shadow-lg">
                  {item.icon}
                </div>
              ) : (
                item.icon
              )}
              <span
                className={`text-[10px] leading-tight ${
                  isAddButton ? '-mt-0.5' : ''
                } ${active ? 'font-semibold' : 'font-medium'}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
