import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  createCustomIngredientRequestSchema,
  type CreateCustomIngredientRequest,
  type IngredientCatalogEntry,
} from '@dinner/shared';
import { ActiveAccessGuard } from '../auth/active-access.guard';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { RecipesService } from './recipes.service';

@Controller('api/v1/ingredient-catalog')
@UseGuards(AuthGuard, ActiveAccessGuard)
export class IngredientCatalogController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
  ): Promise<IngredientCatalogEntry[]> {
    return this.recipesService.listCatalog(request.supabaseAuthId!);
  }

  @Post('custom')
  createCustom(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createCustomIngredientRequestSchema))
    input: CreateCustomIngredientRequest,
  ): Promise<IngredientCatalogEntry> {
    return this.recipesService.createCustomIngredient(
      request.supabaseAuthId!,
      input,
    );
  }
}
