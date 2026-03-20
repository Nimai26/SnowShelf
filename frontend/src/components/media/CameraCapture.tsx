import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  SwitchCamera,
  Zap,
  ZapOff,
  ZoomIn,
  ZoomOut,
  X,
  Image as ImageIcon,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../ui';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface CameraCaptureProps {
  /** Called when an image is captured (raw blob before editing) */
  onCapture: (blob: Blob) => void;
  /** Called when user closes the camera */
  onClose: () => void;
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const { t } = useTranslation('manage');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasCamera, setHasCamera] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [flashOn, setFlashOn] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);
  const [capturing, setCapturing] = useState(false);
  const [flashAnimation, setFlashAnimation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);

  // ── Enumerate cameras ──
  const enumerateDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return [];
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices(videoDevices);
      return videoDevices;
    } catch {
      return [];
    }
  }, []);

  // ── Start camera ──
  const startCamera = useCallback(async (facing: 'user' | 'environment', deviceId?: string) => {
    // Stop existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // mediaDevices is only available in secure contexts (HTTPS or localhost)
    if (!navigator.mediaDevices?.getUserMedia) {
      console.warn('navigator.mediaDevices unavailable — insecure context (HTTP on non-localhost)');
      setHasCamera(false);
      setError(t('media.camera.insecureContext', 'La caméra nécessite une connexion HTTPS'));
      return;
    }

    try {
      const videoConstraints: MediaTrackConstraints = deviceId
        ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
        : { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } };

      const constraints: MediaStreamConstraints = {
        video: videoConstraints,
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Track the active device id
      const activeTrack = stream.getVideoTracks()[0];
      const settings = activeTrack.getSettings?.();
      if (settings?.deviceId) setActiveDeviceId(settings.deviceId);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr: any) {
          // AbortError is expected when React Strict Mode double-mounts in dev
          // (the cleanup stops the stream while play() is pending)
          if (playErr.name === 'AbortError') return;
          throw playErr;
        }
      }

      // Check flash/torch support
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      if (capabilities?.torch) {
        setFlashSupported(true);
      } else {
        setFlashSupported(false);
        setFlashOn(false);
      }

      // Check zoom support
      if (capabilities?.zoom) {
        setMaxZoom(capabilities.zoom.max || 1);
        setZoom(capabilities.zoom.min || 1);
      } else {
        setMaxZoom(1);
        setZoom(1);
      }

      setHasCamera(true);
      setError(null);
    } catch (err: any) {
      // AbortError from play() interrupted by cleanup — not a real error
      if (err.name === 'AbortError') return;
      console.error('Camera error:', err);
      setHasCamera(false);
      setError(
        err.name === 'NotAllowedError'
          ? t('media.camera.permissionDenied', 'Accès à la caméra refusé')
          : t('media.camera.notAvailable', 'Caméra non disponible'),
      );
    }
  }, [t]);

  useEffect(() => {
    const init = async () => {
      await startCamera(facingMode);
      // Enumerate after first getUserMedia so labels are available
      await enumerateDevices();
    };
    init();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // ── Toggle facing ──
  const toggleFacing = async () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    await startCamera(newFacing);
  };

  // ── Switch to specific device ──
  const switchToDevice = async (deviceId: string) => {
    setActiveDeviceId(deviceId);
    setShowDeviceSelector(false);
    await startCamera(facingMode, deviceId);
  };

  // ── Toggle flash ──
  const toggleFlash = async () => {
    if (!streamRef.current || !flashSupported) return;
    const track = streamRef.current.getVideoTracks()[0];
    const newFlash = !flashOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: newFlash } as any],
      });
      setFlashOn(newFlash);
    } catch {
      // Flash not supported on this device
    }
  };

  // ── Zoom ──
  const changeZoom = async (newZoom: number) => {
    const clampedZoom = Math.max(1, Math.min(maxZoom, newZoom));
    setZoom(clampedZoom);

    if (streamRef.current && maxZoom > 1) {
      const track = streamRef.current.getVideoTracks()[0];
      try {
        await track.applyConstraints({
          advanced: [{ zoom: clampedZoom } as any],
        });
      } catch {
        // Zoom not supported natively, CSS fallback
      }
    }
  };

  // ── Capture ──
  const capture = async () => {
    if (!videoRef.current || !canvasRef.current || capturing) return;
    setCapturing(true);

    // Flash animation
    setFlashAnimation(true);
    setTimeout(() => setFlashAnimation(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;

    // Mirror for front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCapture(blob);
        }
        setCapturing(false);
      },
      'image/jpeg',
      0.95,
    );
  };

  // ── Fallback: file input ──
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
    }
  };

  // ── No camera fallback ──
  if (!hasCamera || error) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0f0f1a]">
        <div className="max-w-sm mx-auto text-center p-6 space-y-4">
          <Camera className="h-16 w-16 mx-auto text-[var(--color-text-secondary)]" />
          <p className="text-sm text-[var(--color-text)]">
            {error || t('media.camera.notAvailable', 'Caméra non disponible')}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {t('media.camera.fallbackHint', 'Vous pouvez utiliser la sélection de fichier à la place')}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInput}
            className="hidden"
          />

          <div className="flex gap-2 justify-center">
            <Button variant="ghost" onClick={onClose}>
              {t('media.editor.cancel', 'Annuler')}
            </Button>
            <Button onClick={() => fileInputRef.current?.click()}>
              <ImageIcon className="h-4 w-4 mr-1" />
              {t('media.camera.chooseFile', 'Choisir un fichier')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main camera UI ──
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-white/80 hover:text-white hover:bg-white/10 transition"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-2">
          {flashSupported && (
            <button
              type="button"
              onClick={toggleFlash}
              className={`rounded-full p-2 transition ${
                flashOn ? 'text-yellow-400 bg-white/10' : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {flashOn ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
            </button>
          )}
          {devices.length > 1 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDeviceSelector((v) => !v)}
                className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs text-white/80 hover:text-white hover:bg-white/10 transition"
              >
                <Camera className="h-4 w-4" />
                <ChevronDown className="h-3 w-3" />
              </button>
              {showDeviceSelector && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-lg bg-black/90 backdrop-blur border border-white/20 shadow-xl overflow-hidden z-20">
                  {devices.map((device, i) => (
                    <button
                      key={device.deviceId}
                      type="button"
                      onClick={() => switchToDevice(device.deviceId)}
                      className={`w-full px-3 py-2.5 text-left text-xs transition ${
                        activeDeviceId === device.deviceId
                          ? 'bg-white/20 text-white font-medium'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {device.label || `${t('media.camera.device', 'Caméra')} ${i + 1}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Video */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
          style={{
            transform: facingMode === 'user' ? 'scaleX(-1)' : undefined,
            ...(maxZoom <= 1 && zoom > 1 ? { transform: `scale(${zoom})` } : {}),
          }}
        />

        {/* Flash animation overlay */}
        {flashAnimation && (
          <div className="absolute inset-0 bg-white animate-[flash_200ms_ease-out]" />
        )}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 inset-x-0 z-10 pb-8 pt-4 bg-gradient-to-t from-black/80 to-transparent">
        {/* Zoom slider */}
        {maxZoom > 1 && (
          <div className="flex items-center justify-center gap-2 mb-4 px-12">
            <ZoomOut className="h-4 w-4 text-white/60" />
            <input
              type="range"
              min={1}
              max={maxZoom}
              step={0.1}
              value={zoom}
              onChange={(e) => changeZoom(Number(e.target.value))}
              className="flex-1 h-1 accent-white"
            />
            <ZoomIn className="h-4 w-4 text-white/60" />
            <span className="text-xs text-white/60 min-w-[32px]">{zoom.toFixed(1)}×</span>
          </div>
        )}

        {/* Capture & switch buttons */}
        <div className="flex items-center justify-center gap-8">
          {/* Gallery / file fallback */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full p-3 text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <ImageIcon className="h-6 w-6" />
          </button>

          {/* Capture button */}
          <button
            type="button"
            onClick={capture}
            disabled={capturing}
            className="group relative h-18 w-18 rounded-full"
            style={{ width: 72, height: 72 }}
          >
            <div className="absolute inset-0 rounded-full border-4 border-white transition group-active:scale-90" />
            <div className="absolute inset-[6px] rounded-full bg-white transition group-hover:bg-white/90 group-active:bg-white/75" />
          </button>

          {/* Switch camera */}
          <button
            type="button"
            onClick={toggleFacing}
            className="rounded-full p-3 text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <SwitchCamera className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Flash CSS animation */}
      <style>{`
        @keyframes flash {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
