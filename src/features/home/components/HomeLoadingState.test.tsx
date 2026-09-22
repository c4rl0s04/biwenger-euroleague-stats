import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { HomeFeedSkeleton } from './HomeSkeletons';
import MobileActivityFeed from './MobileActivityFeed';
import MobileHomeActivityProvider from './MobileHomeActivityProvider';

describe('mobile home loading state', () => {
  it('does not apply the live status dot to the activity skeleton', () => {
    const html = renderToStaticMarkup(<HomeFeedSkeleton />);
    const css = readFileSync(new URL('../../../app/mobile-native.css', import.meta.url), 'utf8');

    expect(html).not.toContain('mobile-home-feed-live-state');
    expect(css).not.toMatch(/\.mobile-home-feed-heading\s*>\s*span::before/);
    expect(css).toContain('.mobile-home-feed-live-state.is-live::before');
  });

  it('does not mark an empty or loading feed as live', () => {
    const html = renderToStaticMarkup(
      <MobileHomeActivityProvider initialFilter="all">
        <MobileActivityFeed
          initialFilter="all"
          initialPage={{ items: [], nextCursor: null, hasMore: false }}
        />
      </MobileHomeActivityProvider>
    );

    expect(html).toContain('Sin estrenar');
    expect(html).not.toContain('mobile-home-feed-live-state is-live');
  });
});
