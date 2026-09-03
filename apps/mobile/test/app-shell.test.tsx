import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from '@/components/app-shell';
import { Text } from '@/components/ui/text';
import { router, setPathname } from './expo-router-mock';

vi.mock('expo-router', async () => await import('./expo-router-mock'));

function renderShell(pathname = '/') {
  setPathname(pathname);
  return render(
    <AppShell>
      <Text>Screen content</Text>
    </AppShell>,
  );
}

beforeEach(() => {
  setPathname('/');
  router.push.mockClear();
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
});
