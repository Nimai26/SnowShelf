import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Globe,
  Clock,
  RotateCcw,
  Power,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { adminService } from '../../services/admin.service';
import type { TakoApiConfig } from '../../types/admin.types';
import toast from 'react-hot-toast';

export default function AdminTakoConfigPage() {
  const { t } = useTranslation('admin');

  const [config, setConfig] = useState<TakoApiConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);

  // Form state
  const [apiUrl, setApiUrl] = useState('');
  const [timeout, setTimeout_] = useState(30000);
  const [cacheTtl, setCacheTtl] = useState(3600);
  const [maxRetries, setMaxRetries] = useState(3);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await adminService.getTakoConfig();
      setConfig(data);
      setApiUrl(data.apiUrl);
      setTimeout_(data.timeout);
      setCacheTtl(data.cacheTtl);
      setMaxRetries(data.maxRetries);
      setIsActive(data.isActive);
    } catch (e) {
      toast.error(t('takoConfig.loadError', 'Erreur de chargement'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const data = await adminService.updateTakoConfig({
        apiUrl: apiUrl.trim(),
        timeout: timeout,
        cacheTtl: cacheTtl,
        maxRetries: maxRetries,
        isActive: isActive,
      });
      setConfig(data);
      toast.success(t('takoConfig.saved', 'Configuration sauvegardée'));
    } catch (e) {
      toast.error(t('takoConfig.saveError', 'Erreur de sauvegarde'));
    } finally {
      setSaving(false);
    }
  };

  const handleHealthCheck = async () => {
    try {
      setChecking(true);
      const result = await adminService.triggerTakoHealthCheck();
      // Reload config to get updated health status
      await loadConfig();
      if (result.status === 'ok') {
        toast.success(
          t('takoConfig.healthOk', 'Tako API accessible — v{{version}}', {
            version: result.version || '?',
          }),
        );
      } else {
        toast.error(t('takoConfig.healthDown', 'Tako API inaccessible'));
      }
    } catch (e) {
      toast.error(t('takoConfig.healthDown', 'Tako API inaccessible'));
      await loadConfig();
    } finally {
      setChecking(false);
    }
  };

  const healthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const healthBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="success">{t('takoConfig.statusHealthy', 'En ligne')}</Badge>;
      case 'degraded':
        return <Badge variant="warning">{t('takoConfig.statusDegraded', 'Dégradé')}</Badge>;
      default:
        return <Badge variant="danger">{t('takoConfig.statusDown', 'Hors ligne')}</Badge>;
    }
  };

  const hasChanges =
    config &&
    (apiUrl !== config.apiUrl ||
      timeout !== config.timeout ||
      cacheTtl !== config.cacheTtl ||
      maxRetries !== config.maxRetries ||
      isActive !== config.isActive);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-48 bg-muted rounded" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {t('takoConfig.title', 'Configuration Tako API')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('takoConfig.subtitle', 'Paramètres de connexion à l\'API de recherche externe')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleHealthCheck}
            disabled={checking}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${checking ? 'animate-spin' : ''}`} />
            {t('takoConfig.healthCheck', 'Tester')}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            <Save className="w-4 h-4 mr-1" />
            {saving
              ? t('takoConfig.saving', 'Enregistrement…')
              : t('takoConfig.save', 'Enregistrer')}
          </Button>
        </div>
      </div>

      {/* Status Card */}
      {config && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4" />
              {t('takoConfig.statusTitle', 'État actuel')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {t('takoConfig.status', 'Statut')}
                </p>
                <div className="flex items-center gap-2">
                  {healthIcon(config.healthStatus)}
                  {healthBadge(config.healthStatus)}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {t('takoConfig.service', 'Service')}
                </p>
                <p className="text-sm font-medium">
                  {isActive ? (
                    <span className="text-green-600">
                      {t('takoConfig.enabled', 'Activé')}
                    </span>
                  ) : (
                    <span className="text-red-500">
                      {t('takoConfig.disabled', 'Désactivé')}
                    </span>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {t('takoConfig.currentUrl', 'URL configurée')}
                </p>
                <p className="text-sm font-mono truncate" title={config.apiUrl}>
                  {config.apiUrl}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {t('takoConfig.lastCheck', 'Dernier check')}
                </p>
                <p className="text-sm">
                  {config.lastHealthCheck
                    ? new Date(config.lastHealthCheck).toLocaleString('fr-FR')
                    : t('takoConfig.never', 'Jamais')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4" />
            {t('takoConfig.connectionTitle', 'Connexion')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API URL */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t('takoConfig.apiUrl', 'URL de l\'API Tako')}
            </label>
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://tako.example.com"
              className="w-full px-3 py-2 border rounded-md bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground">
              {t('takoConfig.apiUrlHint', 'Adresse complète de l\'instance Tako API de production')}
            </p>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Power className="w-4 h-4" />
                {t('takoConfig.activeLabel', 'Service actif')}
              </label>
              <p className="text-xs text-muted-foreground">
                {t('takoConfig.activeHint', 'Désactiver pour couper la recherche web')}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {t('takoConfig.advancedTitle', 'Paramètres avancés')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Timeout */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t('takoConfig.timeout', 'Timeout (ms)')}
              </label>
              <input
                type="number"
                value={timeout}
                onChange={(e) => setTimeout_(Number(e.target.value))}
                min={5000}
                max={120000}
                step={1000}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Cache TTL */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t('takoConfig.cacheTtlLabel', 'Cache TTL (s)')}
              </label>
              <input
                type="number"
                value={cacheTtl}
                onChange={(e) => setCacheTtl(Number(e.target.value))}
                min={0}
                max={86400}
                step={60}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Max Retries */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5" />
                {t('takoConfig.maxRetries', 'Tentatives max')}
              </label>
              <input
                type="number"
                value={maxRetries}
                onChange={(e) => setMaxRetries(Number(e.target.value))}
                min={0}
                max={10}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unsaved changes indicator */}
      {hasChanges && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg text-sm flex items-center gap-2 z-50">
          <AlertTriangle className="w-4 h-4" />
          {t('takoConfig.unsaved', 'Modifications non sauvegardées')}
          <Button size="sm" variant="secondary" onClick={handleSave} disabled={saving}>
            <Save className="w-3 h-3 mr-1" />
            {t('takoConfig.save', 'Enregistrer')}
          </Button>
        </div>
      )}
    </div>
  );
}
