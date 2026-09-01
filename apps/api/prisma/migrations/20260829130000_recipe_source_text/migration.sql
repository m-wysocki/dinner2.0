-- Store the pasted recipe text as provenance for AI-assisted creation.
ALTER TABLE "public"."Recipe" ADD COLUMN "sourceText" TEXT;