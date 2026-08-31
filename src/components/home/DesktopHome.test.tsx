import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('desktop home presentation', () => {
  it('owns its interactive card icons inside the client boundary', () => {
    const clientSource = readFileSync(new URL('./DesktopHome.jsx', import.meta.url), 'utf8');
    const pageSource = readFileSync(new URL('../../app/(app)/page.js', import.meta.url), 'utf8');

    expect(clientSource.trimStart()).toMatch(/^['"]use client['"]/);
    expect(clientSource).toContain("from 'lucide-react'");
    expect(clientSource).toContain('icon={Icon}');
    expect(pageSource).toContain("import DesktopHome from '@/components/home/DesktopHome'");
    expect(pageSource).not.toContain("from 'lucide-react'");
  });
});
