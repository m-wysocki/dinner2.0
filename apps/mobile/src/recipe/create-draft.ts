import type { ExtractRecipeDraft } from '@dinner/shared';

export interface CreateDraft {
  draft: ExtractRecipeDraft;
  sourceText: string;
}

let current: CreateDraft | null = null;

export function setCreateDraft(draft: CreateDraft): void {
  current = draft;
}

export function getCreateDraft(): CreateDraft | null {
  return current;
}

export function clearCreateDraft(): void {
  current = null;
}
