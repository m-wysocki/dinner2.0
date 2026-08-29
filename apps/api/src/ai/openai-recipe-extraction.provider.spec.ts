import { afterEach, describe, expect, it, vi } from 'vitest';
import { OpenAiRecipeExtractionProvider } from './openai-recipe-extraction.provider';

const configService = {
  getOrThrow: (key: string) =>
    key === 'OPENAI_API_KEY' ? 'test-openai-key' : undefined,
} as never;

const provider = new OpenAiRecipeExtractionProvider(configService);

const input = {
  title: 'Zupa pomidorowa',
  sourceText: 'Składniki: 2 pomidory, 200 g mąki. Gotuj pomidory.',
  servingCount: 4,
};

function okResponse(content: unknown): Response {
  return {
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
  } as Response;
}

const fetchMock = vi.fn();

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('OpenAiRecipeExtractionProvider', () => {
  it('posts the source text to the chat completions endpoint and parses the content', async () => {
    fetchMock.mockResolvedValueOnce(
      okResponse({
        description: 'Kremowa zupa.',
        ingredients: [
          { name: 'Pomidor', quantity: '2', unit: 'PCS', note: null },
        ],
        preparationSteps: [{ text: 'Gotuj pomidory' }],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(provider.extractRecipe(input)).resolves.toEqual({
      description: 'Kremowa zupa.',
      ingredients: [
        { name: 'Pomidor', quantity: '2', unit: 'PCS', note: null },
      ],
      preparationSteps: [{ text: 'Gotuj pomidory' }],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-openai-key',
        }),
      }),
    );
  });

  it('requests structured outputs constrained to the canonical unit enum', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    await provider.extractRecipe(input).catch(() => undefined);

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init as { body: string }).body);
    expect(body.model).toBe('gpt-4o-mini');
    expect(body.response_format.type).toBe('json_schema');
    expect(body.response_format.json_schema.name).toBe('extracted_recipe');
    const unitProperty =
      body.response_format.json_schema.schema.properties.ingredients.items
        .properties.unit;
    expect(unitProperty.enum).toEqual([
      'G',
      'KG',
      'ML',
      'L',
      'PCS',
      'TSP',
      'TBSP',
      'OTHER',
    ]);
    const userMessage = body.messages.find(
      (message: { role: string }) => message.role === 'user',
    );
    expect(userMessage.content).toContain('Zupa pomidorowa');
    expect(userMessage.content).toContain('Składniki: 2 pomidory, 200 g mąki.');
  });

  it('throws without leaking the API key when the provider responds with an error', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 } as Response);
    vi.stubGlobal('fetch', fetchMock);

    await expect(provider.extractRecipe(input)).rejects.toThrow(
      'EXTRACTION_PROVIDER_REQUEST_FAILED',
    );
    expect(String(fetchMock.mock.results[0].value)).not.toContain(
      'test-openai-key',
    );
  });

  it('throws when the provider returns no message content', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: {} }] }),
    } as Response);
    vi.stubGlobal('fetch', fetchMock);

    await expect(provider.extractRecipe(input)).rejects.toThrow(
      'EXTRACTION_PROVIDER_EMPTY_RESPONSE',
    );
  });

  it('throws when the payload cannot be reached at all', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [] }),
    } as Response);
    vi.stubGlobal('fetch', fetchMock);

    await expect(provider.extractRecipe(input)).rejects.toThrow(
      'EXTRACTION_PROVIDER_EMPTY_RESPONSE',
    );
  });
});
