import { useState } from "react";
import { getBrandImage } from "../lib/brandImages";

interface BrandImageProps {
  imageKey: string;
  alt: string;
  fallbackGradient?: string;
  className?: string;
  height?: string;
  width?: number;
  children?: React.ReactNode;
}

export function BrandImage({
  imageKey,
  alt,
  fallbackGradient,
  className = "",
  height = "h-32",
  width = 720,
  children,
}: BrandImageProps) {
  const [errored, setErrored] = useState(false);
  const url = getBrandImage(imageKey, width);

  return (
    <div
      className={`relative w-full ${height} overflow-hidden ${className}`}
      style={errored && fallbackGradient ? { background: fallbackGradient } : undefined}
    >
      {!errored && (
        <img
          src={url}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setErrored(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {/* Subtle darken from bottom for legibility of overlaid text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent pointer-events-none" />
      {children && <div className="absolute inset-0">{children}</div>}
    </div>
  );
}
