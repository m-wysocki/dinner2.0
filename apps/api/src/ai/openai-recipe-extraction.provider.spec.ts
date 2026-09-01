import { afterEach, describe, expect, it, vi } from 'vitest';
import { OpenAiRecipeExtractionProvider } from './openai-recipe-extraction.provider';

const configService = {
  getOrThrow: (key: string) =>
    key === 'OPENAI_API_KEY'
      ? 'test-openai-key'
      : key === 'OPENAI_MODEL'
        ? 'my-configured-model'
        : key === 'OPENAI_MATCH_MODEL'
          ? 'my-matching-model'
          : undefined,
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
  fetchMock.mockClear();
});

describe('OpenAiRecipeExtractionProvider', () => {
  it('posts the source text to the chat completions endpoint and parses the content', async () => {
    fetchMock.mockResolvedValueOnce(
      okResponse({
        description: 'Kremowa zupa.',
        ingredients: [
          { name: 'Pomidor', quantity: '2', unit: 'PCS', note: null },
        ],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(provider.extractRecipe(input)).resolves.toEqual({
      description: 'Kremowa zupa.',
      ingredients: [
        { name: 'Pomidor', quantity: '2', unit: 'PCS', note: null },
      ],
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
    expect(body.model).toBe('my-configured-model');
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

  it('instructs the model to keep the name clean and to extract approximate amounts', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    await provider.extractRecipe(input).catch(() => undefined);

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init as { body: string }).body);
    const systemMessage = body.messages.find(
      (message: { role: string }) => message.role === 'system',
    );
    expect(systemMessage.content).toContain(
      'The name is the ingredient itself, not its modifiers',
    );
    expect(systemMessage.content).toContain('"do 300 g" → quantity "300"');
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

  it('matches ingredients against the slug list using the matching model', async () => {
    fetchMock.mockResolvedValueOnce(
      okResponse({
        matches: [
          { name: 'Marcheweczka', slug: 'carrot', bestCandidate: null },
          { name: 'Szafran', slug: null, bestCandidate: 'saffron' },
        ],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      provider.matchIngredients({
        names: ['Marcheweczka', 'Szafran'],
        slugs: ['carrot', 'saffron', 'flour'],
      }),
    ).resolves.toEqual([
      { name: 'Marcheweczka', slug: 'carrot', bestCandidate: null },
      { name: 'Szafran', slug: null, bestCandidate: 'saffron' },
    ]);

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init as { body: string }).body);
    expect(body.model).toBe('my-matching-model');
    expect(
      body.messages.find((m: { role: string }) => m.role === 'system').content,
    ).toContain('identity matching, not translation');
    const userMessage = body.messages.find(
      (m: { role: string }) => m.role === 'user',
    );
    expect(userMessage.content).toContain('Marcheweczka');
    expect(userMessage.content).toContain('carrot, saffron, flour');
  });

  it('returns an empty match list when the provider returns no matches', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ matches: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      provider.matchIngredients({ names: ['Szafran'], slugs: ['flour'] }),
    ).resolves.toEqual([]);
  });

  it('throws without leaking the API key when the matching provider responds with an error', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 } as Response);
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      provider.matchIngredients({ names: ['Szafran'], slugs: ['flour'] }),
    ).rejects.toThrow('MATCHING_PROVIDER_REQUEST_FAILED');
    expect(String(fetchMock.mock.results[0].value)).not.toContain(
      'test-openai-key',
    );
  });
});
