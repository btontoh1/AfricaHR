import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, RequestUser } from './jwt-payload.interface';

const ACCESS_TOKEN_TTL = '15m';

@Injectable()
export class JwtTokenService {
  constructor(private readonly jwtService: JwtService) {}

  signAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_TTL });
  }

  verifyAccessToken(token: string): RequestUser {
    try {
      return this.jwtService.verify<RequestUser>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
