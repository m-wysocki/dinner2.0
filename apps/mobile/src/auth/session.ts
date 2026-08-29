import type { AuthSession, AuthUserResponse } from '@dinner/shared';
import { authSessionSchema, authUserResponseSchema } from '@dinner/shared';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface AuthenticatedState {
  session: AuthSession;
  user: AuthUserResponse;
}

type SessionListener = () => void;

const listeners = new Set<SessionListener>();

export function subscribeToSession(listener: SessionListener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function notifySessionChanged(): void {
  for (const listener of listeners) {
    listener();
  }
}

let current: AuthenticatedState | null = null;
const SESSION_KEY = 'dinner.authenticated-session';

async function readStoredSession(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(SESSION_KEY) ?? null;
  }

  return SecureStore.getItemAsync(SESSION_KEY);
}

async function writeStoredSession(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(SESSION_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(SESSION_KEY, value);
}

async function deleteStoredSession(): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(SESSION_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(SESSION_KEY);
}

function isSessionValid(state: AuthenticatedState): boolean {
  return state.session.expiresAt > Math.floor(Date.now() / 1000);
}

export async function setAuthenticatedState(
  state: AuthenticatedState,
): Promise<void> {
  current = state;
  try {
    await writeStoredSession(JSON.stringify(state));
  } catch (error) {
    current = null;
    throw error;
  }
  notifySessionChanged();
}

export function getAuthenticatedState(): AuthenticatedState | null {
  return current;
}

export function clearAuthenticatedState(): void {
  current = null;
  void deleteStoredSession().catch(() => undefined);
  notifySessionChanged();
}

export async function restoreAuthenticatedState(): Promise<AuthenticatedState | null> {
  try {
    const serialized = await readStoredSession();
    if (!serialized) {
      return null;
    }

    const stored = JSON.parse(serialized) as {
      session?: unknown;
      user?: unknown;
    };
    const session = authSessionSchema.parse(stored.session);
    const user = authUserResponseSchema.parse(stored.user);
    const state = { session, user };

    if (!isSessionValid(state)) {
      clearAuthenticatedState();
      return null;
    }

    current = state;
    notifySessionChanged();
    return state;
  } catch {
    clearAuthenticatedState();
    return null;
  }
}

export function hasValidAuthenticatedState(): boolean {
  return current !== null && isSessionValid(current);
}
