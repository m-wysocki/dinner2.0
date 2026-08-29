import { Injectable } from '@nestjs/common';
import type {
  CreateCustomIngredientRequest,
  CreateRecipeRequest,
  IngredientCatalogEntry,
  RecipeCollectionResponse,
  RecipeIngredientRequest,
  RecipeResponse,
  UpdateRecipeRequest,
} from '@dinner/shared';
import {
  ingredientCatalogEntrySchema,
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

    const recipe = await this.prisma.$transaction(async (transaction) => {
      await this.assertAccessibleIngredients(transaction, owner.id, input, {
        requireActive: true,
      });
      return transaction.recipe.create({
        data: {
          ownerId: owner.id,
          title: input.title,
          description: input.description || null,
          servingCount: input.servingCount,
          ingredients: {
            create: (input.ingredients ?? []).map((ingredient) =>
              this.toIngredientCreate(ingredient),
            ),
          },
          preparationSteps: {
            create: (input.preparationSteps ?? []).map((step) => ({
              text: step.text,
              position: step.position,
            })),
          },
        },
        include: {
          ingredients: true,
          preparationSteps: true,
        },
      });
    });

    return recipeResponseSchema.parse({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      servingCount: recipe.servingCount,
      createdAt: recipe.createdAt.toISOString(),
      updatedAt: recipe.updatedAt.toISOString(),
      ingredients: recipe.ingredients.map((ingredient) =>
        this.toIngredientResponse(ingredient),
      ),
      preparationSteps: (recipe.preparationSteps ?? []).map((step) => ({
        id: step.id,
        text: step.text,
        position: step.position,
      })),
    });
  }

  async update(
    supabaseAuthId: string,
    recipeId: string,
    input: UpdateRecipeRequest,
  ): Promise<RecipeResponse> {
    const owner = await this.findOwner(supabaseAuthId);
    if (!z.string().uuid().safeParse(recipeId).success) {
      throw new ApiException(
        'RECIPE_NOT_FOUND',
        'Nie znaleziono przepisu.',
        404,
      );
    }

    const recipe = await this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.recipe.findFirst({
        where: { id: recipeId, ownerId: owner.id },
        select: { id: true },
      });
      if (!existing) {
        throw new ApiException(
          'RECIPE_NOT_FOUND',
          'Nie znaleziono przepisu.',
          404,
        );
      }
      await this.assertAccessibleIngredients(transaction, owner.id, input, {
        requireActive: false,
      });
      return transaction.recipe.update({
        where: { id: recipeId },
        data: {
          title: input.title,
          description: input.description || null,
          servingCount: input.servingCount,
          ingredients: {
            deleteMany: {},
            create: input.ingredients.map((ingredient) =>
              this.toIngredientCreate(ingredient),
            ),
          },
          preparationSteps: {
            deleteMany: {},
            create: input.preparationSteps.map((step) => ({
              text: step.text,
              position: step.position,
            })),
          },
        },
        include: {
          ingredients: true,
          preparationSteps: true,
        },
      });
    });

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

  async listCatalog(supabaseAuthId: string): Promise<IngredientCatalogEntry[]> {
    const owner = await this.findOwner(supabaseAuthId);
    const entries = await this.prisma.ingredientCatalogEntry.findMany({
      where: {
        isActive: true,
        OR: [{ isSystem: true }, { ownerId: owner.id }],
      },
      orderBy: [{ namePl: 'asc' }],
    });
    return entries.map((entry) => ingredientCatalogEntrySchema.parse(entry));
  }

  async createCustomIngredient(
    supabaseAuthId: string,
    input: CreateCustomIngredientRequest,
  ): Promise<IngredientCatalogEntry> {
    const owner = await this.findOwner(supabaseAuthId);
    const slug = `${input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}-${owner.id.slice(0, 8)}`;
    const existing = await this.prisma.ingredientCatalogEntry.findFirst({
      where: {
        ownerId: owner.id,
        namePl: { equals: input.name, mode: 'insensitive' },
      },
    });
    if (existing) {
      throw new ApiException(
        'INGREDIENT_NAME_TAKEN',
        'Taki własny składnik już istnieje.',
        409,
      );
    }
    const entry = await this.prisma.ingredientCatalogEntry.create({
      data: {
        slug,
        namePl: input.name,
        nameEn: input.name,
        isSystem: false,
        ownerId: owner.id,
      },
    });
    return ingredientCatalogEntrySchema.parse(entry);
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

  private toIngredientCreate(ingredient: RecipeIngredientRequest) {
    return {
      catalogEntryId: ingredient.catalogEntryId,
      nameSnapshot: ingredient.name,
      quantity: ingredient.quantity ?? null,
      unit: ingredient.unit,
      note: ingredient.note || null,
      position: ingredient.position,
      identityConfirmed: true,
    };
  }

  private async assertAccessibleIngredients(
    transaction: {
      ingredientCatalogEntry: {
        findFirst(args: unknown): Promise<unknown>;
      };
    },
    ownerId: string,
    input: { ingredients?: Array<{ catalogEntryId: string }> },
    options: { requireActive?: boolean } = {},
  ) {
    for (const ingredient of input.ingredients ?? []) {
      const catalogEntry = await transaction.ingredientCatalogEntry.findFirst({
        where: {
          id: ingredient.catalogEntryId,
          ...(options.requireActive === false ? {} : { isActive: true }),
          OR: [{ isSystem: true }, { ownerId }],
        },
      });
      if (!catalogEntry) {
        throw new ApiException(
          'INGREDIENT_NOT_ACCESSIBLE',
          'Wybrany składnik nie jest dostępny.',
          422,
        );
      }
    }
  }
}
