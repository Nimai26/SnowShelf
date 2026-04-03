import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Send,
  Bell,
  Eye,
  FileText,
  Mail,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/admin.service';
import type { Newsletter, NewsletterAudience } from '../../types/admin.types';
import { Button, Card, CardContent, CardHeader, CardTitle, Spinner, Badge } from '../../components/ui';

type View = 'list' | 'edit';

const AUDIENCE_LABELS: Record<string, string> = {
  all: 'Tous les utilisateurs',
  free: 'Utilisateurs Free',
  premium: 'Utilisateurs Premium',
  admin: 'Administrateurs',
};

function PublishDialog({
  targetAudience,
  publishing,
  onPublish,
  onClose,
}: {
  targetAudience: NewsletterAudience;
  publishing: boolean;
  onPublish: (notif: boolean, email: boolean) => void;
  onClose: () => void;
}) {
  const [sendNotif, setSendNotif] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3">
              <Send className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--color-text)]">
                Publier cette newsletter ?
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Cible : <strong>{AUDIENCE_LABELS[targetAudience]}</strong>
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] cursor-pointer hover:border-[var(--color-primary)] transition">
              <input
                type="checkbox"
                checked={sendNotif}
                onChange={(e) => setSendNotif(e.target.checked)}
                className="h-4 w-4 rounded accent-[var(--color-primary)]"
              />
              <Bell className="h-4 w-4 text-[var(--color-text-secondary)]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--color-text)]">Notification in-app + push</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Envoyer une notification à {targetAudience === 'all' ? 'tous les utilisateurs' : `les utilisateurs ${targetAudience}`}
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] cursor-pointer hover:border-[var(--color-primary)] transition">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="h-4 w-4 rounded accent-[var(--color-primary)]"
              />
              <Mail className="h-4 w-4 text-[var(--color-text-secondary)]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--color-text)]">Envoyer par email</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Uniquement aux abonnés newsletter de l'audience cible
                </p>
              </div>
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => onPublish(sendNotif, sendEmail)}
              disabled={publishing}
            >
              <Send className="mr-2 h-4 w-4" />
              {publishing ? '...' : 'Publier'}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={onClose}
              disabled={publishing}
            >
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminNewsletterPage() {
  const { t } = useTranslation('admin');

  const [view, setView] = useState<View>('list');
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editId, setEditId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<NewsletterAudience>('all');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  useEffect(() => {
    loadNewsletters();
  }, []);

  async function loadNewsletters() {
    try {
      setLoading(true);
      const res = await adminService.getNewsletters(1, 50);
      setNewsletters(res.newsletters);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  function startCreate() {
    setEditId(null);
    setTitle('');
    setContent('');
    setTargetAudience('all');
    setView('edit');
  }

  async function startEdit(id: number) {
    try {
      const nl = await adminService.getNewsletter(id);
      setEditId(nl.id);
      setTitle(nl.title);
      setContent(nl.content);
      setTargetAudience(nl.targetAudience || 'all');
      setView('edit');
    } catch {
      toast.error('Erreur de chargement');
    }
  }

  async function handleSave() {
    if (!title.trim() || !content.trim()) {
      toast.error('Titre et contenu requis');
      return;
    }
    try {
      setSaving(true);
      if (editId) {
        await adminService.updateNewsletter(editId, title, content, targetAudience);
        toast.success('Newsletter mise à jour');
      } else {
        const res = await adminService.createNewsletter(title, content, targetAudience);
        setEditId(res.id);
        toast.success('Newsletter créée');
      }
      await loadNewsletters();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Supprimer cette newsletter ?')) return;
    try {
      await adminService.deleteNewsletter(id);
      toast.success('Newsletter supprimée');
      setNewsletters((prev) => prev.filter((n) => n.id !== id));
      if (editId === id) {
        setView('list');
      }
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  }

  async function handlePublish(sendNotif: boolean, sendEmail: boolean) {
    if (!editId) return;
    try {
      setPublishing(true);
      // Save first
      await adminService.updateNewsletter(editId, title, content, targetAudience);
      const res = await adminService.publishNewsletter(editId, sendNotif, sendEmail);
      const parts: string[] = [];
      if (sendNotif) parts.push(`notification envoyée à ${res.notifCount} utilisateur(s)`);
      if (sendEmail) parts.push(`email envoyé à ${res.emailCount} abonné(s)`);
      toast.success(
        parts.length > 0
          ? `Newsletter publiée — ${parts.join(', ')}`
          : 'Newsletter publiée',
      );
      setShowPublishConfirm(false);
      setView('list');
      await loadNewsletters();
    } catch {
      toast.error('Erreur lors de la publication');
    } finally {
      setPublishing(false);
    }
  }

  // ── List view ──
  if (view === 'list') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin">
              <button className="rounded-full p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] hover:text-[var(--color-text)] transition">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">
              {t('newsletter.title', 'Newsletters')}
            </h1>
          </div>
          <Button variant="primary" onClick={startCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('newsletter.create', 'Nouvelle newsletter')}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : newsletters.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-[var(--color-text-secondary)] mb-3" />
              <p className="text-[var(--color-text-secondary)]">
                {t('newsletter.empty', 'Aucune newsletter. Créez la première !')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {newsletters.map((nl) => (
              <Card key={nl.id} className="hover:border-[var(--color-primary)] transition">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-[var(--color-text)] truncate">{nl.title}</h3>
                        <Badge variant={nl.status === 'published' ? 'default' : 'secondary'}>
                          {nl.status === 'published' ? '✅ Publiée' : '📝 Brouillon'}
                        </Badge>
                        {nl.notificationSent && (
                          <Badge variant="default">
                            <Bell className="h-3 w-3 mr-1" />
                            Notifié
                          </Badge>
                        )}
                        {nl.emailSent && (
                          <Badge variant="default">
                            <Mail className="h-3 w-3 mr-1" />
                            Emailé
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
                        {nl.content.substring(0, 150)}{nl.content.length > 150 && '…'}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-[var(--color-text-secondary)]">
                        {nl.author && <span>Par {nl.author.username}</span>}
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {nl.targetAudience === 'all' ? 'Tous' : nl.targetAudience === 'free' ? 'Free' : nl.targetAudience === 'premium' ? 'Premium' : 'Admin'}
                        </span>
                        <span>
                          {nl.publishedAt
                            ? `Publiée le ${new Date(nl.publishedAt).toLocaleDateString('fr-FR')}`
                            : `Créée le ${new Date(nl.createdAt).toLocaleDateString('fr-FR')}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(nl.id)}
                        className="rounded p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] hover:text-[var(--color-text)] transition"
                        title="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {nl.status === 'draft' && (
                        <button
                          onClick={() => handleDelete(nl.id)}
                          className="rounded p-2 text-[var(--color-text-secondary)] hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 transition"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Edit view ──
  const isPublished = newsletters.find((n) => n.id === editId)?.status === 'published';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('list')}
            className="rounded-full p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] hover:text-[var(--color-text)] transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-[var(--color-text)]">
            {editId ? t('newsletter.edit', 'Modifier la newsletter') : t('newsletter.new', 'Nouvelle newsletter')}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setView('list')}>
            {t('common:cancel', 'Annuler')}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? '...' : t('newsletter.save', 'Enregistrer')}
          </Button>
          {editId && !isPublished && (
            <Button variant="primary" size="sm" onClick={() => setShowPublishConfirm(true)}>
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {t('newsletter.publish', 'Publier')}
            </Button>
          )}
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
              {t('newsletter.titleLabel', 'Titre')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('newsletter.titlePlaceholder', 'Titre de la newsletter')}
              className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
              Audience cible
            </label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: 'all', label: 'Tous les utilisateurs' },
                { value: 'free', label: 'Free' },
                { value: 'premium', label: 'Premium' },
                { value: 'admin', label: 'Admin' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTargetAudience(opt.value)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium border transition ${
                    targetAudience === opt.value
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                      : 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
              {t('newsletter.contentLabel', 'Contenu')}
              <span className="ml-2 text-xs font-normal text-[var(--color-text-secondary)]">Markdown supporté</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('newsletter.contentPlaceholder', 'Rédigez votre newsletter ici...')}
              rows={16}
              className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {content.trim() && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {t('newsletter.preview', 'Aperçu')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 prose prose-sm dark:prose-invert max-w-none">
            <h2>{title || 'Sans titre'}</h2>
            {content.split('\n').map((line, i) => {
              if (line.startsWith('# ')) return <h1 key={i}>{line.slice(2)}</h1>;
              if (line.startsWith('## ')) return <h2 key={i}>{line.slice(3)}</h2>;
              if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>;
              if (line.startsWith('- ')) return <li key={i}>{line.slice(2)}</li>;
              if (line.startsWith('---')) return <hr key={i} />;
              if (line.trim() === '') return <br key={i} />;
              return <p key={i}>{line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}</p>;
            })}
          </CardContent>
        </Card>
      )}

      {/* Publish confirmation dialog */}
      {showPublishConfirm && (
        <PublishDialog
          targetAudience={targetAudience}
          publishing={publishing}
          onPublish={handlePublish}
          onClose={() => setShowPublishConfirm(false)}
        />
      )}
    </div>
  );
}
