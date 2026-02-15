import { useState, useRef, useCallback } from 'react';

interface PixelAvatarProps {
  /** Current avatar data URL. */
  value?: string;
  /** Called with the avatar image as a data URL. */
  onChange?: (dataUrl: string) => void;
  /** Pixel grid size — lower means more pixelated. */
  resolution?: number;
  /** Display size in pixels. */
  size?: number;
}

/**
 * Retro-styled pixel avatar uploader.
 *
 * Stores the original image (resized to a reasonable resolution) via onChange.
 * Displays a pixelated preview by default; reveals the original on hover.
 */
export default function PixelAvatar({
  value,
  onChange,
  resolution = 32,
  size = 96,
}: PixelAvatarProps) {
  const [original, setOriginal] = useState<string | undefined>(value);
  const [pixelated, setPixelated] = useState<string | undefined>(value);
  const [hovering, setHovering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          // Create original at display size (good quality for hover reveal)
          const orig = document.createElement('canvas');
          orig.width = size;
          orig.height = size;
          const oCtx = orig.getContext('2d');
          if (!oCtx) return;
          oCtx.imageSmoothingEnabled = true;
          oCtx.imageSmoothingQuality = 'high';
          oCtx.drawImage(img, 0, 0, size, size);
          const origUrl = orig.toDataURL('image/png');

          // Create pixelated version: downscale then upscale with nearest-neighbor
          const small = document.createElement('canvas');
          small.width = resolution;
          small.height = resolution;
          const sCtx = small.getContext('2d');
          if (!sCtx) return;
          sCtx.imageSmoothingEnabled = true;
          sCtx.drawImage(img, 0, 0, resolution, resolution);

          const big = document.createElement('canvas');
          big.width = size;
          big.height = size;
          const bCtx = big.getContext('2d');
          if (!bCtx) return;
          bCtx.imageSmoothingEnabled = false;
          bCtx.drawImage(small, 0, 0, size, size);
          const pixUrl = big.toDataURL('image/png');

          setOriginal(origUrl);
          setPixelated(pixUrl);
          onChange?.(origUrl);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    },
    [resolution, size, onChange],
  );

  function openFilePicker() {
    inputRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  }

  function handleRemove() {
    setOriginal(undefined);
    setPixelated(undefined);
    setHovering(false);
    onChange?.('');
    if (inputRef.current) inputRef.current.value = '';
  }

  const displaySrc = hovering && original ? original : pixelated;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.5rem' }}>
      {displaySrc ? (
        <div
          style={{
            width: size,
            height: size,
            border: '1px solid var(--border)',
            overflow: 'hidden',
            cursor: 'pointer',
          }}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          <img
            src={displaySrc}
            alt="avatar"
            width={size}
            height={size}
            style={{
              display: 'block',
              transition: 'filter 0.3s ease',
              filter: hovering ? 'none' : 'none',
            }}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={openFilePicker}
          style={{
            width: size,
            height: size,
            border: '1px solid var(--border)',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              color: 'var(--dim)',
              fontFamily: 'inherit',
              fontSize: '0.7rem',
              textAlign: 'center',
              lineHeight: 1.4,
              padding: '0.5rem',
            }}
          >
            [ click to{'\n'}upload avatar ]
          </span>
        </button>
      )}

      <div style={{ display: 'flex', gap: '0.25rem', width: size }}>
        {displaySrc && (
          <>
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
              [edit]
            </button>
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
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
