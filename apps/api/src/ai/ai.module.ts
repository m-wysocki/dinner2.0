import { Module } from '@nestjs/common';
import { OpenAiRecipeExtractionProvider } from './openai-recipe-extraction.provider';
import { RecipeExtractionProvider } from './recipe-extraction.provider';
import { RecipeExtractionService } from './recipe-extraction.service';

@Module({
  providers: [
    RecipeExtractionService,
    {
      provide: RecipeExtractionProvider,
      useClass: OpenAiRecipeExtractionProvider,
    },
  ],
  exports: [RecipeExtractionService],
})
export class AiModule {}
