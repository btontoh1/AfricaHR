import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './login-form';

const push = jest.fn();
const refresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => new URLSearchParams(),
}));

// Both the email/password step and the MFA-code step are always mounted
// (visibility toggled via CSS, not conditional rendering — see the comment
// in login-form.tsx), so "Sign in" must be matched exactly: a substring/regex
// match like /sign in/i would also hit the always-present "Back to sign in"
// button.
const SIGN_IN_BUTTON = { name: 'Sign in' };

describe('LoginForm', () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
    global.fetch = jest.fn();
  });

  it('shows a validation error for an invalid email without calling the API', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', SIGN_IN_BUTTON));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('submits credentials and redirects on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'admin@africahr.local');
    await user.type(screen.getByLabelText('Password'), 'ChangeMe123Now');
    await user.click(screen.getByRole('button', SIGN_IN_BUTTON));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'admin@africahr.local', password: 'ChangeMe123Now' }),
        }),
      );
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'));
    expect(refresh).toHaveBeenCalled();
  });

  it('posts to the tenant-scoped endpoint and shows the tenant name when tenantSlug is set', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    const user = userEvent.setup();
    render(<LoginForm tenantSlug="acme-co" tenantName="Acme Co" />);

    expect(screen.getByText('Sign in to Acme Co')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Email'), 'hr@acme.com');
    await user.type(screen.getByLabelText('Password'), 'ChangeMe123Now');
    await user.click(screen.getByRole('button', SIGN_IN_BUTTON));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tenants/acme-co/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'hr@acme.com', password: 'ChangeMe123Now' }),
        }),
      );
    });
  });

  it('shows the server error message and does not redirect on failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' }),
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'admin@africahr.local');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', SIGN_IN_BUTTON));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('switches to a code prompt when the account has MFA enabled, then verifies and redirects', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ mfaRequired: true, challengeToken: 'challenge-abc' }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'admin@africahr.local');
    await user.type(screen.getByLabelText('Password'), 'ChangeMe123Now');
    await user.click(screen.getByRole('button', SIGN_IN_BUTTON));

    expect(await screen.findByText('Two-factor authentication')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Code'), '123456');
    await user.click(screen.getByRole('button', { name: /verify/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/mfa/verify',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ challengeToken: 'challenge-abc', code: '123456' }),
        }),
      );
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'));
  });

  it('shows an error and stays on the code prompt when the code is wrong', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ mfaRequired: true, challengeToken: 'challenge-abc' }),
      })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Invalid code' }) });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'admin@africahr.local');
    await user.type(screen.getByLabelText('Password'), 'ChangeMe123Now');
    await user.click(screen.getByRole('button', SIGN_IN_BUTTON));

    await user.type(await screen.findByLabelText('Code'), '000000');
    await user.click(screen.getByRole('button', { name: /verify/i }));

    expect(await screen.findByText('Invalid code')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('clears the error and resets the code field when going back to sign in', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ mfaRequired: true, challengeToken: 'challenge-abc' }),
      })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Invalid code' }) });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'admin@africahr.local');
    await user.type(screen.getByLabelText('Password'), 'ChangeMe123Now');
    await user.click(screen.getByRole('button', SIGN_IN_BUTTON));

    const codeInput = await screen.findByLabelText('Code');
    await user.type(codeInput, '000000');
    await user.click(screen.getByRole('button', { name: /verify/i }));
    expect(await screen.findByText('Invalid code')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /back to sign in/i }));

    expect(screen.queryByText('Invalid code')).not.toBeInTheDocument();
    expect((codeInput as HTMLInputElement).value).toBe('');
  });
});
