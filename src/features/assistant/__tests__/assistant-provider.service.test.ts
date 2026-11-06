import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssistantProviderService } from '../server/services/assistant-provider.service';

afterEach(() => vi.unstubAllEnvs());
describe('assistant configuration', () => {
  it.each(['groq', 'openai'] as const)(
    'uses the shared model override for %s without changing its key',
    (provider) => {
      vi.stubEnv('AI_PROVIDER', provider);
      vi.stubEnv('AI_MODEL', 'chosen-model');
      vi.stubEnv('GROQ_API_KEY', 'fixture-groq');
      vi.stubEnv('OPENAI_API_KEY', 'fixture-openai');
      const service = new AssistantProviderService();
      expect(service.getProvider()).toBe(provider);
      expect(service.getProviderConfig(provider)).toMatchObject({
        model: 'chosen-model',
        apiKey: `fixture-${provider}`,
      });
    }
  );
  it('retains the deployed provider and model aliases during cutover', () => {
    vi.stubEnv('AI_PROVIDER', '');
    vi.stubEnv('AI_MODEL', '');
    vi.stubEnv('GROQ_API_KEY', 'fixture-groq');
    vi.stubEnv('GROQ_MODEL', 'legacy-model');
    const service = new AssistantProviderService();
    expect(service.getProvider()).toBe('groq');
    expect(service.getProviderConfig('groq').model).toBe('legacy-model');
  });
  it('does not fall back to another configured key for an invalid explicit provider', async () => {
    vi.stubEnv('AI_PROVIDER', 'invalid');
    vi.stubEnv('GROQ_API_KEY', 'fixture-groq');
    await expect(new AssistantProviderService().generateResponse([], null)).rejects.toMatchObject({
      statusCode: 503,
    });
  });
  it('fails only assistant requests when its key is absent', async () => {
    vi.stubEnv('AI_PROVIDER', 'openai');
    vi.stubEnv('OPENAI_API_KEY', '');
    await expect(new AssistantProviderService().generateResponse([], null)).rejects.toMatchObject({
      statusCode: 503,
    });
  });
});
