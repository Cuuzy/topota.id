import React, { useState } from "react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export default function LazyImage({
  src,
  alt,
  className = "",
  containerClassName = "",
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-neutral-100 ${containerClassName}`}>
      {/* Animated Skeleton Shimmer / Loader */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-neutral-100 animate-pulse flex items-center justify-center z-10">
          <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Fallback state on error */}
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-50 text-neutral-400 p-4 text-center border border-neutral-100">
          <span className="text-[10px] font-bold uppercase tracking-wider">Gambar Tidak Tersedia</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`${className} transition-all duration-700 ease-out ${
            isLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-105 blur-sm"
          }`}
        />
      )}
    </div>
  );
}
