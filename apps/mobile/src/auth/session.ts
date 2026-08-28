import type { AuthSession, AuthUserResponse } from '@dinner/shared';

export interface AuthenticatedState {
  session: AuthSession;
  user: AuthUserResponse;
}

let current: AuthenticatedState | null = null;

export function setAuthenticatedState(state: AuthenticatedState): void {
  current = state;
}

export function getAuthenticatedState(): AuthenticatedState | null {
  return current;
}

export function clearAuthenticatedState(): void {
  current = null;
}
