"use client";

import { useEffect, useRef } from "react";

/**
 * Renders `src` as a true pixel-art image: draws it into a low-resolution
 * canvas (object-fit: cover cropped to match the container), then lets the
 * browser upscale that with nearest-neighbor sampling (`image-rendering:
 * pixelated`) so blocks stay crisp instead of blurring.
 *
 * `blockSize` is roughly the on-screen size (in px) of each pixel block —
 * smaller number = bigger/blockier pixels, larger number = finer detail.
 */
export default function PixelatedImage({
  src,
  alt,
  className,
  blockSize = 10
}: {
  src: string;
  alt: string;
  className?: string;
  blockSize?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !src) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cancelled = false;
    const img = new Image();

    function draw() {
      if (cancelled || !canvas || !ctx) return;
      const parent = canvas.parentElement;
      const rect = parent?.getBoundingClientRect();
      const containerW = rect?.width || canvas.clientWidth || 800;
      const containerH = rect?.height || canvas.clientHeight || 400;
      if (!containerW || !containerH) return;

      // Internal (low) resolution — this is what actually creates the
      // blocky look once CSS scales it back up to full container size.
      const lowW = Math.max(8, Math.round(containerW / blockSize));
      const lowH = Math.max(8, Math.round(containerH / blockSize));
      canvas.width = lowW;
      canvas.height = lowH;

      // Replicate object-fit: cover — crop the source image to the
      // container's aspect ratio before downsampling, so the pixelated
      // result frames the same way a normal <img> would.
      const srcRatio = img.naturalWidth / img.naturalHeight;
      const dstRatio = lowW / lowH;
      let sx = 0,
        sy = 0,
        sw = img.naturalWidth,
        sh = img.naturalHeight;
      if (srcRatio > dstRatio) {
        sw = img.naturalHeight * dstRatio;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        sh = img.naturalWidth / dstRatio;
        sy = (img.naturalHeight - sh) / 2;
      }

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, lowW, lowH);
    }

    img.onload = draw;
    img.src = src;

    const observer = new ResizeObserver(() => draw());
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [src, blockSize]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={alt}
      className={className}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
