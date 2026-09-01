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

export interface ExtractedRecipe {
  description: string;
  ingredients: ExtractedIngredient[];
}

export interface IngredientMatchInput {
  names: string[];
  slugs: string[];
}

export interface IngredientMatch {
  name: string;
  slug: string | null;
  bestCandidate: string | null;
}

@Injectable()
export abstract class RecipeExtractionProvider {
  abstract extractRecipe(
    input: RecipeExtractionInput,
  ): Promise<ExtractedRecipe>;
  abstract matchIngredients(
    input: IngredientMatchInput,
  ): Promise<IngredientMatch[]>;
}
