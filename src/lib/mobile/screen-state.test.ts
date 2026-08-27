import { describe, expect, it } from 'vitest';

import { createMobileScreenState } from './screen-state';

describe('createMobileScreenState', () => {
  it('represents available serializable data as ready', () => {
    expect(createMobileScreenState({ total: 7 })).toEqual({
      data: { total: 7 },
      status: 'ready',
    });
  });

  it.each([null, [], ''])('represents empty results without treating them as errors', (data) => {
    expect(createMobileScreenState(data).status).toBe('empty');
  });

  it('exposes a safe retry message when a loader fails', () => {
    expect(createMobileScreenState(null, new Error('database password leaked'))).toEqual({
      data: null,
      status: 'error',
      errorMessage: 'No hemos podido cargar esta pantalla. Inténtalo de nuevo.',
    });
  });
});
