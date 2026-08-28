import { Injectable } from '@nestjs/common';
import type {
  CreateCustomIngredientRequest,
  CreateRecipeRequest,
  IngredientCatalogEntry,
  RecipeResponse,
} from '@dinner/shared';
import {
  ingredientCatalogEntrySchema,
  recipeResponseSchema,
} from '@dinner/shared';
import { ApiException } from '../common/api-error';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    supabaseAuthId: string,
    input: CreateRecipeRequest,
  ): Promise<RecipeResponse> {
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

    const createData = {
      ownerId: owner.id,
      title: input.title,
      description: input.description || null,
      servingCount: input.servingCount,
    };
    const recipe =
      (input.ingredients?.length ?? 0) === 0
        ? await this.prisma.recipe.create({ data: createData })
        : await this.prisma.$transaction(async (transaction) => {
            for (const ingredient of input.ingredients ?? []) {
              const catalogEntry =
                await transaction.ingredientCatalogEntry.findFirst({
                  where: {
                    id: ingredient.catalogEntryId,
                    isActive: true,
                    OR: [{ isSystem: true }, { ownerId: owner.id }],
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

            return transaction.recipe.create({
              data: {
                ownerId: owner.id,
                title: input.title,
                description: input.description || null,
                servingCount: input.servingCount,
                ingredients: {
                  create: (input.ingredients ?? []).map((ingredient) => ({
                    catalogEntryId: ingredient.catalogEntryId,
                    nameSnapshot: ingredient.name,
                    quantity: ingredient.quantity ?? null,
                    unit: ingredient.unit,
                    note: ingredient.note || null,
                    position: ingredient.position,
                    identityConfirmed: true,
                  })),
                },
              },
              include: { ingredients: true },
            });
          });

    const recipeIngredients = (
      'ingredients' in recipe ? recipe.ingredients : []
    ) as Array<{
      id: string;
      catalogEntryId: string;
      nameSnapshot: string;
      quantity: { toString(): string } | null;
      unit: string;
      note: string | null;
      position: number;
      identityConfirmed: boolean;
    }>;
    return recipeResponseSchema.parse({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      servingCount: recipe.servingCount,
      createdAt: recipe.createdAt.toISOString(),
      updatedAt: recipe.updatedAt.toISOString(),
      ingredients: recipeIngredients.map((ingredient) => ({
        id: ingredient.id,
        catalogEntryId: ingredient.catalogEntryId,
        name: ingredient.nameSnapshot,
        quantity: ingredient.quantity?.toString() ?? null,
        unit: ingredient.unit,
        note: ingredient.note,
        position: ingredient.position,
        identityConfirmed: ingredient.identityConfirmed as true,
      })),
    });
  }

  async listCatalog(supabaseAuthId: string): Promise<IngredientCatalogEntry[]> {
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
}
