import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  FolderOpen,
  Search,
  Camera,
  Settings,
  ArrowRight,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../ui';

const ONBOARDING_KEY = 'snowshelf_onboarding_completed';

interface OnboardingStep {
  icon: React.ReactNode;
  titleKey: string;
  descriptionKey: string;
  defaultTitle: string;
  defaultDescription: string;
}

const steps: OnboardingStep[] = [
  {
    icon: <FolderOpen className="h-12 w-12" />,
    titleKey: 'onboarding.step1Title',
    descriptionKey: 'onboarding.step1Desc',
    defaultTitle: 'Créez vos catégories',
    defaultDescription: 'Organisez vos collections par thèmes : jeux vidéo, figurines, cartes, vinyles...',
  },
  {
    icon: <Package className="h-12 w-12" />,
    titleKey: 'onboarding.step2Title',
    descriptionKey: 'onboarding.step2Desc',
    defaultTitle: 'Ajoutez vos articles',
    defaultDescription: 'Cataloguez chaque pièce de votre collection avec des détails, prix et notes.',
  },
  {
    icon: <Camera className="h-12 w-12" />,
    titleKey: 'onboarding.step3Title',
    descriptionKey: 'onboarding.step3Desc',
    defaultTitle: 'Capturez en photo',
    defaultDescription: 'Prenez des photos directement depuis l\'app ou importez-les depuis votre galerie.',
  },
  {
    icon: <Search className="h-12 w-12" />,
    titleKey: 'onboarding.step4Title',
    descriptionKey: 'onboarding.step4Desc',
    defaultTitle: 'Recherchez avec Tako',
    defaultDescription: 'Trouvez des informations sur vos articles grâce à 32 sources de données intégrées.',
  },
  {
    icon: <Settings className="h-12 w-12" />,
    titleKey: 'onboarding.step5Title',
    descriptionKey: 'onboarding.step5Desc',
    defaultTitle: 'Personnalisez tout',
    defaultDescription: 'Choisissez parmi 43 thèmes, changez de langue et configurez vos notifications.',
  },
];

export default function OnboardingTutorial() {
  const { t } = useTranslation('common');
  const [show, setShow] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // Small delay to let the page render first
      const timer = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const complete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShow(false);
  };

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      complete();
    }
  };

  const skip = () => {
    complete();
  };

  if (!show) return null;

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-md rounded-2xl bg-[var(--color-surface)] p-8 shadow-2xl"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={skip}
            className="absolute right-4 top-4 rounded-full p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] transition"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Step content */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              {step.icon}
            </div>
            <h2 className="mb-2 text-xl font-bold text-[var(--color-text)]">
              {t(step.titleKey, step.defaultTitle)}
            </h2>
            <p className="mb-8 text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {t(step.descriptionKey, step.defaultDescription)}
            </p>
          </div>

          {/* Progress dots */}
          <div className="mb-6 flex items-center justify-center gap-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'w-6 bg-[var(--color-primary)]'
                    : idx < currentStep
                      ? 'w-2 bg-[var(--color-primary)]/50'
                      : 'w-2 bg-[var(--color-hover)]'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={skip}
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition"
            >
              {t('onboarding.skip', 'Passer')}
            </button>
            <Button onClick={next}>
              {currentStep < steps.length - 1 ? (
                <>
                  {t('onboarding.next', 'Suivant')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {t('onboarding.start', "C'est parti !")}
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
