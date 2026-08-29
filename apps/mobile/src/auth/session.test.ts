import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAuthenticatedState,
  getAuthenticatedState,
  restoreAuthenticatedState,
  setAuthenticatedState,
  subscribeToSession,
} from './session';

const secureStore = vi.hoisted(() => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn().mockResolvedValue(undefined),
  deleteItemAsync: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('expo-secure-store', () => secureStore);

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

describe('session persistence', () => {
  beforeEach(() => {
    clearAuthenticatedState();
    secureStore.getItemAsync.mockReset();
    secureStore.setItemAsync.mockClear();
    secureStore.deleteItemAsync.mockClear();
  });

  it('persists and restores an authenticated state', async () => {
    await setAuthenticatedState(state);
    expect(secureStore.setItemAsync).toHaveBeenCalledWith(
      'dinner.authenticated-session',
      JSON.stringify(state),
    );

    secureStore.getItemAsync.mockResolvedValue(JSON.stringify(state));
    clearAuthenticatedState();

    await expect(restoreAuthenticatedState()).resolves.toEqual(state);
    expect(getAuthenticatedState()).toEqual(state);
  });

  it('removes expired persisted sessions', async () => {
    secureStore.getItemAsync.mockResolvedValue(
      JSON.stringify({
        ...state,
        session: { ...state.session, expiresAt: 1 },
      }),
    );

    await expect(restoreAuthenticatedState()).resolves.toBeNull();
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith(
      'dinner.authenticated-session',
    );
  });

  it('clears the persisted state on logout', () => {
    clearAuthenticatedState();
    expect(getAuthenticatedState()).toBeNull();
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith(
      'dinner.authenticated-session',
    );
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
