'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ label = 'Volver', className = '', iconSize = 16 }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className={`inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft size={iconSize} />
      <span>{label}</span>
    </button>
  );
}
