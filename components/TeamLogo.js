'use client';

import { useState, useEffect } from 'react';

/**
 * TeamLogo component handles loading external team logos (e.g., from Liquipedia).
 * It automatically uses `referrerPolicy="no-referrer"` to bypass hotlink protection/403 blocks.
 * If the primary logo fails to load (e.g., 404/403), it falls back to the local/CDN logo URL.
 * If that fallback also fails, it hides the image gracefully to avoid showing a broken image icon.
 */
export default function TeamLogo({
  src,
  fallbackSrc,
  alt = '',
  style = {},
  className = '',
  ...props
}) {
  // We determine the initial source. If both are present, try `src` first.
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc || '');
  const [hasFailedPrimary, setHasFailedPrimary] = useState(false);

  // Sync state if props change (e.g., when navigation happens and new data is loaded)
  useEffect(() => {
    setCurrentSrc(src || fallbackSrc || '');
    setHasFailedPrimary(false);
  }, [src, fallbackSrc]);

  if (!currentSrc) return null;

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={{
        ...style,
        // Ensure image-rendering looks consistent even during error fallback transition
        display: currentSrc ? (style.display || 'inline-block') : 'none',
      }}
      referrerPolicy="no-referrer"
      onError={() => {
        // If we are currently trying the primary `src` and it fails, attempt `fallbackSrc`
        if (!hasFailedPrimary && fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
          setHasFailedPrimary(true);
        } else {
          // If the fallback also fails or wasn't provided, clear the source to hide the broken icon
          setCurrentSrc('');
        }
      }}
      {...props}
    />
  );
}
