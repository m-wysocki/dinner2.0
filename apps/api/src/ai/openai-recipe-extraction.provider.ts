import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Environment } from '../config';
import {
  RecipeExtractionProvider,
  type ExtractedRecipe,
  type IngredientMatch,
  type IngredientMatchInput,
  type RecipeExtractionInput,
} from './recipe-extraction.provider';

const OPENAI_CHAT_COMPLETIONS_URL =
  'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are a recipe extraction assistant. Extract a structured recipe from the pasted source text.

Rules:
- Never translate the recipe. Keep every name, unit, note, and the description in the language of the source text.
- Produce a single, clean description of the dish in the language of the source text that includes the complete preparation method as flowing sentences. Do not split the method into numbered steps.
- Extract every ingredient exactly as listed. Do not invent ingredients that are not present.
- For each ingredient output: name, quantity, unit, and an optional note.
- The name is the ingredient itself, not its modifiers. Move size, ripeness, and quality descriptors into the note: "małe lub średnie śliwki" becomes name "śliwki" with the note "małe lub średnie".
- quantity is a positive decimal without any unit (for example "0.5", "2", "100"), or null when the recipe states no measurable amount (for example "to taste", "szczypta").
- Approximate or range markers do not make a stated amount unknown: "do 300 g", "ok. 40 g", "około 2", "~100 g" all yield the stated number with the canonical unit ("do 300 g" → quantity "300", unit G).
- Map the unit to exactly one canonical unit: G, KG, ML, L, PCS, TSP, TBSP, OTHER. For a unit you cannot map (for example "szklanka", "saszetka"), output OTHER and keep the original unit text in the ingredient note.`;

function buildUserPrompt(input: RecipeExtractionInput): string {
  return `Title: ${input.title}
Serving count: ${input.servingCount}

Recipe text:
${input.sourceText}`;
}

const MATCHING_SYSTEM_PROMPT = `You are an ingredient identity matcher. You map recipe ingredient names onto a catalog of ingredient slugs.

Rules:
- Match each name to the single most appropriate slug from the provided candidate list.
- Slugs may be in a different language than the name (for example the Polish name "mąka" matches the slug "flour"). This is identity matching, not translation.
- Recognize variants of the same ingredient: diminutives, misspellings, synonyms, and plural or grammatical forms (for example "marcheweczka" matches the slug "marchewka").
- Prefer assigning a slug whenever the match is plausible.
- Only when no candidate slug is credible, output slug null and bestCandidate set to the closest candidate slug, if any, otherwise null. Never set bestCandidate when slug is set.
- Never invent slugs. Only use slugs from the provided candidate list.
- Output exactly one result per ingredient name, echoing each name unchanged, in the same order as given.`;

function buildMatchingUserPrompt(input: IngredientMatchInput): string {
  return `Ingredient names:
${input.names.map((name, index) => `${index + 1}. ${name}`).join('\n')}

Candidate slugs:
${input.slugs.join(', ')}`;
}

const MATCHING_RESPONSE_SCHEMA = {
  name: 'ingredient_matches',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['matches'],
    properties: {
      matches: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'slug', 'bestCandidate'],
          properties: {
            name: { type: 'string' },
            slug: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            bestCandidate: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          },
        },
      },
    },
  },
} as const;

const EXTRACTION_RESPONSE_SCHEMA = {
  name: 'extracted_recipe',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['description', 'ingredients'],
    properties: {
      description: { type: 'string' },
      ingredients: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'quantity', 'unit', 'note'],
          properties: {
            name: { type: 'string' },
            quantity: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            unit: {
              type: 'string',
              enum: ['G', 'KG', 'ML', 'L', 'PCS', 'TSP', 'TBSP', 'OTHER'],
            },
            note: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          },
        },
      },
    },
  },
} as const;

@Injectable()
export class OpenAiRecipeExtractionProvider extends RecipeExtractionProvider {
  private readonly logger = new Logger(OpenAiRecipeExtractionProvider.name);

  constructor(
    private readonly configService: ConfigService<Environment, true>,
  ) {
    super();
  }

  async extractRecipe(input: RecipeExtractionInput): Promise<ExtractedRecipe> {
    const apiKey = this.configService.getOrThrow('OPENAI_API_KEY');
    const model = this.configService.getOrThrow('OPENAI_MODEL');

    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(input) },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: EXTRACTION_RESPONSE_SCHEMA,
        },
      }),
    });

    if (!response.ok) {
      this.logger.error(
        `OpenAI extraction provider responded with status ${response.status}`,
      );
      throw new Error('EXTRACTION_PROVIDER_REQUEST_FAILED');
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const content = payload.choices?.[0]?.message?.content;

    if (typeof content !== 'string' || content.length === 0) {
      this.logger.error('OpenAI extraction provider returned no content');
      throw new Error('EXTRACTION_PROVIDER_EMPTY_RESPONSE');
    }

    return JSON.parse(content) as ExtractedRecipe;
  }

  async matchIngredients(
    input: IngredientMatchInput,
  ): Promise<IngredientMatch[]> {
    const apiKey = this.configService.getOrThrow('OPENAI_API_KEY');
    const model = this.configService.getOrThrow('OPENAI_MATCH_MODEL');

    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: MATCHING_SYSTEM_PROMPT },
          { role: 'user', content: buildMatchingUserPrompt(input) },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: MATCHING_RESPONSE_SCHEMA,
        },
      }),
    });

    if (!response.ok) {
      this.logger.error(
        `OpenAI matching provider responded with status ${response.status}`,
      );
      throw new Error('MATCHING_PROVIDER_REQUEST_FAILED');
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const content = payload.choices?.[0]?.message?.content;

    if (typeof content !== 'string' || content.length === 0) {
      this.logger.error('OpenAI matching provider returned no content');
      throw new Error('MATCHING_PROVIDER_EMPTY_RESPONSE');
    }

    const parsed = JSON.parse(content) as { matches?: IngredientMatch[] };
    return parsed.matches ?? [];
  }
}
