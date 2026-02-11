"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
  fallbackSrc?: string;
  showLoader?: boolean;
  loaderClassName?: string;
}

export default function OptimizedImage({
  src,
  alt,
  className,
  fallbackSrc,
  showLoader = true,
  loaderClassName,
  priority = false,
  loading,
  fill,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const imageSrc = error && fallbackSrc ? fallbackSrc : src;

  return (
    <div className={cn("relative", fill ? "w-full h-full" : undefined)}>
      {isLoading && showLoader && (
        <div
          className={cn(
            "absolute inset-0 bg-muted animate-pulse rounded-lg",
            loaderClassName
          )}
        />
      )}
      <Image
        src={imageSrc}
        alt={alt}
        fill={fill}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setError(true);
          setIsLoading(false);
        }}
        priority={priority}
        loading={priority ? undefined : (loading || "lazy")}
        quality={85}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        {...props}
      />
    </div>
  );
}
