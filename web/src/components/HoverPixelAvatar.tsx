import { useEffect, useState } from 'react';

interface HoverPixelAvatarProps {
  src: string;
  alt: string;
  size?: number;
  resolution?: number;
  className?: string;
}

function makePixelated(src: string, size: number, resolution: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const small = document.createElement('canvas');
      small.width = resolution;
      small.height = resolution;
      const sctx = small.getContext('2d');
      if (!sctx) {
        reject(new Error('Unable to create canvas context'));
        return;
      }

      sctx.imageSmoothingEnabled = true;
      sctx.drawImage(img, 0, 0, resolution, resolution);

      const big = document.createElement('canvas');
      big.width = size;
      big.height = size;
      const bctx = big.getContext('2d');
      if (!bctx) {
        reject(new Error('Unable to create canvas context'));
        return;
      }

      bctx.imageSmoothingEnabled = false;
      bctx.drawImage(small, 0, 0, size, size);
      resolve(big.toDataURL('image/png'));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

export default function HoverPixelAvatar({
  src,
  alt,
  size = 96,
  resolution = 24,
  className,
}: HoverPixelAvatarProps) {
  const [pixelatedSrc, setPixelatedSrc] = useState(src);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    let cancelled = false;

    makePixelated(src, size, resolution)
      .then((result) => {
        if (!cancelled) setPixelatedSrc(result);
      })
      .catch(() => {
        if (!cancelled) setPixelatedSrc(src);
      });

    return () => {
      cancelled = true;
    };
  }, [src, size, resolution]);

  const shownSrc = hovering ? src : pixelatedSrc;

  return (
    <div
      className={className}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        width: size,
        height: size,
        border: '1px solid var(--border)',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <img
        src={shownSrc}
        alt={alt}
        width={size}
        height={size}
        style={{
          display: 'block',
          width: size,
          height: size,
          imageRendering: hovering ? 'auto' : 'pixelated',
          transition: '120ms linear',
        }}
      />
    </div>
  );
}
