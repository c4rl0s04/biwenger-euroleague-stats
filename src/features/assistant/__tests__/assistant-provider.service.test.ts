import { afterEach, expect, it, vi } from 'vitest';
import { AssistantProviderService } from '../server/services/assistant-provider.service';

const { create } = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('openai', () => ({
  default: class {
    responses = { create };
  },
}));

afterEach(() => {
  vi.unstubAllEnvs();
  create.mockReset();
});

it.each([
  ['openai', 'OPENAI_API_KEY'],
  ['groq', 'GROQ_API_KEY'],
])('caps output on requests to %s', async (provider, key) => {
  vi.stubEnv('AI_PROVIDER', provider);
  vi.stubEnv(key, 'test');
  create.mockResolvedValueOnce({ output_text: ' Reply ' });

  const messages = [{ role: 'user' as const, content: 'Question' }];
  await expect(new AssistantProviderService().generateResponse(messages, null)).resolves.toBe(
    'Reply'
  );
  expect(create).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ max_output_tokens: 2048, input: messages })
  );
});
