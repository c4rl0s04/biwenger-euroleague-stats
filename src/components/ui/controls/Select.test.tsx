import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { Select } from './Select';
import CustomSelect from '../CustomSelect';
import { nextSelectIndex } from './useSelect';
const options = [
  { value: 7, label: 'Jornada 7' },
  { value: 8, label: 'Jornada 8', disabled: true },
  { value: 9, label: 'Jornada 9' },
];
it('wraps keyboard navigation and skips disabled options in either direction', () => {
  expect(nextSelectIndex(options, 0, 1)).toBe(2);
  expect(nextSelectIndex(options, 0, -1)).toBe(2);
  expect(nextSelectIndex(options, 2, 1)).toBe(0);
  expect(nextSelectIndex([], 0, 1)).toBe(-1);
  expect(nextSelectIndex([{ ...options[0], disabled: true }], 0, 1)).toBe(-1);
});
it('renders a labelled foundation trigger retaining numeric selection and empty disabling', () => {
  const html = renderToStaticMarkup(
    <Select label="Jornada" options={options} value={7} onChange={vi.fn()} />
  );
  expect(html).toContain('Jornada 7');
  expect(html).toContain('aria-haspopup="listbox"');
  expect(
    renderToStaticMarkup(<Select label="Jornada" options={[]} onChange={vi.fn()} />)
  ).toContain('disabled');
});
it('keeps the existing default CustomSelect appearance and selected label', () => {
  const html = renderToStaticMarkup(
    <CustomSelect options={options} value={7} onChange={vi.fn()} />
  );
  expect(html).toContain('h-[38px]');
  expect(html).toContain('Jornada 7');
  expect(html).toContain('bg-secondary/50');
  expect(html).not.toContain('role="listbox"');
});
