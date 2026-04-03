import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Sun,
  Contrast,
  Droplets,
  Download,
  X,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  Undo2,
} from 'lucide-react';
import { Button } from '../ui';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface ImageEditorProps {
  /** Image source: URL, blob URL, or data URL */
  src: string;
  /** Called when user confirms the edit */
  onSave: (blob: Blob, format: string) => void;
  /** Called when user cancels */
  onCancel: () => void;
  /** Initial filename for reference */
  filename?: string;
}

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type CropHandle = 'tl' | 'tr' | 'bl' | 'br' | 'tm' | 'bm' | 'ml' | 'mr' | 'move';
type EditorMode = 'transform' | 'crop' | 'filters';

interface Filters {
  brightness: number; // -100..+100
  contrast: number;
  saturation: number;
}

interface Transform {
  rotation: number;  // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
}

const CROP_PRESETS = [
  { label: 'Libre', ratio: 0 },
  { label: '1:1', ratio: 1 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '3:2', ratio: 3 / 2 },
  { label: '16:9', ratio: 16 / 9 },
];

const FORMAT_OPTIONS = [
  { value: 'image/jpeg', label: 'JPEG', ext: 'jpg' },
  { value: 'image/png', label: 'PNG', ext: 'png' },
  { value: 'image/webp', label: 'WebP', ext: 'webp' },
];

const MIN_CROP_SIZE = 20;

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export function ImageEditor({ src, onSave, onCancel, filename }: ImageEditorProps) {
  const { t } = useTranslation('manage');

  // ── State ──
  const [mode, setMode] = useState<EditorMode>('transform');
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [transform, setTransform] = useState<Transform>({ rotation: 0, flipH: false, flipV: false });
  const [filters, setFilters] = useState<Filters>({ brightness: 0, contrast: 0, saturation: 0 });
  const [cropping, setCropping] = useState(false);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [cropRatio, setCropRatio] = useState(0);
  const [activeHandle, setActiveHandle] = useState<CropHandle | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; cropRect: CropRect } | null>(null);
  const [outputFormat, setOutputFormat] = useState('image/jpeg');
  const [quality, setQuality] = useState(92);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);

  // ── Load image ──
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      fitToContainer(img);
    };
    img.src = src;
  }, [src]);

  const fitToContainer = useCallback((img: HTMLImageElement) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const pw = container.clientWidth - 40;
    const ph = container.clientHeight - 40;
    const scale = Math.min(pw / img.naturalWidth, ph / img.naturalHeight, 1);
    setZoom(scale);
    setPan({ x: 0, y: 0 });
  }, []);

  // ── Draw canvas ──
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !image || !containerRef.current) return;

    const container = containerRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = container.clientWidth * dpr;
    canvas.height = container.clientHeight * dpr;
    canvas.style.width = `${container.clientWidth}px`;
    canvas.style.height = `${container.clientHeight}px`;
    ctx.scale(dpr, dpr);

    const cw = container.clientWidth;
    const ch = container.clientHeight;

    // Clear
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();

    // Center + pan
    ctx.translate(cw / 2 + pan.x, ch / 2 + pan.y);

    // Zoom
    ctx.scale(zoom, zoom);

    // Rotation
    ctx.rotate((transform.rotation * Math.PI) / 180);

    // Flip
    ctx.scale(transform.flipH ? -1 : 1, transform.flipV ? -1 : 1);

    // CSS-like filters
    const b = 1 + filters.brightness / 100;
    const c = 1 + filters.contrast / 100;
    const s = 1 + filters.saturation / 100;
    ctx.filter = `brightness(${b}) contrast(${c}) saturate(${s})`;

    // Draw image centered
    ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

    ctx.restore();

    // Draw crop overlay if active
    if (cropping && cropRect) {
      drawCropOverlay(ctx, cw, ch);
    }
  }, [image, zoom, pan, transform, filters, cropping, cropRect]);

  const drawCropOverlay = (ctx: CanvasRenderingContext2D, cw: number, ch: number) => {
    if (!cropRect || !image) return;

    // Convert crop rect (in image coords) to screen coords
    const screen = imageToScreen(cropRect);

    // Darken outside
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    // Top
    ctx.fillRect(0, 0, cw, screen.y);
    // Bottom
    ctx.fillRect(0, screen.y + screen.height, cw, ch - screen.y - screen.height);
    // Left
    ctx.fillRect(0, screen.y, screen.x, screen.height);
    // Right
    ctx.fillRect(screen.x + screen.width, screen.y, cw - screen.x - screen.width, screen.height);

    // Crop border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(screen.x, screen.y, screen.width, screen.height);

    // Rule of thirds
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 2; i++) {
      const xLine = screen.x + (screen.width * i) / 3;
      const yLine = screen.y + (screen.height * i) / 3;
      ctx.beginPath();
      ctx.moveTo(xLine, screen.y);
      ctx.lineTo(xLine, screen.y + screen.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(screen.x, yLine);
      ctx.lineTo(screen.x + screen.width, yLine);
      ctx.stroke();
    }

    // Handles (larger on touch devices)
    const isTouchDevice = 'ontouchstart' in window;
    const handleSize = isTouchDevice ? 16 : 10;
    ctx.fillStyle = '#ffffff';
    const handles = getCropHandlePositions(screen);
    for (const pos of Object.values(handles)) {
      ctx.fillRect(pos.x - handleSize / 2, pos.y - handleSize / 2, handleSize, handleSize);
    }
  };

  // ── Coordinate helpers ──
  const imageToScreen = (rect: CropRect) => {
    if (!containerRef.current) return { x: 0, y: 0, width: 0, height: 0 };
    const c = containerRef.current;
    const cx = c.clientWidth / 2 + pan.x;
    const cy = c.clientHeight / 2 + pan.y;

    return {
      x: cx + (rect.x - (image?.naturalWidth || 0) / 2) * zoom,
      y: cy + (rect.y - (image?.naturalHeight || 0) / 2) * zoom,
      width: rect.width * zoom,
      height: rect.height * zoom,
    };
  };

  // screenToImage: reserved for future touch-based interactions

  const getCropHandlePositions = (screen: { x: number; y: number; width: number; height: number }) => ({
    tl: { x: screen.x, y: screen.y },
    tr: { x: screen.x + screen.width, y: screen.y },
    bl: { x: screen.x, y: screen.y + screen.height },
    br: { x: screen.x + screen.width, y: screen.y + screen.height },
    tm: { x: screen.x + screen.width / 2, y: screen.y },
    bm: { x: screen.x + screen.width / 2, y: screen.y + screen.height },
    ml: { x: screen.x, y: screen.y + screen.height / 2 },
    mr: { x: screen.x + screen.width, y: screen.y + screen.height / 2 },
  });

  // ── Redraw on change ──
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
    const handleResize = () => drawCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawCanvas]);

  // ── Zoom with scroll ──
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.1, Math.min(10, z * delta)));
  }, []);

  // ── Pan with mouse drag (when not cropping) ──
  const handleMouseDown = (e: React.MouseEvent) => {
    if (cropping && cropRect) {
      // Check if clicking on a handle
      const screen = imageToScreen(cropRect);
      const handles = getCropHandlePositions(screen);
      const threshold = 12;
      const mx = e.nativeEvent.offsetX;
      const my = e.nativeEvent.offsetY;

      for (const [key, pos] of Object.entries(handles)) {
        if (Math.abs(mx - pos.x) < threshold && Math.abs(my - pos.y) < threshold) {
          setActiveHandle(key as CropHandle);
          setDragStart({ x: mx, y: my, cropRect: { ...cropRect } });
          return;
        }
      }

      // Check if clicking inside crop rect → move
      if (
        mx >= screen.x && mx <= screen.x + screen.width &&
        my >= screen.y && my <= screen.y + screen.height
      ) {
        setActiveHandle('move');
        setDragStart({ x: mx, y: my, cropRect: { ...cropRect } });
        return;
      }
    }

    // Regular pan
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (activeHandle && dragStart && cropRect && image) {
      const mx = e.nativeEvent.offsetX;
      const my = e.nativeEvent.offsetY;
      const dx = (mx - dragStart.x) / zoom;
      const dy = (my - dragStart.y) / zoom;
      const orig = dragStart.cropRect;
      const iw = image.naturalWidth;
      const ih = image.naturalHeight;

      let newRect = { ...orig };

      if (activeHandle === 'move') {
        newRect.x = Math.max(0, Math.min(iw - orig.width, orig.x + dx));
        newRect.y = Math.max(0, Math.min(ih - orig.height, orig.y + dy));
      } else {
        // Resize handles
        switch (activeHandle) {
          case 'br':
            newRect.width = Math.max(MIN_CROP_SIZE, orig.width + dx);
            newRect.height = Math.max(MIN_CROP_SIZE, orig.height + dy);
            break;
          case 'bl':
            newRect.x = orig.x + dx;
            newRect.width = Math.max(MIN_CROP_SIZE, orig.width - dx);
            newRect.height = Math.max(MIN_CROP_SIZE, orig.height + dy);
            break;
          case 'tr':
            newRect.y = orig.y + dy;
            newRect.width = Math.max(MIN_CROP_SIZE, orig.width + dx);
            newRect.height = Math.max(MIN_CROP_SIZE, orig.height - dy);
            break;
          case 'tl':
            newRect.x = orig.x + dx;
            newRect.y = orig.y + dy;
            newRect.width = Math.max(MIN_CROP_SIZE, orig.width - dx);
            newRect.height = Math.max(MIN_CROP_SIZE, orig.height - dy);
            break;
          case 'tm':
            newRect.y = orig.y + dy;
            newRect.height = Math.max(MIN_CROP_SIZE, orig.height - dy);
            break;
          case 'bm':
            newRect.height = Math.max(MIN_CROP_SIZE, orig.height + dy);
            break;
          case 'ml':
            newRect.x = orig.x + dx;
            newRect.width = Math.max(MIN_CROP_SIZE, orig.width - dx);
            break;
          case 'mr':
            newRect.width = Math.max(MIN_CROP_SIZE, orig.width + dx);
            break;
        }

        // Enforce ratio
        if (cropRatio > 0) {
          if (['br', 'tr', 'mr'].includes(activeHandle)) {
            newRect.height = newRect.width / cropRatio;
          } else {
            newRect.width = newRect.height * cropRatio;
          }
        }
      }

      // Clamp to image bounds
      newRect.x = Math.max(0, newRect.x);
      newRect.y = Math.max(0, newRect.y);
      newRect.width = Math.min(newRect.width, iw - newRect.x);
      newRect.height = Math.min(newRect.height, ih - newRect.y);

      setCropRect(newRect);
      return;
    }

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setActiveHandle(null);
    setDragStart(null);
    setIsPanning(false);
  };

  // ── Touch event helpers (for crop & pan on mobile) ──
  const getTouchOffset = (e: React.TouchEvent, touch: React.Touch) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchIdRef.current = touch.identifier;
    const { offsetX, offsetY } = getTouchOffset(e, touch);

    if (cropping && cropRect) {
      const screen = imageToScreen(cropRect);
      const handles = getCropHandlePositions(screen);
      const threshold = 24; // larger for touch
      for (const [key, pos] of Object.entries(handles)) {
        if (Math.abs(offsetX - pos.x) < threshold && Math.abs(offsetY - pos.y) < threshold) {
          e.preventDefault();
          setActiveHandle(key as CropHandle);
          setDragStart({ x: offsetX, y: offsetY, cropRect: { ...cropRect } });
          return;
        }
      }
      if (
        offsetX >= screen.x && offsetX <= screen.x + screen.width &&
        offsetY >= screen.y && offsetY <= screen.y + screen.height
      ) {
        e.preventDefault();
        setActiveHandle('move');
        setDragStart({ x: offsetX, y: offsetY, cropRect: { ...cropRect } });
        return;
      }
    }

    // Pan
    setIsPanning(true);
    setPanStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = Array.from(e.touches).find((t) => t.identifier === touchIdRef.current);
    if (!touch) return;
    const { offsetX, offsetY } = getTouchOffset(e, touch);

    if (activeHandle && dragStart && cropRect && image) {
      e.preventDefault();
      const dx = (offsetX - dragStart.x) / zoom;
      const dy = (offsetY - dragStart.y) / zoom;
      const orig = dragStart.cropRect;
      const iw = image.naturalWidth;
      const ih = image.naturalHeight;
      let newRect = { ...orig };

      if (activeHandle === 'move') {
        newRect.x = Math.max(0, Math.min(iw - orig.width, orig.x + dx));
        newRect.y = Math.max(0, Math.min(ih - orig.height, orig.y + dy));
      } else {
        switch (activeHandle) {
          case 'br': newRect.width = Math.max(MIN_CROP_SIZE, orig.width + dx); newRect.height = Math.max(MIN_CROP_SIZE, orig.height + dy); break;
          case 'bl': newRect.x = orig.x + dx; newRect.width = Math.max(MIN_CROP_SIZE, orig.width - dx); newRect.height = Math.max(MIN_CROP_SIZE, orig.height + dy); break;
          case 'tr': newRect.y = orig.y + dy; newRect.width = Math.max(MIN_CROP_SIZE, orig.width + dx); newRect.height = Math.max(MIN_CROP_SIZE, orig.height - dy); break;
          case 'tl': newRect.x = orig.x + dx; newRect.y = orig.y + dy; newRect.width = Math.max(MIN_CROP_SIZE, orig.width - dx); newRect.height = Math.max(MIN_CROP_SIZE, orig.height - dy); break;
          case 'tm': newRect.y = orig.y + dy; newRect.height = Math.max(MIN_CROP_SIZE, orig.height - dy); break;
          case 'bm': newRect.height = Math.max(MIN_CROP_SIZE, orig.height + dy); break;
          case 'ml': newRect.x = orig.x + dx; newRect.width = Math.max(MIN_CROP_SIZE, orig.width - dx); break;
          case 'mr': newRect.width = Math.max(MIN_CROP_SIZE, orig.width + dx); break;
        }
        if (cropRatio > 0) {
          if (['br', 'tr', 'mr'].includes(activeHandle)) { newRect.height = newRect.width / cropRatio; }
          else { newRect.width = newRect.height * cropRatio; }
        }
      }
      newRect.x = Math.max(0, newRect.x);
      newRect.y = Math.max(0, newRect.y);
      newRect.width = Math.min(newRect.width, iw - newRect.x);
      newRect.height = Math.min(newRect.height, ih - newRect.y);
      setCropRect(newRect);
      return;
    }

    if (isPanning) {
      e.preventDefault();
      setPan({ x: touch.clientX - panStart.x, y: touch.clientY - panStart.y });
    }
  };

  const handleTouchEnd = () => {
    touchIdRef.current = null;
    setActiveHandle(null);
    setDragStart(null);
    setIsPanning(false);
  };

  // ── Transform actions ──
  const rotate = (dir: 'cw' | 'ccw') => {
    setTransform((t) => ({
      ...t,
      rotation: ((t.rotation + (dir === 'cw' ? 90 : -90)) % 360 + 360) % 360,
    }));
  };

  const flipH = () => setTransform((t) => ({ ...t, flipH: !t.flipH }));
  const flipV = () => setTransform((t) => ({ ...t, flipV: !t.flipV }));

  const resetAll = () => {
    setTransform({ rotation: 0, flipH: false, flipV: false });
    setFilters({ brightness: 0, contrast: 0, saturation: 0 });
    setCropping(false);
    setCropRect(null);
    if (image) fitToContainer(image);
  };

  // ── Crop actions ──
  const startCrop = () => {
    if (!image) return;
    setCropping(true);
    setMode('crop');
    // Default: full image crop
    // ratio used for default sizing
    let w = image.naturalWidth * 0.8;
    let h = cropRatio > 0 ? w / cropRatio : image.naturalHeight * 0.8;
    if (h > image.naturalHeight * 0.8) {
      h = image.naturalHeight * 0.8;
      w = cropRatio > 0 ? h * cropRatio : image.naturalWidth * 0.8;
    }
    setCropRect({
      x: (image.naturalWidth - w) / 2,
      y: (image.naturalHeight - h) / 2,
      width: w,
      height: h,
    });
  };

  const applyCrop = () => {
    if (!cropRect || !image) return;
    // Apply crop by creating a new source image
    const offscreen = document.createElement('canvas');
    offscreen.width = cropRect.width;
    offscreen.height = cropRect.height;
    const octx = offscreen.getContext('2d');
    if (!octx) return;

    // Apply transforms before cropping
    octx.save();
    octx.translate(offscreen.width / 2, offscreen.height / 2);
    octx.rotate((transform.rotation * Math.PI) / 180);
    octx.scale(transform.flipH ? -1 : 1, transform.flipV ? -1 : 1);

    // After rotation, the crop coordinates need adjustment
    // For simplicity, we draw on a full transform canvas first, then extract the crop region
    octx.restore();

    // Simpler approach: draw full transformed image, then extract crop
    const fullCanvas = document.createElement('canvas');
    const isRotated90 = transform.rotation === 90 || transform.rotation === 270;
    fullCanvas.width = isRotated90 ? image.naturalHeight : image.naturalWidth;
    fullCanvas.height = isRotated90 ? image.naturalWidth : image.naturalHeight;
    const fctx = fullCanvas.getContext('2d')!;

    fctx.translate(fullCanvas.width / 2, fullCanvas.height / 2);
    fctx.rotate((transform.rotation * Math.PI) / 180);
    fctx.scale(transform.flipH ? -1 : 1, transform.flipV ? -1 : 1);
    
    const b = 1 + filters.brightness / 100;
    const c = 1 + filters.contrast / 100;
    const s = 1 + filters.saturation / 100;
    fctx.filter = `brightness(${b}) contrast(${c}) saturate(${s})`;

    fctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

    // Extract the crop region
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = Math.round(cropRect.width);
    cropCanvas.height = Math.round(cropRect.height);
    const cctx = cropCanvas.getContext('2d')!;
    cctx.drawImage(
      fullCanvas,
      Math.round(cropRect.x), Math.round(cropRect.y),
      Math.round(cropRect.width), Math.round(cropRect.height),
      0, 0,
      Math.round(cropRect.width), Math.round(cropRect.height),
    );

    // Update the source image
    const newImg = new window.Image();
    newImg.onload = () => {
      setImage(newImg);
      setTransform({ rotation: 0, flipH: false, flipV: false });
      setFilters({ brightness: 0, contrast: 0, saturation: 0 });
      setCropping(false);
      setCropRect(null);
      fitToContainer(newImg);
    };
    newImg.src = cropCanvas.toDataURL('image/png');
  };

  const cancelCrop = () => {
    setCropping(false);
    setCropRect(null);
    setMode('transform');
  };

  // ── Export / Save ──
  const handleSave = async () => {
    if (!image) return;
    setSaving(true);

    try {
      // Create final canvas with all transforms
      const isRotated90 = transform.rotation === 90 || transform.rotation === 270;
      const outW = isRotated90 ? image.naturalHeight : image.naturalWidth;
      const outH = isRotated90 ? image.naturalWidth : image.naturalHeight;

      // Limit max dimension
      const maxDim = 5000;
      const scale = Math.min(1, maxDim / outW, maxDim / outH);
      const finalW = Math.round(outW * scale);
      const finalH = Math.round(outH * scale);

      const offscreen = document.createElement('canvas');
      offscreen.width = finalW;
      offscreen.height = finalH;
      const ctx = offscreen.getContext('2d')!;

      ctx.translate(finalW / 2, finalH / 2);
      ctx.scale(scale, scale);
      ctx.rotate((transform.rotation * Math.PI) / 180);
      ctx.scale(transform.flipH ? -1 : 1, transform.flipV ? -1 : 1);

      const b = 1 + filters.brightness / 100;
      const c = 1 + filters.contrast / 100;
      const s = 1 + filters.saturation / 100;
      ctx.filter = `brightness(${b}) contrast(${c}) saturate(${s})`;

      ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

      const q = quality / 100;
      offscreen.toBlob(
        (blob) => {
          if (blob) {
            onSave(blob, outputFormat);
          }
          setSaving(false);
        },
        outputFormat,
        q,
      );
    } catch {
      setSaving(false);
    }
  };

  // ── Zoom controls ──
  const zoomIn = () => setZoom((z) => Math.min(10, z * 1.2));
  const zoomOut = () => setZoom((z) => Math.max(0.1, z * 0.8));
  const zoomFit = () => image && fitToContainer(image);

  // ── Render helpers ──
  const renderToolbar = () => (
    <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[var(--color-surface)] p-1.5 shadow-lg border border-[var(--color-border)]">
      {/* Mode tabs */}
      <div className="flex gap-0.5 mr-2 border-r border-[var(--color-border)] pr-2">
        {(['transform', 'crop', 'filters'] as EditorMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              if (m === 'crop' && !cropping) startCrop();
              if (m !== 'crop' && cropping) cancelCrop();
            }}
            className={`rounded px-2.5 py-1.5 text-xs font-medium transition ${
              mode === m
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-card)]'
            }`}
          >
            {m === 'transform' ? t('media.editor.transform', 'Transformer') :
             m === 'crop' ? t('media.editor.crop', 'Recadrer') :
             t('media.editor.filters', 'Filtres')}
          </button>
        ))}
      </div>

      {mode === 'transform' && (
        <>
          <ToolButton icon={<RotateCcw className="h-4 w-4" />} onClick={() => rotate('ccw')} title="Rotation -90°" />
          <ToolButton icon={<RotateCw className="h-4 w-4" />} onClick={() => rotate('cw')} title="Rotation +90°" />
          <ToolButton icon={<FlipHorizontal className="h-4 w-4" />} onClick={flipH} title="Miroir horizontal" active={transform.flipH} />
          <ToolButton icon={<FlipVertical className="h-4 w-4" />} onClick={flipV} title="Miroir vertical" active={transform.flipV} />
        </>
      )}

      {mode === 'crop' && cropping && (
        <>
          <div className="flex gap-0.5 mr-1">
            {CROP_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setCropRatio(preset.ratio);
                  if (cropRect && image && preset.ratio > 0) {
                    const newH = cropRect.width / preset.ratio;
                    setCropRect({ ...cropRect, height: Math.min(newH, image.naturalHeight - cropRect.y) });
                  }
                }}
                className={`rounded px-2 py-1 text-[10px] font-medium transition ${
                  cropRatio === preset.ratio
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-card)]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <ToolButton icon={<Check className="h-4 w-4" />} onClick={applyCrop} title="Appliquer" className="text-green-500" />
          <ToolButton icon={<X className="h-4 w-4" />} onClick={cancelCrop} title="Annuler" className="text-red-400" />
        </>
      )}

      {mode === 'filters' && (
        <div className="flex items-center gap-3 px-1">
          <FilterSlider
            icon={<Sun className="h-3.5 w-3.5" />}
            value={filters.brightness}
            onChange={(v) => setFilters((f) => ({ ...f, brightness: v }))}
            label={t('media.editor.brightness', 'Luminosité')}
          />
          <FilterSlider
            icon={<Contrast className="h-3.5 w-3.5" />}
            value={filters.contrast}
            onChange={(v) => setFilters((f) => ({ ...f, contrast: v }))}
            label={t('media.editor.contrast', 'Contraste')}
          />
          <FilterSlider
            icon={<Droplets className="h-3.5 w-3.5" />}
            value={filters.saturation}
            onChange={(v) => setFilters((f) => ({ ...f, saturation: v }))}
            label={t('media.editor.saturation', 'Saturation')}
          />
        </div>
      )}

      {/* Separator + zoom + actions */}
      <div className="ml-auto flex items-center gap-1 border-l border-[var(--color-border)] pl-2">
        <ToolButton icon={<ZoomOut className="h-4 w-4" />} onClick={zoomOut} title="Zoom -" />
        <span className="min-w-[40px] text-center text-[10px] font-medium text-[var(--color-text-secondary)]">{Math.round(zoom * 100)}%</span>
        <ToolButton icon={<ZoomIn className="h-4 w-4" />} onClick={zoomIn} title="Zoom +" />
        <ToolButton icon={<Maximize2 className="h-4 w-4" />} onClick={zoomFit} title="Ajuster" />
        <div className="w-px h-5 bg-[var(--color-border)] mx-1" />
        <ToolButton icon={<Undo2 className="h-4 w-4" />} onClick={resetAll} title="Réinitialiser" />
      </div>
    </div>
  );

  const renderBottomBar = () => (
    <div className="flex flex-col gap-2 rounded-lg bg-[var(--color-surface)] p-2 shadow-lg border border-[var(--color-border)]">
      {/* Format & quality row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex gap-0.5">
            {FORMAT_OPTIONS.map((fmt) => (
              <button
                key={fmt.value}
                type="button"
                onClick={() => setOutputFormat(fmt.value)}
                className={`rounded px-2 py-1 text-xs font-medium transition ${
                  outputFormat === fmt.value
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-card)]'
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
          {outputFormat !== 'image/png' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--color-text-secondary)]">Qualité</span>
              <input
                type="range"
                min={10}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="h-1 w-20 accent-[var(--color-primary)]"
              />
              <span className="text-[10px] font-medium text-[var(--color-text)]">{quality}%</span>
            </div>
          )}
        </div>
        {image && (
          <span className="text-[10px] text-[var(--color-text-secondary)] shrink-0">
            {image.naturalWidth} × {image.naturalHeight}
          </span>
        )}
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onCancel} size="sm" className="flex-1 sm:flex-none">
          {t('media.editor.cancel', 'Annuler')}
        </Button>
        <Button onClick={handleSave} size="sm" disabled={saving} className="flex-1 sm:flex-none">
          {saving ? (
            <span className="flex items-center justify-center gap-1">
              <Download className="h-3.5 w-3.5 animate-bounce" />
              {t('media.editor.saving', 'Enregistrement...')}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1">
              <Check className="h-3.5 w-3.5" />
              {t('media.editor.save', 'Enregistrer')}
            </span>
          )}
        </Button>
      </div>
    </div>
  );

  // ── Main render ──
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0f0f1a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <h3 className="text-sm font-semibold text-[var(--color-text)] truncate">
          {t('media.editor.title', 'Éditeur d\'image')}
          {filename && <span className="ml-2 text-xs font-normal text-[var(--color-text-secondary)]">— {filename}</span>}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] hover:text-[var(--color-text)] transition"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-2">
        {renderToolbar()}
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-crosshair"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
        />
      </div>

      {/* Bottom bar */}
      <div className="px-4 py-2 pb-20 sm:pb-2">
        {renderBottomBar()}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function ToolButton({
  icon,
  onClick,
  title,
  active,
  className = '',
}: {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded p-1.5 transition ${
        active
          ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
          : `text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-card)] ${className}`
      }`}
    >
      {icon}
    </button>
  );
}

function FilterSlider({
  icon,
  value,
  onChange,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5" title={label}>
      {icon}
      <input
        type="range"
        min={-100}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-16 accent-[var(--color-primary)]"
      />
      <span className="min-w-[28px] text-[10px] text-[var(--color-text-secondary)]">{value > 0 ? `+${value}` : value}</span>
    </div>
  );
}
