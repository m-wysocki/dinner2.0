import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  createRecipeRequestSchema,
  type CreateRecipeRequest,
  type RecipeResponse,
} from '@dinner/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ActiveAccessGuard } from '../auth/active-access.guard';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard';
import { RecipesService } from './recipes.service';

@Controller('api/v1/recipes')
@UseGuards(AuthGuard, ActiveAccessGuard)
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createRecipeRequestSchema))
    input: CreateRecipeRequest,
  ): Promise<RecipeResponse> {
    return this.recipesService.create(request.supabaseAuthId!, input);
  }
}
