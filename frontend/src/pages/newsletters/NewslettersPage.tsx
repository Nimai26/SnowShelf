import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Newspaper } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import type { PublishedNewsletter } from '../../types/admin.types';
import { Card, CardContent, Spinner, EmptyState } from '../../components/ui';

export default function NewslettersPage() {
  const { t } = useTranslation('common');
  const [newsletters, setNewsletters] = useState<PublishedNewsletter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getPublishedNewsletters(1, 50)
      .then((res) => setNewsletters(res.newsletters))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">
        {t('newsletters.title', 'Actualités')}
      </h1>

      {newsletters.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title={t('newsletters.empty', 'Aucune actualité pour le moment')}
          description={t('newsletters.emptyDesc', 'Revenez bientôt pour les dernières nouvelles.')}
        />
      ) : (
        <div className="space-y-6">
          {newsletters.map((nl) => (
            <Card key={nl.id}>
              <CardContent className="p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[var(--color-text)]">{nl.title}</h2>
                  <span className="text-xs text-[var(--color-text-secondary)] shrink-0 ml-4">
                    {nl.publishedAt && new Date(nl.publishedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none text-[var(--color-text)]">
                  {nl.content.split('\n').map((line, i) => {
                    if (line.startsWith('# ')) return <h1 key={i}>{line.slice(2)}</h1>;
                    if (line.startsWith('## ')) return <h2 key={i}>{line.slice(3)}</h2>;
                    if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>;
                    if (line.startsWith('- ')) return <li key={i}>{line.slice(2)}</li>;
                    if (line.startsWith('---')) return <hr key={i} />;
                    if (line.trim() === '') return <br key={i} />;
                    return <p key={i} dangerouslySetInnerHTML={{
                      __html: line
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>'),
                    }} />;
                  })}
                </div>
                {nl.author && (
                  <p className="mt-4 text-xs text-[var(--color-text-secondary)]">
                    — {nl.author.username}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
