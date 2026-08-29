import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Environment } from '../config';
import {
  RecipeExtractionProvider,
  type ExtractedRecipe,
  type RecipeExtractionInput,
} from './recipe-extraction.provider';

const OPENAI_CHAT_COMPLETIONS_URL =
  'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';

const SYSTEM_PROMPT = `You are a recipe extraction assistant. Extract a structured recipe from the pasted source text.

Rules:
- Never translate the recipe. Keep every name, unit, note, and preparation step in the language of the source text.
- Produce a short, clean description of the dish in the language of the source text. Do not translate content.
- Extract every ingredient exactly as listed. Do not invent ingredients that are not present.
- For each ingredient output: name as written, quantity as a positive decimal number without any unit (for example "0.5", "2", "100") or null when the recipe does not state a measurable amount (for example "to taste", "szczypta"), the canonical unit, and an optional note preserving extra context such as "chopped".
- Map the unit to exactly one canonical unit: G, KG, ML, L, PCS, TSP, TBSP, OTHER. For a unit you cannot map (for example "szklanka"), output OTHER and keep the original unit text in the ingredient note.
- Output preparation steps in order, each as its own item, preserving the language of the source text.`;

function buildUserPrompt(input: RecipeExtractionInput): string {
  return `Title: ${input.title}
Serving count: ${input.servingCount}

Recipe text:
${input.sourceText}`;
}

const EXTRACTION_RESPONSE_SCHEMA = {
  name: 'extracted_recipe',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['description', 'ingredients', 'preparationSteps'],
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
      preparationSteps: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['text'],
          properties: { text: { type: 'string' } },
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

    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
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
}
