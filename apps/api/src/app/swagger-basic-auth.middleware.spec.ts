import type { Request, Response } from 'express';
import { createSwaggerBasicAuthMiddleware } from './swagger-basic-auth.middleware';

describe('createSwaggerBasicAuthMiddleware', () => {
  const expectedUser = 'ops';
  const expectedPassword = 'correct-horse-battery-staple';

  function makeResponse(): jest.Mocked<Response> {
    return {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Response>;
  }

  function encode(user: string, password: string): string {
    return `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
  }

  it('calls next() when the credentials match', () => {
    const middleware = createSwaggerBasicAuthMiddleware(expectedUser, expectedPassword);
    const req = { headers: { authorization: encode(expectedUser, expectedPassword) } } as unknown as Request;
    const res = makeResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects with 401 and a WWW-Authenticate challenge when the Authorization header is missing', () => {
    const middleware = createSwaggerBasicAuthMiddleware(expectedUser, expectedPassword);
    const req = { headers: {} } as unknown as Request;
    const res = makeResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('WWW-Authenticate', expect.stringContaining('Basic'));
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('rejects a non-Basic scheme', () => {
    const middleware = createSwaggerBasicAuthMiddleware(expectedUser, expectedPassword);
    const req = { headers: { authorization: 'Bearer some-token' } } as unknown as Request;
    const res = makeResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('rejects a malformed Basic payload with no colon separator', () => {
    const middleware = createSwaggerBasicAuthMiddleware(expectedUser, expectedPassword);
    const req = {
      headers: { authorization: `Basic ${Buffer.from('no-colon-here').toString('base64')}` },
    } as unknown as Request;
    const res = makeResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('rejects the wrong password for the right user', () => {
    const middleware = createSwaggerBasicAuthMiddleware(expectedUser, expectedPassword);
    const req = { headers: { authorization: encode(expectedUser, 'wrong-password') } } as unknown as Request;
    const res = makeResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('rejects the right password for the wrong user', () => {
    const middleware = createSwaggerBasicAuthMiddleware(expectedUser, expectedPassword);
    const req = { headers: { authorization: encode('someone-else', expectedPassword) } } as unknown as Request;
    const res = makeResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('rejects credentials of a different length rather than throwing (constant-time comparison)', () => {
    const middleware = createSwaggerBasicAuthMiddleware(expectedUser, expectedPassword);
    const req = { headers: { authorization: encode(expectedUser, 'short') } } as unknown as Request;
    const res = makeResponse();
    const next = jest.fn();

    expect(() => middleware(req, res, next)).not.toThrow();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
