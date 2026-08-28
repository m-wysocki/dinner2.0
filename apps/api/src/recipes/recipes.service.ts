import { Injectable } from '@nestjs/common';
import type {
  CreateRecipeRequest,
  RecipeCollectionResponse,
  RecipeResponse,
} from '@dinner/shared';
import {
  recipeDetailsResponseSchema,
  recipeResponseSchema,
} from '@dinner/shared';
import { ApiException } from '../common/api-error';
import { PrismaService } from '../prisma.service';
import { z } from 'zod';

const RECIPE_COLLECTION_LIMIT = 100;

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(supabaseAuthId: string): Promise<RecipeCollectionResponse> {
    const owner = await this.findOwner(supabaseAuthId);

    const recipes = await this.prisma.recipe.findMany({
      where: { ownerId: owner.id },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: RECIPE_COLLECTION_LIMIT,
      include: { preparationSteps: { orderBy: { position: 'asc' } } },
    });

    return recipes.map((recipe) =>
      recipeResponseSchema.parse({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        servingCount: recipe.servingCount,
        createdAt: recipe.createdAt.toISOString(),
        updatedAt: recipe.updatedAt.toISOString(),
        preparationSteps: recipe.preparationSteps.map((step) => ({
          id: step.id,
          text: step.text,
          position: step.position,
        })),
      }),
    );
  }

  async get(supabaseAuthId: string, recipeId: string): Promise<RecipeResponse> {
    const owner = await this.findOwner(supabaseAuthId);
    if (!z.string().uuid().safeParse(recipeId).success) {
      throw new ApiException(
        'RECIPE_NOT_FOUND',
        'Nie znaleziono przepisu.',
        404,
      );
    }
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: recipeId, ownerId: owner.id },
      include: {
        ingredients: { orderBy: { position: 'asc' } },
        preparationSteps: { orderBy: { position: 'asc' } },
      },
    });

    if (!recipe) {
      throw new ApiException(
        'RECIPE_NOT_FOUND',
        'Nie znaleziono przepisu.',
        404,
      );
    }

    return recipeDetailsResponseSchema.parse({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      servingCount: recipe.servingCount,
      ingredients: recipe.ingredients.map((ingredient) =>
        this.toIngredientResponse(ingredient),
      ),
      createdAt: recipe.createdAt.toISOString(),
      updatedAt: recipe.updatedAt.toISOString(),
      preparationSteps: recipe.preparationSteps.map((step) => ({
        id: step.id,
        text: step.text,
        position: step.position,
      })),
    });
  }

  async create(
    supabaseAuthId: string,
    input: CreateRecipeRequest,
  ): Promise<RecipeResponse> {
    const owner = await this.findOwner(supabaseAuthId);

    const recipe = await this.prisma.$transaction((transaction) =>
      transaction.recipe.create({
        data: {
          ownerId: owner.id,
          title: input.title,
          description: input.description || null,
          servingCount: input.servingCount,
          preparationSteps: {
            create: (input.preparationSteps ?? []).map((step) => ({
              text: step.text,
              position: step.position,
            })),
          },
        },
        include: { preparationSteps: true },
      }),
    );

    return recipeResponseSchema.parse({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      servingCount: recipe.servingCount,
      createdAt: recipe.createdAt.toISOString(),
      updatedAt: recipe.updatedAt.toISOString(),
      preparationSteps: (recipe.preparationSteps ?? []).map((step) => ({
        id: step.id,
        text: step.text,
        position: step.position,
      })),
    });
  }

  private toIngredientResponse(ingredient: {
    id: string;
    catalogEntryId: string;
    nameSnapshot: string;
    quantity: { toNumber(): number } | null;
    unit: string;
    note: string | null;
    position: number;
  }) {
    return {
      id: ingredient.id,
      catalogEntryId: ingredient.catalogEntryId,
      name: ingredient.nameSnapshot,
      quantity: ingredient.quantity?.toString() ?? null,
      unit: ingredient.unit,
      note: ingredient.note,
      position: ingredient.position,
    };
  }

  private async findOwner(supabaseAuthId: string): Promise<{ id: string }> {
    const owner = await this.prisma.user.findUnique({
      where: { supabaseAuthId },
      select: { id: true },
    });

    if (!owner) {
      throw new ApiException(
        'USER_NOT_FOUND',
        'Nie znaleziono użytkownika.',
        404,
      );
    }

    return owner;
  }
}
