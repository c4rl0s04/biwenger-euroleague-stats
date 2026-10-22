import { expect, it } from 'vitest';
import { ApiError, responseError } from './api-error';
it('retains safe error text, code and validated conflict details', async () => {
  const error = await responseError(
    Response.json(
      {
        error: 'Plantilla cambiada',
        code: 'LINEUP_ROSTER_CHANGED',
        details: {
          invalidPlayerIds: ['7', {}],
          affectedSlotIndexes: [2, 99, '1'],
          token: 'canary',
        },
      },
      { status: 409 }
    )
  );
  expect(error).toBeInstanceOf(ApiError);
  expect(error.message).toBe('Plantilla cambiada');
  expect(error.details).toEqual({ invalidPlayerIds: ['7'], affectedSlotIndexes: [2] });
  expect(JSON.stringify(error)).not.toContain('canary');
});
it('handles HTML and empty error responses without exposing their body', async () => {
  const error = await responseError(
    new Response('<html>private-upstream-payload</html>', { status: 502 })
  );
  expect(error.status).toBe(502);
  expect(error.message).not.toContain('private-upstream');
});
