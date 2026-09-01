import { Injectable, Logger } from '@nestjs/common';
import {
  extractRecipeDraftSchema,
  type CustomIngredientProposal,
  type ExtractRecipeDraft,
  type RawExtractRecipeDraft,
} from '@dinner/shared';
import {
  RecipeExtractionProvider,
  type IngredientMatch,
} from '../ai/recipe-extraction.provider';
import { ApiException } from '../common/api-error';
import { PrismaService } from '../prisma.service';

export interface ResolvedIngredientIdentity {
  catalogEntryId: string | null;
  customProposal: CustomIngredientProposal | null;
}

interface CatalogEntryRow {
  id: string;
  slug: string;
  namePl: string;
  nameEn: string;
  isSystem: boolean;
  createdAt: Date;
}

interface AiResolvedIdentity {
  catalogEntryId: string | null;
  bestCandidate: string | null;
}

export function normalizeIngredientName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[.,;:!?/\-–—]+/g, ' ')
    .replace(/['"()[\]{}*]+/g, ' ')
    .replace(/^[\d.,]+[a-z%]*\s*/, '')
    .replace(/\s+[\d.,]+[a-z%]*$/, '')
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
  private readonly logger = new Logger(IngredientCatalogResolver.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: RecipeExtractionProvider,
  ) {}

  async resolve(
    supabaseAuthId: string,
    names: string[],
  ): Promise<ResolvedIngredientIdentity[]> {
    const owner = await this.findOwner(supabaseAuthId);
    const entries = await this.loadEntries(owner.id);
    const index = buildNormalizedNameIndex(entries);
    return names.map((name) => this.resolveName(name, index));
  }

  async resolveDraft(
    supabaseAuthId: string,
    draft: RawExtractRecipeDraft,
  ): Promise<ExtractRecipeDraft> {
    const owner = await this.findOwner(supabaseAuthId);
    const entries = await this.loadEntries(owner.id);
    const index = buildNormalizedNameIndex(entries);
    const identities = draft.ingredients.map((ingredient) =>
      this.resolveName(ingredient.name, index),
    );
    const slugIndex = new Map(
      entries.map((entry) => [entry.slug, entry] as const),
    );
    const aiMatches = await this.matchUnmatchedWithProvider(
      draft,
      identities,
      slugIndex,
    );
    const resolved = {
      ...draft,
      ingredients: draft.ingredients.map((ingredient, position) => {
        const identity = identities[position];
        const ai = aiMatches.get(position);
        const catalogEntryId =
          identity.catalogEntryId ?? ai?.catalogEntryId ?? null;
        const bestCandidate =
          catalogEntryId === null ? (ai?.bestCandidate ?? null) : null;
        return {
          ...ingredient,
          catalogEntryId,
          customProposal:
            catalogEntryId === null ? identity.customProposal : null,
          bestCandidate,
        };
      }),
    };
    return extractRecipeDraftSchema.parse(resolved);
  }

  private async matchUnmatchedWithProvider(
    draft: RawExtractRecipeDraft,
    identities: ResolvedIngredientIdentity[],
    slugIndex: Map<string, CatalogEntryRow>,
  ): Promise<Map<number, AiResolvedIdentity>> {
    const result = new Map<number, AiResolvedIdentity>();
    const unmatched = draft.ingredients
      .map((ingredient, position) => ({
        position,
        name: ingredient.name,
        identity: identities[position],
      }))
      .filter(({ identity }) => identity.catalogEntryId === null);

    if (unmatched.length === 0 || slugIndex.size === 0) {
      return result;
    }

    let matches: IngredientMatch[] = [];
    try {
      matches = await this.provider.matchIngredients({
        names: unmatched.map(({ name }) => name),
        slugs: [...slugIndex.keys()],
      });
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
      return result;
    }

    const byName = new Map<string, IngredientMatch>();
    for (const match of matches) {
      if (!match || typeof match.name !== 'string') {
        continue;
      }
      if (!byName.has(match.name)) {
        byName.set(match.name, match);
      }
    }

    for (const { position, name } of unmatched) {
      const match = byName.get(name);
      if (!match) {
        continue;
      }
      const entry = match.slug ? slugIndex.get(match.slug) : undefined;
      const catalogEntryId = entry ? entry.id : null;
      const best = match.bestCandidate
        ? slugIndex.get(match.bestCandidate)
        : undefined;
      result.set(position, {
        catalogEntryId,
        bestCandidate: catalogEntryId === null && best ? best.slug : null,
      });
    }

    return result;
  }

  private async loadEntries(ownerId: string): Promise<CatalogEntryRow[]> {
    return this.prisma.ingredientCatalogEntry.findMany({
      where: {
        isActive: true,
        OR: [{ isSystem: true }, { ownerId }],
      },
      select: {
        id: true,
        slug: true,
        namePl: true,
        nameEn: true,
        isSystem: true,
        createdAt: true,
      },
    });
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
