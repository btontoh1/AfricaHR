import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

/**
 * Minimal HTTP Basic Auth gate for /api/docs (Swagger UI + its raw
 * JSON/YAML document) in production - those routes are served outside
 * Nest's controller/guard pipeline, so JwtAuthGuard/PermissionsGuard can't
 * protect them. Credential comparison is constant-time, same posture as
 * PaystackClient.verifyWebhookSignature.
 */
export function createSwaggerBasicAuthMiddleware(expectedUser: string, expectedPassword: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const credentials = parseBasicAuthHeader(req.headers.authorization);
    if (
      !credentials ||
      !constantTimeEqual(credentials.user, expectedUser) ||
      !constantTimeEqual(credentials.password, expectedPassword)
    ) {
      res.setHeader('WWW-Authenticate', 'Basic realm="ParotHR API Docs"');
      res.status(401).send('Authentication required');
      return;
    }
    next();
  };
}

function parseBasicAuthHeader(header: string | undefined): { user: string; password: string } | null {
  if (!header) {
    return null;
  }
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) {
    return null;
  }

  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex === -1) {
    return null;
  }
  return { user: decoded.slice(0, separatorIndex), password: decoded.slice(separatorIndex + 1) };
}

function constantTimeEqual(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return timingSafeEqual(actualBuffer, expectedBuffer);
}
