'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';

export default function SettingsDropdown() {
  return (
    <Link
      href="/settings"
      className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      aria-label="Ajustes"
      title="Ajustes"
    >
      <Settings size={20} />
    </Link>
  );
}
