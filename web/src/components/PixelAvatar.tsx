import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { BrushTool, Dotting, type DottingRef, type PixelModifyItem } from 'dotting';

interface PixelAvatarProps {
  value?: string;
  onChange?: (dataUrl: string) => void;
  resolution?: number;
  size?: number;
}

const EDITOR_SIZE = 320;
const PIXEL_GRID = 24;
const DOTTING_SIZE = 216;
const PALETTE = ['#000000', '#ffffff', '#d7263d', '#f4d35e', '#3f88c5', '#1f9d55', '#9b5de5', '#ff9f1c'];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

async function makePixelated(src: string, size: number, resolution: number): Promise<string> {
  const img = await createImage(src);

  const small = document.createElement('canvas');
  small.width = resolution;
  small.height = resolution;
  const sctx = small.getContext('2d');
  if (!sctx) throw new Error('Unable to create canvas context');
  sctx.imageSmoothingEnabled = true;
  sctx.drawImage(img, 0, 0, resolution, resolution);

  const big = document.createElement('canvas');
  big.width = size;
  big.height = size;
  const bctx = big.getContext('2d');
  if (!bctx) throw new Error('Unable to create canvas context');
  bctx.imageSmoothingEnabled = false;
  bctx.drawImage(small, 0, 0, size, size);

  return big.toDataURL('image/png');
}

async function cropToDataUrl(src: string, cropAreaPixels: Area, outputSize: number): Promise<string> {
  const img = await createImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Unable to create canvas context');

  const sx = clamp(cropAreaPixels.x, 0, img.naturalWidth - 1);
  const sy = clamp(cropAreaPixels.y, 0, img.naturalHeight - 1);
  const sw = clamp(cropAreaPixels.width, 1, img.naturalWidth - sx);
  const sh = clamp(cropAreaPixels.height, 1, img.naturalHeight - sy);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, outputSize, outputSize);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outputSize, outputSize);

  return canvas.toDataURL('image/png');
}

async function imageToLayerData(src: string, grid = PIXEL_GRID): Promise<PixelModifyItem[][]> {
  const img = await createImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = grid;
  canvas.height = grid;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Unable to create canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, grid, grid);

  const data = ctx.getImageData(0, 0, grid, grid).data;
  const rows: PixelModifyItem[][] = [];

  for (let rowIndex = 0; rowIndex < grid; rowIndex += 1) {
    const row: PixelModifyItem[] = [];
    for (let columnIndex = 0; columnIndex < grid; columnIndex += 1) {
      const idx = (rowIndex * grid + columnIndex) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3] / 255;
      const color = a < 0.01 ? 'rgba(0,0,0,0)' : `rgba(${r},${g},${b},${a.toFixed(3)})`;
      row.push({ rowIndex, columnIndex, color });
    }
    rows.push(row);
  }

  return rows;
}

function layerDataToDataUrl(layerData: PixelModifyItem[][], outputSize: number): string {
  const grid = layerData.length || PIXEL_GRID;
  const scale = outputSize / grid;

  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Unable to create canvas context');

  ctx.clearRect(0, 0, outputSize, outputSize);
  for (const row of layerData) {
    for (const pixel of row) {
      if (!pixel || pixel.color === 'rgba(0,0,0,0)') continue;
      ctx.fillStyle = pixel.color;
      ctx.fillRect(pixel.columnIndex * scale, pixel.rowIndex * scale, scale, scale);
    }
  }

  return canvas.toDataURL('image/png');
}

function colorToHex(color: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '#ffffff';
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

export default function PixelAvatar({
  value,
  onChange,
  resolution = 24,
  size = 96,
}: PixelAvatarProps) {
  const [original, setOriginal] = useState<string | undefined>(value || undefined);
  const [pixelated, setPixelated] = useState<string | undefined>(value || undefined);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [draftOriginal, setDraftOriginal] = useState<string | null>(null);

  const [brushTool, setBrushTool] = useState<BrushTool>(BrushTool.DOT);
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [pickerActive, setPickerActive] = useState(false);
  const [layerData, setLayerData] = useState<PixelModifyItem[][] | null>(null);
  const [dottingKey, setDottingKey] = useState(0);
  const [hasPixelEdits, setHasPixelEdits] = useState(false);
  const [pixelPreviewSrc, setPixelPreviewSrc] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dottingRef = useRef<DottingRef | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!value) {
      setOriginal(undefined);
      setPixelated(undefined);
      return;
    }

    setOriginal(value);
    makePixelated(value, size, resolution)
      .then((pix) => {
        if (!cancelled) setPixelated(pix);
      })
      .catch(() => {
        if (!cancelled) setPixelated(value);
      });

    return () => {
      cancelled = true;
    };
  }, [value, size, resolution]);

  useEffect(() => {
    if (!isModalOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleCloseModal();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen]);

  useEffect(() => {
    let cancelled = false;

    async function renderCropDraft() {
      if (!sourceUrl || !croppedAreaPixels) return;

      try {
        const out = await cropToDataUrl(sourceUrl, croppedAreaPixels, size);
        if (!cancelled) setDraftOriginal(out);
      } catch {
        if (!cancelled) setError('Failed to crop image.');
      }
    }

    renderCropDraft();
    return () => {
      cancelled = true;
    };
  }, [sourceUrl, croppedAreaPixels, size]);

  useEffect(() => {
    let cancelled = false;

    async function syncFromDraft() {
      if (!draftOriginal || hasPixelEdits) return;
      try {
        const rows = await imageToLayerData(draftOriginal, PIXEL_GRID);
        if (!cancelled) {
          setLayerData(rows);
          setDottingKey((n) => n + 1);
        }
      } catch {
        if (!cancelled) setError('Failed to sync crop to pixel editor.');
      }
    }

    syncFromDraft();
    return () => {
      cancelled = true;
    };
  }, [draftOriginal, hasPixelEdits]);

  useEffect(() => {
    const editor = dottingRef.current;
    if (!editor) return;

    const syncPreview = () => {
      const firstLayer = editor.getLayersAsArray()?.[0]?.data;
      if (!firstLayer) return;
      setPixelPreviewSrc(layerDataToDataUrl(firstLayer, size));
    };

    const onDataChange = () => {
      setHasPixelEdits(true);
      syncPreview();
    };
    const onStrokeEnd = () => {
      setHasPixelEdits(true);
      syncPreview();
    };

    syncPreview();
    editor.addDataChangeListener(onDataChange);
    editor.addStrokeEndListener(onStrokeEnd);
    return () => {
      editor.removeDataChangeListener(onDataChange);
      editor.removeStrokeEndListener(onStrokeEnd);
    };
  }, [dottingKey, size]);

  useEffect(() => {
    if (!layerData) return;
    try {
      setPixelPreviewSrc(layerDataToDataUrl(layerData, size));
    } catch {
      // Keep prior preview on conversion issues.
    }
  }, [layerData, size]);

  const dottingInitLayers = useMemo(
    () => (layerData ? [{ id: 'layer1', data: layerData }] : undefined),
    [layerData],
  );

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const startEditingFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSourceUrl(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setDraftOriginal(null);
      setLayerData(null);
      setDottingKey(0);
      setHasPixelEdits(false);
      setPixelPreviewSrc(null);
      setPickerActive(false);
      setBrushTool(BrushTool.DOT);
      setIsModalOpen(true);
      setError(null);
    };
    reader.onerror = () => setError('Failed to read image.');
    reader.readAsDataURL(file);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    startEditingFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) startEditingFile(file);
  }

  function handleRemove() {
    setOriginal(undefined);
    setPixelated(undefined);
    setDraftOriginal(null);
    setSourceUrl(null);
    setError(null);
    onChange?.('');
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setSourceUrl(null);
    setCroppedAreaPixels(null);
    setDraftOriginal(null);
    setLayerData(null);
    setHasPixelEdits(false);
    setPixelPreviewSrc(null);
    setPickerActive(false);
  }

  async function handleSyncFromCrop() {
    if (!draftOriginal) return;
    try {
      const rows = await imageToLayerData(draftOriginal, PIXEL_GRID);
      setLayerData(rows);
      setDottingKey((n) => n + 1);
      setHasPixelEdits(false);
      setPixelPreviewSrc(layerDataToDataUrl(rows, size));
    } catch {
      setError('Failed to sync crop to pixel editor.');
    }
  }

  async function handleSaveAvatar() {
    let savedOriginal = draftOriginal;

    const layers = dottingRef.current?.getLayersAsArray();
    const firstLayer = layers?.[0]?.data;
    if (firstLayer) {
      savedOriginal = layerDataToDataUrl(firstLayer, size);
    }

    if (!savedOriginal) return;

    setOriginal(savedOriginal);
    try {
      const pix = await makePixelated(savedOriginal, size, resolution);
      setPixelated(pix);
    } catch {
      setPixelated(savedOriginal);
    }

    onChange?.(savedOriginal);
    handleCloseModal();
  }

  function pickColorAtClient(wrapper: HTMLDivElement, clientX: number, clientY: number) {
    const rect = wrapper.getBoundingClientRect();
    const col = clamp(Math.floor(((clientX - rect.left) / rect.width) * PIXEL_GRID), 0, PIXEL_GRID - 1);
    const row = clamp(Math.floor(((clientY - rect.top) / rect.height) * PIXEL_GRID), 0, PIXEL_GRID - 1);

    const layers = dottingRef.current?.getLayersAsArray();
    const color = layers?.[0]?.data?.[row]?.[col]?.color;
    if (color) {
      setBrushColor(colorToHex(color));
      setBrushTool(BrushTool.DOT);
    }
  }

  function handlePickColorAtPointer(e: React.PointerEvent<HTMLDivElement>) {
    if (!pickerActive) return;
    e.preventDefault();
    e.stopPropagation();

    pickColorAtClient(e.currentTarget, e.clientX, e.clientY);
    setPickerActive(false);
  }

  function handleContextPick(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    pickColorAtClient(e.currentTarget, e.clientX, e.clientY);
  }

  const displaySrc = pixelated || original;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.5rem' }}>
      <button
        type="button"
        onClick={openFilePicker}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          width: size,
          height: size,
          border: `1px solid ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
          background: 'transparent',
          cursor: 'pointer',
          padding: 0,
          overflow: 'hidden',
          textAlign: 'center',
        }}
      >
        {displaySrc ? (
          <img
            src={displaySrc}
            alt="avatar"
            width={size}
            height={size}
            style={{ display: 'block', imageRendering: 'pixelated' }}
          />
        ) : (
          <span
            style={{
              color: 'var(--dim)',
              fontFamily: 'inherit',
              fontSize: '0.65rem',
              lineHeight: 1.35,
              display: 'inline-block',
              padding: '0.7rem 0.5rem',
            }}
          >
            [ drag/drop or{'\n'}click avatar ]
          </span>
        )}
      </button>

      <div style={{ display: 'flex', gap: '0.25rem', width: size }}>
        <button
          type="button"
          onClick={openFilePicker}
          style={{
            flex: 1,
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--dim)',
            fontFamily: 'inherit',
            fontSize: '0.6rem',
            padding: '0.15rem 0.2rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          [{displaySrc ? 'change' : 'upload'}]
        </button>
        {displaySrc && (
          <button
            type="button"
            onClick={handleRemove}
            style={{
              flex: 1,
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--dim)',
              fontFamily: 'inherit',
              fontSize: '0.6rem',
              padding: '0.15rem 0.2rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            [rm]
          </button>
        )}
      </div>

      {error && <span style={{ color: 'var(--accent)', fontSize: '0.65rem' }}>{error}</span>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.72)',
            zIndex: 60,
            display: 'grid',
            placeItems: 'center',
            padding: '1rem',
          }}
          onClick={handleCloseModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(900px, 100%)',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              padding: '1rem',
              display: 'grid',
              gap: '0.9rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.8rem' }}>avatar editor</strong>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--dim)',
                  fontFamily: 'inherit',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                }}
              >
                [x]
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div style={{ display: 'grid', gap: '0.45rem', justifyItems: 'center' }}>
                <div
                  style={{
                    width: EDITOR_SIZE,
                    height: EDITOR_SIZE,
                    border: '1px solid var(--border)',
                    position: 'relative',
                    overflow: 'hidden',
                    background: '#0f1014',
                  }}
                >
                  {sourceUrl && (
                    <Cropper
                      image={sourceUrl}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      minZoom={1}
                      maxZoom={4}
                      zoomWithScroll
                      showGrid
                      cropShape="rect"
                      objectFit="cover"
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                    />
                  )}
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--dim)' }}>
                  Crop: drag image + scroll/pinch to zoom.
                </span>
              </div>

              <div style={{ display: 'grid', gap: '0.45rem', justifyItems: 'center' }}>
                <div style={{ display: 'flex', width: DOTTING_SIZE, justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setBrushTool(BrushTool.DOT);
                        setPickerActive(false);
                      }}
                      style={{ border: '1px solid var(--border)', background: 'transparent', color: !pickerActive && brushTool === BrushTool.DOT ? 'var(--accent)' : 'var(--dim)', fontFamily: 'inherit', fontSize: '0.65rem', cursor: 'pointer' }}
                    >
                      [pen]
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBrushTool(BrushTool.ERASER);
                        setPickerActive(false);
                      }}
                      style={{ border: '1px solid var(--border)', background: 'transparent', color: !pickerActive && brushTool === BrushTool.ERASER ? 'var(--accent)' : 'var(--dim)', fontFamily: 'inherit', fontSize: '0.65rem', cursor: 'pointer' }}
                    >
                      [eraser]
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickerActive((v) => !v)}
                      style={{ border: '1px solid var(--border)', background: 'transparent', color: pickerActive ? 'var(--accent)' : 'var(--dim)', fontFamily: 'inherit', fontSize: '0.65rem', cursor: 'pointer' }}
                    >
                      [picker]
                    </button>
                  </div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--dim)', fontSize: '0.68rem' }}>
                    <input
                      type="color"
                      value={brushColor}
                      onChange={(e) => {
                        setBrushColor(e.target.value);
                        setPickerActive(false);
                      }}
                      style={{ width: 22, height: 18, padding: 0, border: '1px solid var(--border)', background: 'transparent' }}
                    />
                  </label>
                </div>

                <div style={{ display: 'flex', width: DOTTING_SIZE, gap: '0.2rem', flexWrap: 'wrap' }}>
                  {PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setBrushColor(color);
                        setPickerActive(false);
                      }}
                      style={{ width: 16, height: 16, border: brushColor.toLowerCase() === color.toLowerCase() ? '1px solid var(--accent)' : '1px solid var(--border)', background: color, cursor: 'pointer', padding: 0 }}
                    />
                  ))}
                </div>

                <div style={{ display: 'flex', width: DOTTING_SIZE, justifyContent: 'space-between' }}>
                  <button
                    type="button"
                    onClick={() => dottingRef.current?.undo()}
                    style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--dim)', fontFamily: 'inherit', fontSize: '0.65rem', cursor: 'pointer' }}
                  >
                    [undo]
                  </button>
                  <button
                    type="button"
                    onClick={() => dottingRef.current?.redo()}
                    style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--dim)', fontFamily: 'inherit', fontSize: '0.65rem', cursor: 'pointer' }}
                  >
                    [redo]
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncFromCrop}
                    disabled={!draftOriginal}
                    style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--dim)', fontFamily: 'inherit', fontSize: '0.65rem', cursor: draftOriginal ? 'pointer' : 'not-allowed', opacity: draftOriginal ? 1 : 0.5 }}
                  >
                    [sync crop]
                  </button>
                </div>

                <div
                  onPointerDownCapture={handlePickColorAtPointer}
                  onContextMenu={handleContextPick}
                  style={{ width: DOTTING_SIZE, height: DOTTING_SIZE, position: 'relative' }}
                >
                  {dottingInitLayers && (
                    <Dotting
                      key={dottingKey}
                      ref={dottingRef}
                      width={DOTTING_SIZE}
                      height={DOTTING_SIZE}
                      initLayers={dottingInitLayers}
                      isPanZoomable={false}
                      isGridFixed
                      isGridVisible
                      gridSquareLength={DOTTING_SIZE / PIXEL_GRID}
                      brushTool={pickerActive ? BrushTool.NONE : brushTool}
                      brushColor={brushColor}
                      minRowCount={PIXEL_GRID}
                      maxRowCount={PIXEL_GRID}
                      minColumnCount={PIXEL_GRID}
                      maxColumnCount={PIXEL_GRID}
                      backgroundColor="#0f1014"
                      style={{ border: '1px solid var(--border)' }}
                    />
                  )}
                </div>

                <span style={{ fontSize: '0.64rem', color: 'var(--dim)' }}>
                  Pixel edit ({PIXEL_GRID}x{PIXEL_GRID}). {pickerActive ? 'Click a pixel to pick color.' : 'Draw on pixels directly. Right-click picks color temporarily.'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'grid', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.64rem', color: 'var(--dim)' }}>Before (crop)</span>
                <div style={{ width: 64, height: 64, border: '1px solid var(--border)', overflow: 'hidden' }}>
                  {draftOriginal && (
                    <img
                      src={draftOriginal}
                      alt="before preview"
                      width={64}
                      height={64}
                      style={{ display: 'block', imageRendering: 'pixelated' }}
                    />
                  )}
                </div>
              </div>
              <div style={{ display: 'grid', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.64rem', color: 'var(--dim)' }}>After (pixel edit)</span>
                <div style={{ width: 64, height: 64, border: '1px solid var(--border)', overflow: 'hidden' }}>
                  {(pixelPreviewSrc || draftOriginal) && (
                    <img
                      src={pixelPreviewSrc || draftOriginal || undefined}
                      alt="after preview"
                      width={64}
                      height={64}
                      style={{ display: 'block', imageRendering: 'pixelated' }}
                    />
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--dim)',
                  fontFamily: 'inherit',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  padding: '0.2rem 0.45rem',
                }}
              >
                [cancel]
              </button>
              <button
                type="button"
                onClick={handleSaveAvatar}
                disabled={!draftOriginal}
                style={{
                  border: '1px solid var(--accent)',
                  background: 'transparent',
                  color: 'var(--accent)',
                  fontFamily: 'inherit',
                  fontSize: '0.7rem',
                  cursor: draftOriginal ? 'pointer' : 'not-allowed',
                  padding: '0.2rem 0.45rem',
                  opacity: draftOriginal ? 1 : 0.5,
                }}
              >
                [save]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
