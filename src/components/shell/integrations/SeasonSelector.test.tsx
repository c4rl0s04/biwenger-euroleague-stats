import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockSeasonState = {
  seasons: [] as Array<{ id: string; name: string }>,
  currentSeasonId: '2025-26',
  activeSeasonId: '2025-26',
  isCustomSeason: false,
  selectSeason: vi.fn(),
};

vi.mock('@/contexts/SeasonContext', () => ({
  useSeason: () => mockSeasonState,
}));

import { SeasonSelector } from './SeasonSelector';

describe('SeasonSelector', () => {
  beforeEach(() => {
    mockSeasonState = {
      seasons: [
        { id: '2025-26', name: 'Temporada 2025-26' },
        { id: '2024-25', name: 'Temporada 2024-25' },
      ],
      currentSeasonId: '2025-26',
      activeSeasonId: '2025-26',
      isCustomSeason: false,
      selectSeason: vi.fn(),
    };
  });

  it('renders nothing when there is only one season or no seasons', () => {
    mockSeasonState.seasons = [{ id: '2025-26', name: 'Temporada 2025-26' }];
    const html = renderToStaticMarkup(<SeasonSelector />);
    expect(html).toBe('');
  });

  it('renders season selector trigger with formatted short season label', () => {
    const html = renderToStaticMarkup(<SeasonSelector />);
    expect(html).toContain('aria-label="Abrir selector de temporada"');
    expect(html).toContain('aria-haspopup="true"');
    expect(html).toContain('25/26');
  });

  it('renders "Histórico" badge when viewing a previous custom season', () => {
    mockSeasonState.isCustomSeason = true;
    mockSeasonState.currentSeasonId = '2024-25';

    const html = renderToStaticMarkup(<SeasonSelector />);
    expect(html).toContain('24/25');
    expect(html).toContain('Histórico');
  });

  it('keeps dropdown rows minimal without redundant emoji status copy', () => {
    const source = readFileSync(new URL('./SeasonSelector.tsx', import.meta.url), 'utf8');

    expect(source).not.toContain('🟢');
    expect(source).not.toContain('❄️');
    expect(source).not.toContain('Temporada en curso');
    expect(source).not.toContain('Temporada finalizada');
  });

  it('supports left-aligned mobile menus while keeping right alignment as the default', () => {
    const source = readFileSync(new URL('./SeasonSelector.tsx', import.meta.url), 'utf8');

    expect(source).toContain("menuAlign?: 'left' | 'right'");
    expect(source).toContain("menuAlign = 'right'");
    expect(source).toContain('left-0 w-[min(16rem,calc(100vw-7rem))]');
    expect(source).toContain('right-0 w-64');
  });
});
