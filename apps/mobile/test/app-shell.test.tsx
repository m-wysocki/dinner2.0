import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from '@/components/app-shell';
import { Text } from '@/components/ui/text';
import { router, setPathname } from './expo-router-mock';
import {
  clearAuthenticatedState,
  getAuthenticatedState,
  setAuthenticatedState,
} from '../src/auth/session';

vi.mock('expo-router', async () => await import('./expo-router-mock'));

function renderShell(pathname = '/') {
  setPathname(pathname);
  return render(
    <AppShell>
      <Text>Screen content</Text>
    </AppShell>,
  );
}

const activeState = {
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

beforeEach(() => {
  setPathname('/');
  clearAuthenticatedState();
  router.push.mockClear();
  router.replace.mockClear();
});

describe('AppShell', () => {
  const iconClassOf = (label: HTMLElement) =>
    label.previousElementSibling?.getAttribute('class') ?? '';

  it('renders the three destinations in both the sidebar and the tab bar', () => {
    renderShell();

    // The home screen title in the top app bar reuses the collection label.
    expect(screen.getAllByText('Kolekcja')).toHaveLength(3);
    expect(screen.getAllByText('Dodaj przepis')).toHaveLength(2);
    expect(screen.getAllByText('Użytkownik')).toHaveLength(2);
    expect(screen.getByText('Screen content')).toBeInTheDocument();
  });

  it('offers only the account destination while access is pending', async () => {
    await setAuthenticatedState({
      ...activeState,
      user: {
        ...activeState.user,
        email: 'pending@example.com',
        emailConfirmedAt: null,
        accessStatus: 'PENDING',
      },
    });
    renderShell('/user');

    expect(screen.getAllByText('Użytkownik')).toHaveLength(3);
    expect(screen.queryByText('Kolekcja')).not.toBeInTheDocument();
    expect(screen.queryByText('Dodaj przepis')).not.toBeInTheDocument();
  });

  it('highlights the active destination in the sidebar and the tab bar', () => {
    renderShell('/create-recipe');

    // With the CSS-interop stubbed out, the active tint survives in the test
    // DOM only on the icon, which receives its className directly.
    expect(iconClassOf(screen.getAllByText('Dodaj przepis')[0])).toContain(
      'text-brand',
    );
    expect(iconClassOf(screen.getAllByText('Dodaj przepis')[1])).toContain(
      'text-brand',
    );
    expect(iconClassOf(screen.getAllByText('Kolekcja')[0])).toContain(
      'text-muted-foreground',
    );
  });

  it('keeps a destination highlighted on its flow sub-routes', () => {
    renderShell('/create-recipe/review');

    expect(iconClassOf(screen.getAllByText('Dodaj przepis')[0])).toContain(
      'text-brand',
    );
  });

  it('does not highlight any destination on a detail route', () => {
    renderShell('/recipes/recipe-1');

    for (const label of [
      ...screen.getAllByText('Kolekcja'),
      ...screen.getAllByText('Użytkownik'),
    ]) {
      expect(iconClassOf(label)).toContain('text-muted-foreground');
    }
  });

  it('navigates to a destination from the tab bar', async () => {
    const user = userEvent.setup();
    renderShell();

    const [sidebarAddRecipe, tabAddRecipe] =
      screen.getAllByText('Dodaj przepis');

    await user.click(tabAddRecipe);
    expect(router.push).toHaveBeenCalledWith('/create-recipe');

    router.push.mockClear();
    await user.click(sidebarAddRecipe);
    expect(router.push).toHaveBeenCalledWith('/create-recipe');
  });

  it('shows the current screen title in the mobile top app bar', () => {
    renderShell('/recipes/recipe-1');
    expect(screen.getByText('Przepis')).toBeInTheDocument();

    cleanup();

    renderShell('/create-recipe/review');
    expect(screen.getByText('Przejrzyj przepis')).toBeInTheDocument();

    cleanup();

    renderShell('/user');
    expect(screen.getAllByText('Użytkownik')).toHaveLength(3);
  });

  it('renders the language toggle in the sidebar and in the top app bar', () => {
    renderShell();

    expect(screen.getAllByText('PL')).toHaveLength(2);
    expect(screen.getAllByText('EN')).toHaveLength(2);
  });

  it('hides the user menu when there is no session', () => {
    renderShell();

    expect(screen.queryByText('user@example.com')).not.toBeInTheDocument();
  });

  it('shows the signed-in email in the sidebar with an expandable sign-out menu', async () => {
    await setAuthenticatedState(activeState);
    const user = userEvent.setup();
    renderShell();

    // The email appears only once: in the sidebar user control.
    expect(screen.getAllByText('user@example.com')).toHaveLength(1);
    expect(screen.queryByText('Wyloguj się')).not.toBeInTheDocument();

    await user.click(screen.getByText('user@example.com'));
    expect(screen.getByText('Wyloguj się')).toBeInTheDocument();
  });

  it('signs out from the user menu without a confirmation and lands on login', async () => {
    await setAuthenticatedState(activeState);
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByText('user@example.com'));
    await user.click(screen.getByText('Wyloguj się'));

    expect(router.replace).toHaveBeenCalledWith('/login');
    expect(getAuthenticatedState()).toBeNull();
    // The menu closes on selection.
    expect(screen.queryByText('Wyloguj się')).not.toBeInTheDocument();
    expect(screen.queryByText('user@example.com')).not.toBeInTheDocument();
  });

  it('closes the user menu on an interaction outside of it', async () => {
    await setAuthenticatedState(activeState);
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByText('user@example.com'));
    expect(screen.getByText('Wyloguj się')).toBeInTheDocument();

    await user.click(screen.getByText('Screen content'));
    expect(screen.queryByText('Wyloguj się')).not.toBeInTheDocument();
  });
});
