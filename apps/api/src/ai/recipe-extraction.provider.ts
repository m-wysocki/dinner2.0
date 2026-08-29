import { Injectable } from '@nestjs/common';

export interface RecipeExtractionInput {
  title: string;
  sourceText: string;
  servingCount: number;
}

export interface ExtractedIngredient {
  name: string;
  quantity: string | null;
  unit: string;
  note: string | null;
}

export interface ExtractedPreparationStep {
  text: string;
}

export interface ExtractedRecipe {
  description: string;
  ingredients: ExtractedIngredient[];
  preparationSteps: ExtractedPreparationStep[];
}

@Injectable()
export abstract class RecipeExtractionProvider {
  abstract extractRecipe(
    input: RecipeExtractionInput,
  ): Promise<ExtractedRecipe>;
}
