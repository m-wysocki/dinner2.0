-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."AccessStatus" AS ENUM ('PENDING', 'ACTIVE');

-- CreateEnum
CREATE TYPE "public"."CanonicalUnit" AS ENUM ('G', 'KG', 'ML', 'L', 'PCS', 'TSP', 'TBSP', 'OTHER');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "supabaseAuthId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailConfirmedAt" TIMESTAMP(3),
    "accessStatus" "public"."AccessStatus" NOT NULL DEFAULT 'PENDING',
    "interfaceLanguage" TEXT NOT NULL DEFAULT 'pl',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Recipe" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "servingCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RecipeIngredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "catalogEntryId" TEXT NOT NULL,
    "nameSnapshot" TEXT NOT NULL,
    "quantity" DECIMAL(20,6),
    "unit" "public"."CanonicalUnit" NOT NULL,
    "note" TEXT,
    "position" INTEGER NOT NULL,
    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PreparationStep" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "PreparationStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IngredientCatalogEntry" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "namePl" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IngredientCatalogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseAuthId_key" ON "public"."User"("supabaseAuthId");
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");
CREATE INDEX "Recipe_ownerId_createdAt_idx" ON "public"."Recipe"("ownerId", "createdAt");
CREATE INDEX "RecipeIngredient_catalogEntryId_idx" ON "public"."RecipeIngredient"("catalogEntryId");
CREATE UNIQUE INDEX "RecipeIngredient_recipeId_position_key" ON "public"."RecipeIngredient"("recipeId", "position");
CREATE UNIQUE INDEX "PreparationStep_recipeId_position_key" ON "public"."PreparationStep"("recipeId", "position");
CREATE UNIQUE INDEX "IngredientCatalogEntry_slug_key" ON "public"."IngredientCatalogEntry"("slug");
CREATE INDEX "IngredientCatalogEntry_ownerId_isActive_idx" ON "public"."IngredientCatalogEntry"("ownerId", "isActive");

-- AddForeignKey
ALTER TABLE "public"."Recipe" ADD CONSTRAINT "Recipe_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "public"."Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_catalogEntryId_fkey" FOREIGN KEY ("catalogEntryId") REFERENCES "public"."IngredientCatalogEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."PreparationStep" ADD CONSTRAINT "PreparationStep_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "public"."Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."IngredientCatalogEntry" ADD CONSTRAINT "IngredientCatalogEntry_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
