import { Injectable } from '@nestjs/common';
import type { CreateRecipeRequest, RecipeResponse } from '@dinner/shared';
import { recipeResponseSchema } from '@dinner/shared';
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
}
