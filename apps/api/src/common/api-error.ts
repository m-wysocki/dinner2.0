import type { ApiErrorCode } from '@dinner/shared';

export type { ApiErrorCode } from '@dinner/shared';

export class ApiException extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiException';
  }
}
