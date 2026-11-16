import { getColorForUser } from './colors';

/** Preserve identity hue while mixing toward the current theme's legible content color. */
export function getManagerTextColor(
  id: string | number | null | undefined,
  name: string | null | undefined,
  colorIndex?: number | null
) {
  return `color-mix(in srgb, ${getColorForUser(id, name, colorIndex).stroke} 55%, hsl(var(--content-primary)))`;
}
