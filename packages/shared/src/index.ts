import { z } from 'zod';

export const interfaceLanguageSchema = z.enum(['pl', 'en']);
export type InterfaceLanguage = z.infer<typeof interfaceLanguageSchema>;

export const accessStatusSchema = z.enum(['PENDING', 'ACTIVE']);
export type AccessStatus = z.infer<typeof accessStatusSchema>;

export const canonicalUnitSchema = z.enum([
  'G',
  'KG',
  'ML',
  'L',
  'PCS',
  'TSP',
  'TBSP',
  'OTHER',
]);
export type CanonicalUnit = z.infer<typeof canonicalUnitSchema>;

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('api'),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const registerRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(72),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const authUserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  emailConfirmedAt: z.string().datetime().nullable(),
  accessStatus: accessStatusSchema,
  interfaceLanguage: interfaceLanguageSchema,
});
export type AuthUserResponse = z.infer<typeof authUserResponseSchema>;

export type RegisterResponse = AuthUserResponse;
export type ConfirmEmailResponse = AuthUserResponse;

export const confirmEmailRequestSchema = z.object({
  url: z.string().min(1),
});
export type ConfirmEmailRequest = z.infer<typeof confirmEmailRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(72),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const authSessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.number().positive(),
});
export type AuthSession = z.infer<typeof authSessionSchema>;

export const loginResponseSchema = authSessionSchema.extend({
  user: authUserResponseSchema,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const preparationStepRequestSchema = z.object({
  text: z.string().trim().min(1).max(5000),
  position: z.number().int().min(0),
});
export type PreparationStepRequest = z.infer<
  typeof preparationStepRequestSchema
>;

const hasConsecutivePositions = (items: Array<{ position: number }>): boolean =>
  items.every((item, index) => item.position === index);

const preparationStepsSchema = z
  .array(preparationStepRequestSchema)
  .superRefine((steps, context) => {
    if (!hasConsecutivePositions(steps)) {
      context.addIssue({
        code: 'custom',
        message: 'Preparation steps must have consecutive positions',
      });
    }
  });

export const apiErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'EMAIL_ALREADY_REGISTERED',
  'REGISTRATION_FAILED',
  'INVALID_CONFIRMATION_LINK',
  'EMAIL_NOT_CONFIRMED',
  'USER_NOT_FOUND',
  'INVALID_CREDENTIALS',
  'ACCESS_PENDING',
  'RECIPE_NOT_FOUND',
  'HTTP_ERROR',
  'INTERNAL_ERROR',
  'INGREDIENT_NOT_FOUND',
  'INGREDIENT_NOT_ACCESSIBLE',
  'INGREDIENT_NAME_TAKEN',
]);
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export const apiErrorDetailSchema = z.object({
  path: z.string(),
  message: z.string(),
});
export type ApiErrorDetail = z.infer<typeof apiErrorDetailSchema>;

export const apiErrorSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    details: z.array(apiErrorDetailSchema).optional(),
  }),
});
export type ApiErrorBody = z.infer<typeof apiErrorSchema>;

const decimalSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,6})?$/, 'Quantity must be a positive decimal')
  .refine((value) => Number(value) > 0, 'Quantity must be greater than zero');

export const recipeIngredientRequestSchema = z.object({
  catalogEntryId: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  quantity: decimalSchema.nullable().optional(),
  unit: canonicalUnitSchema,
  note: z.string().trim().max(500).optional(),
  position: z.number().int().min(0),
});
export type RecipeIngredientRequest = z.infer<
  typeof recipeIngredientRequestSchema
>;

const recipeIngredientsSchema = z
  .array(recipeIngredientRequestSchema)
  .superRefine((ingredients, context) => {
    if (!hasConsecutivePositions(ingredients)) {
      context.addIssue({
        code: 'custom',
        message: 'Ingredients must have consecutive positions',
      });
    }
  });

export const recipeIngredientResponseSchema = z.object({
  id: z.string().uuid(),
  catalogEntryId: z.string().uuid(),
  name: z.string(),
  quantity: z.string().nullable(),
  unit: canonicalUnitSchema,
  note: z.string().nullable(),
  position: z.number().int().min(0),
});
export type RecipeIngredientResponse = z.infer<
  typeof recipeIngredientResponseSchema
>;

export const createCustomIngredientRequestSchema = z.object({
  name: z.string().trim().min(1).max(200),
});
export type CreateCustomIngredientRequest = z.infer<
  typeof createCustomIngredientRequestSchema
>;

export const ingredientCatalogEntrySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  namePl: z.string(),
  nameEn: z.string(),
  isSystem: z.boolean(),
});
export type IngredientCatalogEntry = z.infer<
  typeof ingredientCatalogEntrySchema
>;

export const createRecipeRequestSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  servingCount: z.number().int().min(1).max(1000),
  ingredients: recipeIngredientsSchema.optional(),
  preparationSteps: preparationStepsSchema.optional(),
});
export type CreateRecipeRequest = z.infer<typeof createRecipeRequestSchema>;

export const updateRecipeRequestSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  servingCount: z.number().int().min(1).max(1000),
  ingredients: recipeIngredientsSchema,
  preparationSteps: preparationStepsSchema,
});
export type UpdateRecipeRequest = z.infer<typeof updateRecipeRequestSchema>;

export const recipeResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  servingCount: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  ingredients: z.array(recipeIngredientResponseSchema).optional(),
  preparationSteps: z
    .array(
      preparationStepRequestSchema.extend({
        id: z.string().uuid(),
      }),
    )
    .optional(),
});
export type RecipeResponse = z.infer<typeof recipeResponseSchema>;

export const recipeDetailsResponseSchema = recipeResponseSchema.extend({
  ingredients: z.array(recipeIngredientResponseSchema),
  preparationSteps: z.array(
    preparationStepRequestSchema.extend({
      id: z.string().uuid(),
    }),
  ),
});
export type RecipeDetailsResponse = z.infer<typeof recipeDetailsResponseSchema>;

export const recipeCollectionResponseSchema = z.array(recipeResponseSchema);
export type RecipeCollectionResponse = z.infer<
  typeof recipeCollectionResponseSchema
>;
