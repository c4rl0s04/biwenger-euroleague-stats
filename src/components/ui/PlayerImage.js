'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';

export default function PlayerImage({
  src,
  alt,
  width,
  height,
  className,
  fallbackSize = 32,
  iconClassName = 'text-zinc-500',
  bgClassName = 'bg-zinc-800',
}) {
  const [error, setError] = useState(false);
  const [lastSrc, setLastSrc] = useState(src);

  if (src !== lastSrc) {
    setLastSrc(src);
    setError(false);
  }

  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center ${bgClassName} ${className}`}
        style={{ width: '100%', height: '100%' }}
      >
        <User size={fallbackSize} className={iconClassName} />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt || 'Player image'}
      width={width}
      height={height}
      className={className}
      onError={() => setError(true)}
    />
  );
}
