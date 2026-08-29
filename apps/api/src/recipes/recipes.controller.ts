import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  createRecipeRequestSchema,
  updateRecipeRequestSchema,
  type CreateRecipeRequest,
  type RecipeResponse,
  type RecipeCollectionResponse,
  type UpdateRecipeRequest,
} from '@dinner/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ActiveAccessGuard } from '../auth/active-access.guard';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard';
import { RecipesService } from './recipes.service';

@Controller('api/v1/recipes')
@UseGuards(AuthGuard, ActiveAccessGuard)
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
  ): Promise<RecipeCollectionResponse> {
    return this.recipesService.list(request.supabaseAuthId!);
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createRecipeRequestSchema))
    input: CreateRecipeRequest,
  ): Promise<RecipeResponse> {
    return this.recipesService.create(request.supabaseAuthId!, input);
  }

  @Get(':id')
  get(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<RecipeResponse> {
    return this.recipesService.get(request.supabaseAuthId!, id);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateRecipeRequestSchema))
    input: UpdateRecipeRequest,
  ): Promise<RecipeResponse> {
    return this.recipesService.update(request.supabaseAuthId!, id, input);
  }
}
