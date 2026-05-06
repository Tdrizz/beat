import { useState } from "react";
import { getBrandLogo, getBrandInitials } from "../lib/brandLogos";

interface BrandLogoProps {
  name: string;
  size?: number;
  className?: string;
  rounded?: "full" | "lg" | "md";
}

export function BrandLogo({ name, size = 40, className = "", rounded = "lg" }: BrandLogoProps) {
  const [errored, setErrored] = useState(false);
  const url = getBrandLogo(name);
  const radius = rounded === "full" ? "rounded-full" : rounded === "md" ? "rounded-md" : "rounded-lg";
  const showImage = url && !errored;

  return (
    <div
      className={`${radius} ${className} shrink-0 bg-white border border-border shadow-sm overflow-hidden flex items-center justify-center`}
      style={{ width: size, height: size }}
      aria-label={`${name} logo`}
    >
      {showImage ? (
        <img
          src={url}
          alt={`${name} logo`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setErrored(true)}
          className="w-full h-full object-contain p-1"
        />
      ) : (
        <span
          className="font-serif font-bold text-foreground/80 select-none"
          style={{ fontSize: Math.max(10, Math.round(size * 0.38)) }}
        >
          {getBrandInitials(name)}
        </span>
      )}
    </div>
  );
}
