import { Injectable } from '@nestjs/common';
import {
  extractRecipeDraftSchema,
  type CustomIngredientProposal,
  type ExtractRecipeDraft,
} from '@dinner/shared';
import { ApiException } from '../common/api-error';
import { PrismaService } from '../prisma.service';

export interface ResolvedIngredientIdentity {
  catalogEntryId: string | null;
  customProposal: CustomIngredientProposal | null;
}

interface CatalogEntryRow {
  id: string;
  namePl: string;
  nameEn: string;
  isSystem: boolean;
  createdAt: Date;
}

export function normalizeIngredientName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[.,;:!?]+/g, ' ')
    .replace(/['"()[\]{}*]+/g, ' ')
    .replace(/(?:^|\s)\d+(?:\.\d+)?(?=\s|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildNormalizedNameIndex(
  entries: CatalogEntryRow[],
): Map<string, CatalogEntryRow> {
  const sorted = [...entries].sort((a, b) => {
    if (a.isSystem !== b.isSystem) {
      return a.isSystem ? -1 : 1;
    }
    return (
      a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id)
    );
  });
  const index = new Map<string, CatalogEntryRow>();
  for (const entry of sorted) {
    const normalizedPl = normalizeIngredientName(entry.namePl);
    const normalizedEn = normalizeIngredientName(entry.nameEn);
    if (normalizedPl && !index.has(normalizedPl)) {
      index.set(normalizedPl, entry);
    }
    if (normalizedEn && !index.has(normalizedEn)) {
      index.set(normalizedEn, entry);
    }
  }
  return index;
}

@Injectable()
export class IngredientCatalogResolver {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(
    supabaseAuthId: string,
    names: string[],
  ): Promise<ResolvedIngredientIdentity[]> {
    const owner = await this.findOwner(supabaseAuthId);
    const entries = await this.prisma.ingredientCatalogEntry.findMany({
      where: {
        isActive: true,
        OR: [{ isSystem: true }, { ownerId: owner.id }],
      },
      select: {
        id: true,
        namePl: true,
        nameEn: true,
        isSystem: true,
        createdAt: true,
      },
    });
    const index = buildNormalizedNameIndex(entries);
    return names.map((name) => this.resolveName(name, index));
  }

  async resolveDraft(
    supabaseAuthId: string,
    draft: ExtractRecipeDraft,
  ): Promise<ExtractRecipeDraft> {
    const identities = await this.resolve(
      supabaseAuthId,
      draft.ingredients.map((ingredient) => ingredient.name),
    );
    const resolved: ExtractRecipeDraft = {
      ...draft,
      ingredients: draft.ingredients.map((ingredient, position) => ({
        ...ingredient,
        catalogEntryId: identities[position].catalogEntryId,
        customProposal: identities[position].customProposal,
      })),
    };
    return extractRecipeDraftSchema.parse(resolved);
  }

  private resolveName(
    name: string,
    index: Map<string, CatalogEntryRow>,
  ): ResolvedIngredientIdentity {
    const normalized = normalizeIngredientName(name);
    const entry = normalized ? index.get(normalized) : undefined;
    if (entry) {
      return { catalogEntryId: entry.id, customProposal: null };
    }
    return {
      catalogEntryId: null,
      customProposal: { namePl: name, nameEn: name },
    };
  }

  private async findOwner(supabaseAuthId: string): Promise<{ id: string }> {
    const owner = await this.prisma.user.findUnique({
      where: { supabaseAuthId },
      select: { id: true },
    });

    if (!owner) {
      throw new ApiException(
        'USER_NOT_FOUND',
        'Nie znaleziono użytkownika.',
        404,
      );
    }

    return owner;
  }
}
