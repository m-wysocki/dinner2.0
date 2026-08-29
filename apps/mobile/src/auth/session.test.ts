import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAuthenticatedState,
  getAuthenticatedState,
  restoreAuthenticatedState,
  setAuthenticatedState,
  subscribeToSession,
} from './session';

const SESSION_KEY = 'dinner.authenticated-session';

const state = {
  session: {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
  },
  user: {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    email: 'user@example.com',
    emailConfirmedAt: '2026-08-27T12:00:00.000Z',
    accessStatus: 'ACTIVE' as const,
    interfaceLanguage: 'pl' as const,
  },
};

describe('session persistence on web', () => {
  beforeEach(() => {
    localStorage.clear();
    clearAuthenticatedState();
  });

  it('persists the authenticated state to localStorage', async () => {
    await setAuthenticatedState(state);
    expect(JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null')).toEqual(
      state,
    );
  });

  it('restores a previously persisted session from localStorage', async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(state));

    await expect(restoreAuthenticatedState()).resolves.toEqual(state);
    expect(getAuthenticatedState()).toEqual(state);
  });

  it('returns null when no session is stored', async () => {
    await expect(restoreAuthenticatedState()).resolves.toBeNull();
    expect(getAuthenticatedState()).toBeNull();
  });

  it('removes expired persisted sessions from localStorage', async () => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        ...state,
        session: { ...state.session, expiresAt: 1 },
      }),
    );

    await expect(restoreAuthenticatedState()).resolves.toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('clears the persisted state on logout', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(state));
    clearAuthenticatedState();
    expect(getAuthenticatedState()).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('notifies subscribers when the authenticated state changes', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToSession(listener);

    await setAuthenticatedState(state);
    expect(listener).toHaveBeenCalledTimes(1);

    clearAuthenticatedState();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    clearAuthenticatedState();
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
