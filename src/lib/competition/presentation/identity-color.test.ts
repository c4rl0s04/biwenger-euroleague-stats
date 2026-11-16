import { expect, it } from 'vitest';
import { getManagerTextColor } from './identity-color';
import { getColorForUser } from './colors';
it('retains the identity hue and uses semantic content contrast independently of metric colors', () => {
  const hue = getColorForUser(0, 'Manager', 1).stroke;
  expect(getManagerTextColor(0, 'Manager', 1)).toBe(
    `color-mix(in srgb, ${hue} 55%, hsl(var(--content-primary)))`
  );
  expect(getManagerTextColor(null, null)).not.toContain('undefined');
});
