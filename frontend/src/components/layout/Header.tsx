import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Settings,
  LogOut,
  User as UserIcon,
  ChevronDown,
  FolderOpen,
  Package,
  SlidersHorizontal,
  ShieldCheck,
  Users,
  UserCheck,
} from 'lucide-react';
import logoImg from '../../assets/images/logo.png';
import { useAuthStore } from '../../stores/authStore';
import { userService } from '../../services/user.service';
import { Avatar } from '../ui';
import GlobalSearchBar from '../common/GlobalSearchBar';

export default function Header() {
  const { t } = useTranslation('common');
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      userService.getUnreadCount().then(setUnreadCount).catch(() => {});
    }
  }, [isAuthenticated]);

  // Close menu on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-surface)]/80">
      <nav className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-[var(--color-text)] hover:text-[var(--color-primary)] transition">
          <img src={logoImg} alt="SnowShelf" className="h-7 w-7" />
          SnowShelf
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              {/* Items link */}
              <Link
                to="/items"
                className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] transition"
              >
                <Package className="h-4 w-4" />
                {t('nav.collection', 'Collection')}
              </Link>

              {/* Categories link */}
              <Link
                to="/categories"
                className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] transition"
              >
                <FolderOpen className="h-4 w-4" />
                {t('nav.categories', 'Catégories')}
              </Link>

              {/* Explore link */}
              <Link
                to="/explore"
                className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] transition"
              >
                <Users className="h-4 w-4" />
                {t('nav.explore', 'Explorer')}
              </Link>

              {/* Friends link */}
              <Link
                to="/friends"
                className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] transition"
              >
                <UserCheck className="h-4 w-4" />
                {t('nav.friends', 'Amis')}
              </Link>

              {/* Manage link */}
              <div className="relative hidden sm:block group/manage">
                <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] transition">
                  <SlidersHorizontal className="h-4 w-4" />
                  {t('nav.manage', 'Gestion')}
                  <ChevronDown className="h-3 w-3" />
                </button>
                <div className="invisible opacity-0 group-hover/manage:visible group-hover/manage:opacity-100 transition-opacity duration-150 absolute left-0 top-full pt-1 w-48 z-50">
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg py-1">
                  <Link
                    to="/manage/statuses"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-hover)] transition"
                  >
                    {t('nav.statuses', 'Statuts')}
                  </Link>
                  <Link
                    to="/manage/grades"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-hover)] transition"
                  >
                    {t('nav.grades', 'Grades')}
                  </Link>
                  <Link
                    to="/manage/storage-locations"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-hover)] transition"
                  >
                    {t('nav.storageLocations', 'Emplacements')}
                  </Link>
                </div>
                </div>
              </div>

              {/* Global search bar */}
              <GlobalSearchBar className="hidden sm:block w-52 lg:w-64" />

              {/* Notifications bell */}
              <Link
                to="/notifications"
                className="relative rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] transition"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* User menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-hover)] transition"
                >
                  <Avatar
                    src={user.avatarUrl}
                    alt={user.username}
                    size="sm"
                  />
                  <span className="hidden sm:block font-medium">{user.username}</span>
                  <ChevronDown className="h-4 w-4 text-[var(--color-text-secondary)]" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-1 w-56 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-[var(--color-border)]">
                      <p className="text-sm font-medium text-[var(--color-text)]">{user.username}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{user.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-hover)] transition"
                    >
                      <UserIcon className="h-4 w-4" />
                      {t('nav.profile')}
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-hover)] transition"
                    >
                      <Settings className="h-4 w-4" />
                      {t('nav.settings')}
                    </Link>

                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-primary)] hover:bg-[var(--color-hover)] transition"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        {t('nav.admin', 'Administration')}
                      </Link>
                    )}

                    <div className="border-t border-[var(--color-border)] mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-[var(--color-hover)] transition"
                      >
                        <LogOut className="h-4 w-4" />
                        {t('nav.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)] transition"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition"
              >
                {t('nav.register')}
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
