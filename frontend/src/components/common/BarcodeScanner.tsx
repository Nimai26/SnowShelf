import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Scanner, useDevices } from '@yudiel/react-qr-scanner';
import { Camera, CameraOff, FlashlightOff, Flashlight, SwitchCamera, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '../ui';

interface BarcodeScannerProps {
  onDetected: (barcode: string, format: string) => void;
  onError?: (error: string) => void;
}

/** Delay (ms) to let browser release the camera stream before remounting Scanner */
const SWITCH_DELAY = 600;

export function BarcodeScanner({ onDetected, onError }: BarcodeScannerProps) {
  const { t } = useTranslation('items');
  const [isActive, setIsActive] = useState(true);
  const [torch, setTorch] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const lastDetectedRef = useRef<string>('');
  const cooldownRef = useRef(false);
  const switchTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const devices = useDevices();
  const videoDevices = devices.filter((d) => d.kind === 'videoinput');

  const containerRef = useRef<HTMLDivElement>(null);

  // Cleanup switch timer & release any lingering camera streams on unmount
  useEffect(() => {
    return () => {
      if (switchTimerRef.current) clearTimeout(switchTimerRef.current);
      // Safety net: stop all video streams inside our container
      if (containerRef.current) {
        const videos = containerRef.current.querySelectorAll('video');
        videos.forEach((video) => {
          const stream = video.srcObject as MediaStream | null;
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            video.srcObject = null;
          }
        });
      }
    };
  }, []);

  /**
   * Safely switch camera by unmounting the Scanner first,
   * waiting for the browser to release the stream, then remounting.
   */
  const switchCamera = useCallback((apply: () => void) => {
    if (switchTimerRef.current) clearTimeout(switchTimerRef.current);
    setIsSwitching(true);

    // Force-stop any active video streams before remounting
    if (containerRef.current) {
      const videos = containerRef.current.querySelectorAll('video');
      videos.forEach((video) => {
        const stream = video.srcObject as MediaStream | null;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          video.srcObject = null;
        }
      });
    }

    // Give the browser time to release the device
    switchTimerRef.current = setTimeout(() => {
      apply();
      setIsSwitching(false);
    }, SWITCH_DELAY);
  }, []);

  const handleScan = useCallback(
    (detectedCodes: { rawValue: string; format?: string }[]) => {
      if (!detectedCodes?.length || cooldownRef.current) return;

      const code = detectedCodes[0];
      const value = code.rawValue?.trim();
      if (!value || value === lastDetectedRef.current) return;

      cooldownRef.current = true;
      lastDetectedRef.current = value;
      setTimeout(() => {
        cooldownRef.current = false;
      }, 2000);

      onDetected(value, code.format || 'unknown');
    },
    [onDetected],
  );

  const handleError = useCallback(
    (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      // Ignore timeout errors during switching — they're expected
      if (isSwitching || msg.includes('Timeout')) return;
      if (msg.includes('NotAllowedError')) {
        onError?.(t('scanner.cameraPermissionDenied', 'Accès caméra refusé'));
      } else if (msg.includes('NotFoundError')) {
        onError?.(t('scanner.noCameraFound', 'Aucune caméra trouvée'));
      }
    },
    [onError, t, isSwitching],
  );

  const toggleFacing = useCallback(() => {
    switchCamera(() => {
      setSelectedDeviceId(null);
      setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    });
  }, [switchCamera]);

  const selectDevice = useCallback((deviceId: string) => {
    setShowDeviceSelector(false);
    switchCamera(() => {
      setSelectedDeviceId(deviceId);
    });
  }, [switchCamera]);

  const toggleActive = useCallback(() => {
    if (isActive) {
      // Turn off — just set inactive, Scanner will unmount
      setIsActive(false);
    } else {
      // Turn on — use switching state to allow clean mount
      switchCamera(() => setIsActive(true));
    }
  }, [isActive, switchCamera]);

  // Build constraints based on selected device or facingMode
  const constraints: MediaTrackConstraints = selectedDeviceId
    ? { deviceId: { exact: selectedDeviceId } }
    : { facingMode };

  const showScanner = isActive && !isSwitching;

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-3">
      <div className="relative w-full max-w-sm aspect-square rounded-xl overflow-hidden bg-black">
        {showScanner ? (
          <Scanner
            key={selectedDeviceId || facingMode}
            onScan={handleScan}
            onError={handleError}
            constraints={constraints}
            formats={[
              'ean_13',
              'ean_8',
              'upc_a',
              'upc_e',
              'code_128',
              'code_39',
              'code_93',
              'codabar',
              'itf',
              'qr_code',
              'data_matrix',
            ]}
            components={{
              torch,
              finder: true,
            }}
            styles={{
              container: { width: '100%', height: '100%' },
              video: { objectFit: 'cover' },
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white/50">
            {isSwitching ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <CameraOff className="h-12 w-12" />
            )}
          </div>
        )}

        {/* Top bar — camera selector */}
        {showScanner && videoDevices.length > 1 && (
          <div className="absolute top-2 right-2 z-10">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDeviceSelector((v) => !v)}
                className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs text-white bg-black/50 hover:bg-black/70 transition"
              >
                <Camera className="h-3.5 w-3.5" />
                <ChevronDown className="h-3 w-3" />
              </button>
              {showDeviceSelector && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-lg bg-black/90 backdrop-blur border border-white/20 shadow-xl overflow-hidden z-20">
                  {videoDevices.map((device, i) => (
                    <button
                      key={device.deviceId}
                      type="button"
                      onClick={() => selectDevice(device.deviceId)}
                      className={`w-full px-3 py-2.5 text-left text-xs transition ${
                        selectedDeviceId === device.deviceId
                          ? 'bg-white/20 text-white font-medium'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {device.label || `${t('scanner.camera', 'Caméra')} ${i + 1}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom controls */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          <Button
            type="button"
            variant="secondary"
            className="rounded-full h-10 w-10 p-0 bg-black/50 text-white border-none hover:bg-black/70"
            onClick={toggleActive}
            disabled={isSwitching}
          >
            {isActive ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
          </Button>
          {isActive && (
            <>
              <Button
                type="button"
                variant="secondary"
                className="rounded-full h-10 w-10 p-0 bg-black/50 text-white border-none hover:bg-black/70"
                onClick={() => setTorch(!torch)}
              >
                {torch ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
              </Button>
              {videoDevices.length > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-full h-10 w-10 p-0 bg-black/50 text-white border-none hover:bg-black/70"
                  onClick={toggleFacing}
                >
                  <SwitchCamera className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <p className="text-xs text-[var(--color-text-secondary)] text-center">
        {t('scanner.pointCamera', 'Pointez la caméra vers un code-barres ou QR code')}
      </p>
    </div>
  );
}
