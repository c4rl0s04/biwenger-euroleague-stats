'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ label = 'Volver', className = '', iconSize = 16, href }) {
  const router = useRouter();

  const styles = `inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer ${className}`;

  if (href) {
    return (
      <Link href={href} className={styles} aria-label="Go back">
        <ArrowLeft size={iconSize} />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button onClick={() => router.back()} className={styles} aria-label="Go back">
      <ArrowLeft size={iconSize} />
      <span>{label}</span>
    </button>
  );
}
