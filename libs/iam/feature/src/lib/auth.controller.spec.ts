import type { Request } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

function fakeRequest(headers: Record<string, string>, ip: string): Request {
  return { headers, ip } as unknown as Request;
}

describe('AuthController', () => {
  let controller: AuthController;
  let auth: jest.Mocked<AuthService>;

  beforeEach(() => {
    auth = {
      login: jest.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r' }),
      refresh: jest.fn().mockResolvedValue({ accessToken: 'a2', refreshToken: 'r2' }),
      logout: jest.fn().mockResolvedValue(undefined),
      verifyMfa: jest.fn().mockResolvedValue({ accessToken: 'a3', refreshToken: 'r3' }),
    } as unknown as jest.Mocked<AuthService>;

    controller = new AuthController(auth);
  });

  it('passes request context (user-agent, ip) through to login', async () => {
    const req = fakeRequest({ 'user-agent': 'jest' }, '127.0.0.1');

    await controller.login({ email: 'a@b.com', password: 'x' }, req);

    expect(auth.login).toHaveBeenCalledWith(
      { email: 'a@b.com', password: 'x' },
      { userAgent: 'jest', ipAddress: '127.0.0.1' },
    );
  });

  it('delegates refresh to AuthService', async () => {
    const req = fakeRequest({}, '127.0.0.1');

    await controller.refresh({ refreshToken: 'raw' }, req);

    expect(auth.refresh).toHaveBeenCalledWith('raw', expect.any(Object));
  });

  it('delegates logout to AuthService', async () => {
    await controller.logout({ refreshToken: 'raw' });

    expect(auth.logout).toHaveBeenCalledWith('raw');
  });

  it('passes request context through to verifyMfa, delegating to AuthService', async () => {
    const req = fakeRequest({ 'user-agent': 'jest' }, '127.0.0.1');

    await controller.verifyMfa({ challengeToken: 'ct', code: '123456' }, req);

    expect(auth.verifyMfa).toHaveBeenCalledWith('ct', '123456', {
      userAgent: 'jest',
      ipAddress: '127.0.0.1',
    });
  });
});
