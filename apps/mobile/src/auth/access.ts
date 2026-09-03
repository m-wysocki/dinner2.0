import type { AuthenticatedState } from './session';

export function isAccessActive(state: AuthenticatedState): boolean {
  return (
    state.user.accessStatus === 'ACTIVE' && Boolean(state.user.emailConfirmedAt)
  );
}
