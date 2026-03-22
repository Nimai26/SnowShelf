import { useTranslation } from 'react-i18next';
import { Download, Smartphone, Shield, Wifi } from 'lucide-react';
import { Card, CardContent, Button } from '../../components/ui';
import logoImg from '../../assets/images/logo.png';

export default function DownloadPage() {
  const { t } = useTranslation('common');

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-12 text-center">
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-3">
          <img src={logoImg} alt="SnowShelf" className="h-14 w-14" />
          <h1 className="text-3xl font-bold text-[var(--color-text)]">
            SnowShelf pour Android
          </h1>
        </div>
        <p className="text-[var(--color-text-secondary)]">
          Installez l'application SnowShelf sur votre appareil Android pour un accès rapide à vos collections.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-6 py-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10">
            <Smartphone className="h-10 w-10 text-[var(--color-primary)]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--color-text)]">
              SnowShelf v1.0.0
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              APK Android • 2,8 Mo
            </p>
          </div>

          <a href="/downloads/snowshelf.apk" download>
            <Button>
              <Download className="mr-2 h-5 w-5" />
              Télécharger l'APK
            </Button>
          </a>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            icon: Smartphone,
            title: 'Application native',
            desc: 'Accédez à SnowShelf comme une app Android classique',
          },
          {
            icon: Shield,
            title: 'Sûre & vérifiée',
            desc: 'APK signé par l\'équipe SnowShelf',
          },
          {
            icon: Wifi,
            title: 'Fonctionne hors-ligne',
            desc: 'Consultez vos collections même sans connexion',
          },
        ].map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="text-left">
            <CardContent className="flex flex-col gap-2 pt-4">
              <Icon className="h-5 w-5 text-[var(--color-primary)]" />
              <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="text-left">
        <CardContent className="space-y-3 pt-4">
          <h3 className="font-semibold text-[var(--color-text)]">Comment installer ?</h3>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-[var(--color-text-secondary)]">
            <li>Téléchargez le fichier APK ci-dessus</li>
            <li>Ouvrez le fichier téléchargé sur votre appareil</li>
            <li>Si demandé, autorisez l'installation depuis des sources inconnues</li>
            <li>Suivez les instructions d'installation</li>
            <li>SnowShelf apparaîtra dans vos applications !</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
