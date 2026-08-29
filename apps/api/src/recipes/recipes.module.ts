import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { RecipesController } from './recipes.controller';
import { IngredientCatalogController } from './ingredient-catalog.controller';
import { IngredientCatalogResolver } from './ingredient-catalog.resolver';
import { RecipesService } from './recipes.service';

@Module({
  imports: [AuthModule, AiModule],
  controllers: [RecipesController, IngredientCatalogController],
  providers: [RecipesService, IngredientCatalogResolver],
  exports: [IngredientCatalogResolver],
})
export class RecipesModule {}
