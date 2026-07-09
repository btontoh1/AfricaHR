import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { JwtTokenService } from './jwt-token.service';
import { RequestUser } from './jwt-payload.interface';

export interface AuthenticatedRequest extends Request {
  user: RequestUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: JwtTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    request.user = this.tokens.verifyAccessToken(token);
    return true;
  }

  private extractBearerToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return undefined;
    }
    return header.slice('Bearer '.length);
  }
}
