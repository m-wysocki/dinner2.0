import { confirmEmailRequestSchema } from '@dinner/shared';
import { ApiError, apiClient } from '../api/client';

export type ConfirmEmailResult =
  | { kind: 'success' }
  | { kind: 'invalid'; message: string }
  | { kind: 'error'; message: string };

export async function confirmEmailViaLink(
  url: string,
): Promise<ConfirmEmailResult> {
  const parsed = confirmEmailRequestSchema.safeParse({ url });

  if (!parsed.success) {
    return {
      kind: 'invalid',
      message: 'Link potwierdzający jest nieprawidłowy.',
    };
  }

  try {
    await apiClient.confirmEmail(parsed.data.url);
    return { kind: 'success' };
  } catch (error) {
    if (error instanceof ApiError) {
      return { kind: 'error', message: error.message };
    }

    return { kind: 'error', message: 'Wystąpił nieoczekiwany błąd.' };
  }
}
