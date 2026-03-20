import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Library,
  Search,
  BarChart3,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import logoImg from '../../assets/images/logo.png';
import { useAuthStore } from '../../stores/authStore';
import { Card, CardContent, Button, Badge } from '../../components/ui';
import { FadeIn, StaggerContainer, StaggerItem } from '../../components/ui/Animations';

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore();

  // Dashboard for authenticated users
  if (isAuthenticated && user) {
    return <Dashboard user={user} />;
  }

  // Landing page for guests
  return <LandingPage />;
}

function LandingPage() {
  const { t } = useTranslation('common');

  return (
    <div className="mx-auto max-w-4xl space-y-16 py-12 text-center">
      <FadeIn direction="up">
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-3">
          <img src={logoImg} alt="SnowShelf" className="h-14 w-14" />
          <h1 className="text-5xl font-extrabold tracking-tight text-[var(--color-text)]">
            SnowShelf
          </h1>
        </div>
        <p className="mx-auto max-w-xl text-lg text-[var(--color-text-secondary)]">
          {t('landing.subtitle', 'Votre application de gestion de collections. Organisez, recherchez et suivez vos articles facilement.')}
        </p>
        <div className="flex items-center justify-center gap-3 pt-4">
          <Link to="/register">
            <Button>
              <Sparkles className="mr-2 h-4 w-4" />
              {t('landing.getStarted', 'Commencer gratuitement')}
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary">
              {t('nav.login')}
            </Button>
          </Link>
        </div>
      </div>
      </FadeIn>

      <StaggerContainer className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          { icon: Library, title: t('landing.feature1Title', 'Collections'), desc: t('landing.feature1Desc', 'Organisez vos articles par collections et catégories') },
          { icon: Search, title: t('landing.feature2Title', 'Recherche'), desc: t('landing.feature2Desc', 'Recherchez des articles via Tako API (32 providers)') },
          { icon: BarChart3, title: t('landing.feature3Title', 'Statistiques'), desc: t('landing.feature3Desc', 'Visualisez vos statistiques de collection') },
        ].map(({ icon: Icon, title, desc }) => (
          <StaggerItem key={title}>
          <Card className="text-left">
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
                <Icon className="h-5 w-5 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text)]">{title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">{desc}</p>
            </CardContent>
          </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}

function Dashboard({ user }: { user: any }) {
  const { t } = useTranslation('common');

  const stats = [
    { label: t('stats.items', 'Articles'), value: user.itemsCount ?? 0, icon: Library },
    { label: t('stats.categories', 'Catégories'), value: user.categoriesCount ?? 0, icon: BarChart3 },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <FadeIn direction="up">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            {t('dashboard.welcome', 'Bonjour')}, {user.username} 👋
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            {t('dashboard.subtitle', "Voici un aperçu de votre collection")}
          </p>
        </div>
      </FadeIn>

      {/* Stats cards */}
      <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <StaggerItem key={label}>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
                <Icon className="h-6 w-6 text-[var(--color-primary)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-text)]">{value}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
              </div>
            </CardContent>
          </Card>
          </StaggerItem>
        ))}

        {/* Premium card if free */}
        {user.role === 'free' && (
          <StaggerItem>
          <Card className="border-[var(--color-accent)]">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)]/10">
                <Sparkles className="h-6 w-6 text-[var(--color-accent)]" />
              </div>
              <div>
                <p className="font-semibold text-[var(--color-text)]">
                  <Badge variant="premium">{t('roles.premium', 'Premium')}</Badge>
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {t('dashboard.upgradePremium', 'Débloquez plus de fonctionnalités')}
                </p>
              </div>
            </CardContent>
          </Card>
          </StaggerItem>
        )}
      </StaggerContainer>

      {/* Quick actions */}
      <FadeIn direction="up" delay={0.2}>
      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-text)]">
            {t('dashboard.quickActions', 'Actions rapides')}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link to="/items">
              <Button variant="secondary" className="w-full justify-between">
                {t('dashboard.myCollection', 'Ma collection')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/items/new">
              <Button variant="secondary" className="w-full justify-between">
                {t('dashboard.addItem', 'Ajouter un item')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/categories">
              <Button variant="secondary" className="w-full justify-between">
                {t('dashboard.myCategories', 'Mes catégories')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/categories/new">
              <Button variant="secondary" className="w-full justify-between">
                {t('dashboard.addCategory', 'Créer une catégorie')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="secondary" className="w-full justify-between">
                {t('nav.settings')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/explore">
              <Button variant="secondary" className="w-full justify-between">
                {t('dashboard.explore', 'Explorer les collections')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      </FadeIn>
    </div>
  );
}
