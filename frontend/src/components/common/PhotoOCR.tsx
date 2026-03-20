import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createWorker } from 'tesseract.js';
import { Camera, RotateCcw, Search, Loader2, ImagePlus } from 'lucide-react';
import { Button } from '../ui';
import { CameraCapture } from '../media/CameraCapture';

interface PhotoOCRProps {
  onTextExtracted: (text: string) => void;
  onError?: (error: string) => void;
}

type Mode = 'choose' | 'camera' | 'preview';

export function PhotoOCR({ onTextExtracted, onError }: PhotoOCRProps) {
  const { t } = useTranslation('items');
  const [mode, setMode] = useState<Mode>('choose');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCameraCapture = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setCapturedImage(url);
    setExtractedText('');
    setMode('preview');
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCapturedImage(url);
    setExtractedText('');
    setMode('preview');
  }, []);

  const runOCR = useCallback(async () => {
    if (!capturedImage) return;
    setProcessing(true);
    setExtractedText('');

    try {
      const worker = await createWorker('fra+eng');
      const { data } = await worker.recognize(capturedImage);
      await worker.terminate();

      const text = data.text?.trim();
      if (text) {
        setExtractedText(text);
      } else {
        onError?.(t('scanner.noTextFound', 'Aucun texte détecté dans l\'image'));
      }
    } catch (err) {
      onError?.(t('scanner.ocrError', 'Erreur lors de la reconnaissance de texte'));
    } finally {
      setProcessing(false);
    }
  }, [capturedImage, onError, t]);

  const reset = useCallback(() => {
    if (capturedImage) URL.revokeObjectURL(capturedImage);
    setCapturedImage(null);
    setExtractedText('');
    setMode('choose');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [capturedImage]);

  const handleUseText = useCallback(() => {
    if (extractedText) {
      onTextExtracted(extractedText);
    }
  }, [extractedText, onTextExtracted]);

  // Full-screen camera mode
  if (mode === 'camera') {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onClose={() => setMode('choose')}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {mode === 'choose' && (
        <>
          <div className="w-full max-w-sm rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col items-center justify-center gap-4 py-10 px-6">
            <Camera className="h-10 w-10 text-[var(--color-text-secondary)] opacity-50" />
            <p className="text-sm text-[var(--color-text-secondary)] text-center">
              {t('scanner.photoHint', 'Prenez en photo un nom de produit, une boîte, une couverture…')}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button
                type="button"
                variant="primary"
                onClick={() => setMode('camera')}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                {t('scanner.takePhoto', 'Prendre une photo')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                {t('scanner.chooseImage', 'Choisir une image')}
              </Button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </>
      )}

      {mode === 'preview' && capturedImage && (
        <>
          <div className="relative w-full max-w-sm rounded-xl overflow-hidden">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-auto max-h-64 object-contain bg-black"
            />
          </div>

          <div className="flex gap-2 w-full max-w-sm">
            <Button type="button" variant="secondary" onClick={reset} className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('scanner.retake', 'Reprendre')}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={runOCR}
              disabled={processing}
              className="flex-1"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {processing
                ? t('scanner.analyzing', 'Analyse...')
                : t('scanner.extractText', 'Extraire le texte')}
            </Button>
          </div>

          {extractedText && (
            <div className="w-full max-w-sm space-y-2">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                {t('scanner.detectedText', 'Texte détecté :')}
              </label>
              <textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text)] resize-none"
                rows={3}
              />
              <Button type="button" variant="primary" onClick={handleUseText} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                {t('scanner.searchWithText', 'Rechercher avec ce texte')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
