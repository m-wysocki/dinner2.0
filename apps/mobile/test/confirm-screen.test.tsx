import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as Linking from 'expo-linking';
import Confirm from '../app/confirm';
import { confirmEmailViaLink } from '../src/auth/confirm';
import { router } from './expo-router-mock';

vi.mock('expo-router', async () => await import('./expo-router-mock'));
vi.mock('expo-linking', () => ({
  getInitialURL: vi.fn(),
  addEventListener: vi.fn(),
}));
vi.mock('../src/auth/confirm', () => ({
  confirmEmailViaLink: vi.fn(),
}));

const getInitialURL = vi.mocked(Linking.getInitialURL);
const addEventListener = vi.mocked(Linking.addEventListener);
const confirmMock = vi.mocked(confirmEmailViaLink);

const url = 'dinner2://confirm#access_token=header.payload.signature';

beforeEach(() => {
  getInitialURL.mockReset();
  addEventListener.mockReset();
  confirmMock.mockReset();
  addEventListener.mockReturnValue({
    remove: vi.fn(),
  } as unknown as ReturnType<typeof Linking.addEventListener>);
  router.push.mockClear();
});

describe('Confirm screen', () => {
  it('renders full-screen without the shell, with a PL/EN toggle in the corner', () => {
    getInitialURL.mockReturnValue(new Promise(() => {}));

    render(<Confirm />);

    // No sidebar navigation, no tab bar.
    expect(screen.queryByText('Kolekcja')).not.toBeInTheDocument();
    expect(screen.queryByText('Dodaj przepis')).not.toBeInTheDocument();
    expect(screen.queryByText('Wyloguj się')).not.toBeInTheDocument();
    // Compact language toggle is available while confirming.
    expect(screen.getByText('PL')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('shows a pending state while the link is being checked', () => {
    getInitialURL.mockReturnValue(new Promise(() => {}));

    render(<Confirm />);

    expect(screen.getByText('Sprawdzanie linku...')).toBeInTheDocument();
    expect(confirmMock).not.toHaveBeenCalled();
  });

  it('confirms the email from the initial deep link and shows success', async () => {
    getInitialURL.mockResolvedValue(url);
    confirmMock.mockResolvedValue({ kind: 'success' });

    render(<Confirm />);

    expect(
      await screen.findByText('Adres e-mail został potwierdzony.'),
    ).toBeInTheDocument();
    expect(confirmMock).toHaveBeenCalledWith(url);
  });

  it('links to the login screen after a successful confirmation', async () => {
    const user = userEvent.setup();
    getInitialURL.mockResolvedValue(url);
    confirmMock.mockResolvedValue({ kind: 'success' });

    render(<Confirm />);

    await user.click(await screen.findByText('Przejdź do logowania'));

    expect(router.push).toHaveBeenCalledWith('/login');
  });

  it('presents the API error message when confirmation fails', async () => {
    getInitialURL.mockResolvedValue(url);
    confirmMock.mockResolvedValue({
      kind: 'error',
      message: 'Link potwierdzający jest nieprawidłowy lub wygasł.',
    });

    render(<Confirm />);

    expect(
      await screen.findByText(
        'Link potwierdzający jest nieprawidłowy lub wygasł.',
      ),
    ).toBeInTheDocument();
  });

  it('explains that no confirmation link was found', async () => {
    getInitialURL.mockResolvedValue(null);

    render(<Confirm />);

    expect(
      await screen.findByText('Nie znaleziono linku potwierdzającego.'),
    ).toBeInTheDocument();
    expect(confirmMock).not.toHaveBeenCalled();
  });

  it('confirms the email from a warm deep-link event', async () => {
    getInitialURL.mockResolvedValue(null);
    confirmMock.mockResolvedValue({ kind: 'success' });

    render(<Confirm />);

    const handler = addEventListener.mock.calls[0][1] as (event: {
      url: string;
    }) => void;
    handler({ url });

    expect(
      await screen.findByText('Adres e-mail został potwierdzony.'),
    ).toBeInTheDocument();
    expect(confirmMock).toHaveBeenCalledWith(url);
  });
});
