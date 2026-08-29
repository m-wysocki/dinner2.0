import { Injectable, Logger } from '@nestjs/common';
import {
  extractRecipeDraftSchema,
  type ExtractRecipeDraft,
  type ExtractRecipeRequest,
} from '@dinner/shared';
import { ApiException } from '../common/api-error';
import { RecipeExtractionProvider } from './recipe-extraction.provider';
import { mapUnitToCanonical } from './unit-mapping';

const EXTRACTION_FAILED = {
  message: 'Nie udało się wyodrębnić przepisu. Spróbuj ponownie.',
  status: 502,
};

@Injectable()
export class RecipeExtractionService {
  private readonly logger = new Logger(RecipeExtractionService.name);

  constructor(private readonly provider: RecipeExtractionProvider) {}

  async extract(input: ExtractRecipeRequest): Promise<ExtractRecipeDraft> {
    let extracted;

    try {
      extracted = await this.provider.extractRecipe({
        title: input.title,
        sourceText: input.sourceText,
        servingCount: input.servingCount,
      });
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
      throw this.failed();
    }

    const ingredients = extracted.ingredients.map((ingredient, position) => {
      const mapped = mapUnitToCanonical(ingredient.unit, ingredient.note);
      return {
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: mapped.unit,
        note: mapped.note || null,
        position,
      };
    });

    const preparationSteps = extracted.preparationSteps.map(
      (step, position) => ({
        text: step.text,
        position,
      }),
    );

    const result = extractRecipeDraftSchema.safeParse({
      title: input.title,
      servingCount: input.servingCount,
      description: extracted.description,
      ingredients,
      preparationSteps,
    });

    if (!result.success) {
      this.logger.error(JSON.stringify(result.error.issues));
      throw this.failed();
    }

    return result.data;
  }

  private failed(): ApiException {
    return new ApiException(
      'EXTRACTION_FAILED',
      EXTRACTION_FAILED.message,
      EXTRACTION_FAILED.status,
    );
  }
}
