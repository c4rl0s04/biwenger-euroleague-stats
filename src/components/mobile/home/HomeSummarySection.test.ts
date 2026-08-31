import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('mobile home summary composition', () => {
  it('does not render or reserve space for page shortcut buttons', () => {
    const sectionSource = readFileSync(
      new URL('./HomeSummarySection.tsx', import.meta.url),
      'utf8'
    );
    const skeletonSource = readFileSync(new URL('./HomeSkeletons.tsx', import.meta.url), 'utf8');

    expect(sectionSource).not.toContain('HomeQuickActions');
    expect(skeletonSource).not.toContain('mobile-home-skeleton-actions');
  });
});
