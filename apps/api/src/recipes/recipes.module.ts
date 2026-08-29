import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { RecipesController } from './recipes.controller';
import { IngredientCatalogController } from './ingredient-catalog.controller';
import { RecipesService } from './recipes.service';

@Module({
  imports: [AuthModule, AiModule],
  controllers: [RecipesController, IngredientCatalogController],
  providers: [RecipesService],
})
export class RecipesModule {}
