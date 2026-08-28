-- Baseline for the application schema created before migrations were tracked.
CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "public"."AccessStatus" AS ENUM ('PENDING', 'ACTIVE');

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

CREATE UNIQUE INDEX "User_supabaseAuthId_key" ON "public"."User"("supabaseAuthId");
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");
