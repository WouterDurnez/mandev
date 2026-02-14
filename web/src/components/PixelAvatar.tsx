import { useState, useRef, useCallback } from 'react';

interface PixelAvatarProps {
  /** Current avatar data URL (base64 pixelated image). */
  value?: string;
  /** Called with the pixelated image as a data URL. */
  onChange?: (dataUrl: string) => void;
  /** Pixel grid size — lower means more pixelated. */
  resolution?: number;
  /** Display size in pixels. */
  size?: number;
}

/**
 * Retro-styled pixel avatar uploader.
 *
 * Accepts an image file, downscales it to a tiny resolution on a canvas,
 * then scales it back up with nearest-neighbor interpolation for a
 * chunky pixel-art look.
 */
export default function PixelAvatar({
  value,
  onChange,
  resolution = 16,
  size = 128,
}: PixelAvatarProps) {
  const [preview, setPreview] = useState<string | undefined>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const pixelate = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          // Downscale to tiny resolution
          const small = document.createElement('canvas');
          small.width = resolution;
          small.height = resolution;
          const sCtx = small.getContext('2d');
          if (!sCtx) return;
          sCtx.imageSmoothingEnabled = true;
          sCtx.drawImage(img, 0, 0, resolution, resolution);

          // Scale back up with nearest-neighbor
          const big = document.createElement('canvas');
          big.width = size;
          big.height = size;
          const bCtx = big.getContext('2d');
          if (!bCtx) return;
          bCtx.imageSmoothingEnabled = false;
          bCtx.drawImage(small, 0, 0, size, size);

          const dataUrl = big.toDataURL('image/png');
          setPreview(dataUrl);
          onChange?.(dataUrl);
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
    if (file) pixelate(file);
  }

  function handleRemove() {
    setPreview(undefined);
    onChange?.('');
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.5rem' }}>
      {preview ? (
        <div
          style={{
            width: size,
            height: size,
            border: '1px solid var(--border)',
            overflow: 'hidden',
            imageRendering: 'pixelated',
          }}
        >
          <img
            src={preview}
            alt="avatar"
            width={size}
            height={size}
            style={{ imageRendering: 'pixelated', display: 'block' }}
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
        {preview && (
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
                fontSize: '0.65rem',
                padding: '0.2rem 0.4rem',
                cursor: 'pointer',
              }}
            >
              [ CHANGE ]
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
                fontSize: '0.65rem',
                padding: '0.2rem 0.4rem',
                cursor: 'pointer',
              }}
            >
              [ REMOVE ]
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
