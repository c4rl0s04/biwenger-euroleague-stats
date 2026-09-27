import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ThemePreference, ResolvedTheme } from '@/contexts/ThemeContext';
import { ThemePreferenceControl } from './ThemePreferenceControl';

const state = {
  theme: 'dark' as ThemePreference,
  resolvedTheme: 'dark' as ResolvedTheme,
  setTheme: vi.fn(),
};
vi.mock('@/contexts/ThemeContext', () => ({ useTheme: () => state }));

function renderControl() {
  let tree!: ReturnType<typeof ThemePreferenceControl>;
  function Probe() {
    tree = ThemePreferenceControl();
    return tree;
  }
  const html = renderToStaticMarkup(<Probe />);
  return { html, labels: tree.props.children[1].props.children };
}

describe('ThemePreferenceControl', () => {
  beforeEach(() => {
    state.theme = 'dark';
    state.resolvedTheme = 'dark';
    state.setTheme.mockClear();
  });

  it.each(['system', 'dark', 'light'] as const)(
    'selects stored %s and invokes its setter',
    (theme) => {
      state.theme = theme;
      const { html, labels } = renderControl();
      expect(html).toContain('<fieldset');
      expect(html).toContain('>Tema</legend>');
      expect(html.match(/type="radio"/g)).toHaveLength(3);
      expect(html.match(/checked=""/g)).toHaveLength(1);
      expect(html).toMatch(new RegExp(`checked="" value="${theme}"`));
      for (const label of labels) {
        const radio = label.props.children[0];
        expect(radio.props.checked).toBe(radio.props.value === theme);
        radio.props.onChange();
        expect(state.setTheme).toHaveBeenLastCalledWith(radio.props.value);
      }
      expect(state.setTheme).toHaveBeenCalledTimes(3);
    }
  );

  it.each(['dark', 'light'] as const)(
    'describes resolved %s without selecting it over system',
    (resolved) => {
      state.theme = 'system';
      state.resolvedTheme = resolved;
      const { html } = renderControl();
      expect(html).toMatch(/checked="" value="system"/);
      expect(html).toContain(`ahora se usa el tema ${resolved === 'dark' ? 'oscuro' : 'claro'}.`);
      expect(state.setTheme).not.toHaveBeenCalled();
    }
  );
});
